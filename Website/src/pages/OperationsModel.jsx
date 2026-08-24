import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Mail,
  Map,
  Package,
  RefreshCw,
  Route,
  ShieldCheck,
  Truck,
  UserCheck,
  Users,
} from "lucide-react";
import {
  getActivity,
  getApprovals,
  getDrivers,
  getExceptions,
  getJobs,
  getOperationsSnapshot,
  getPolicies,
  getStoreOrders,
  runNewOrderWorkflow,
  updatePolicies,
} from "../services/api";

const ICONS = {
  operations: Bot,
  orders: Package,
  planning: ClipboardCheck,
  live: Activity,
  exceptions: AlertTriangle,
  approvals: ShieldCheck,
  routes: Route,
  drivers: UserCheck,
  vehicles: Truck,
  customers: Users,
  communications: Mail,
  activity: Activity,
  intelligence: Map,
  policies: ShieldCheck,
};

function fmt(n) {
  return Number(n || 0).toLocaleString();
}

function time(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function PageHeader({ title, body, icon }) {
  const Icon = ICONS[icon] || Bot;
  return (
    <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg bg-[#E6F4F4] text-[#008080] flex items-center justify-center">
            <Icon size={17} strokeWidth={1.8} />
          </span>
          <h1 className="text-[24px] sm:text-[28px] font-semibold text-[#111315] tracking-tight">{title}</h1>
        </div>
        <p className="text-[13px] sm:text-[14px] text-[#868E96] mt-2 max-w-2xl">{body}</p>
      </div>
    </div>
  );
}

function Metric({ label, value, tone = "neutral" }) {
  const tones = {
    neutral: "bg-white border-[#E9ECEF]",
    good: "bg-[#F0FDF4] border-[#BBF7D0]",
    warn: "bg-[#FFF7ED] border-[#FED7AA]",
  };
  return (
    <div className={`rounded-lg border p-4 ${tones[tone] || tones.neutral}`}>
      <p className="text-[12px] text-[#868E96]">{label}</p>
      <p className="text-[24px] font-semibold text-[#111315] tabular-nums mt-1">{value}</p>
    </div>
  );
}

function ActivityList({ entries = [] }) {
  if (!entries.length) {
    return <p className="text-[13px] text-[#868E96]">No activity has been recorded for this tenant yet.</p>;
  }
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-lg border border-[#E9ECEF] bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-[#111315]">{entry.summary}</p>
            <span className="text-[11px] text-[#ADB5BD] whitespace-nowrap">{time(entry.created_at)}</span>
          </div>
          <p className="text-[11px] text-[#868E96] mt-1">
            {entry.actor || "system"} · {entry.action_type || "activity"}
            {entry.requires_approval ? " · approval required" : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="space-y-3">
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-24 w-full" />
    </div>
  );
}

function useAsync(loader, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    loader()
      .then((data) => alive && setState({ loading: false, data, error: "" }))
      .catch((err) => alive && setState({ loading: false, data: null, error: err?.message || "Failed to load" }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function OperationsCommand() {
  const [snapshot, setSnapshot] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setSnapshot(await getOperationsSnapshot());
      setError("");
    } catch (e) {
      setError(e?.message || "Failed to load operations");
    }
  };

  useEffect(() => { load(); }, []);

  const run = async () => {
    setBusy(true);
    try {
      const res = await runNewOrderWorkflow();
      setWorkflow(res);
      await load();
    } catch (e) {
      setError(e?.message || "Workflow failed");
    } finally {
      setBusy(false);
    }
  };

  const status = snapshot?.operational_status || {};
  const activity = snapshot?.activity || {};

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Operations"
        icon="operations"
        body="Aiviate is running today's operation: receiving store orders, preparing routes, assigning drivers, and raising only the items that need human attention."
      />
      {error && <div className="mb-4 rounded-lg border border-[#FED7AA] bg-[#FFF7ED] p-3 text-[13px] text-[#9A3412]">{error}</div>}
      <div className="rounded-xl bg-[#0B1220] text-white p-5 sm:p-6 mb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-wider text-white/50">Operational loop</p>
            <h2 className="text-[22px] sm:text-[26px] font-semibold mt-1">Sense → Understand → Decide → Act → Observe</h2>
            <p className="text-[13px] text-white/70 mt-2 max-w-2xl">
              The first autonomous workflow is live for real storefront orders only: New Order → Plan → Assign → Notify.
            </p>
          </div>
          <button
            onClick={run}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-[#111315] px-4 py-2 text-[13px] font-medium disabled:opacity-60"
          >
            <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
            Prepare Operation
          </button>
        </div>
      </div>
      {!snapshot ? <LoadingPanel /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            <Metric label="Deliveries" value={fmt(status.total_deliveries)} />
            <Metric label="Pending" value={fmt(status.pending)} tone={status.pending ? "warn" : "good"} />
            <Metric label="Active" value={fmt(status.active)} />
            <Metric label="Drivers active" value={fmt(status.drivers_active)} />
            <Metric label="On-time projection" value={`${status.projected_on_time_pct || 0}%`} tone="good" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#E9ECEF] bg-white p-4">
              <h3 className="text-[14px] font-semibold text-[#111315] mb-3">Aiviate Activity</h3>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Orders processed" value={fmt(activity.orders_processed)} />
                <Metric label="Routes created" value={fmt(activity.routes_created)} />
                <Metric label="Drivers assigned" value={fmt(activity.drivers_assigned)} />
                <Metric label="Customers contacted" value={fmt(activity.customers_contacted)} />
              </div>
            </div>
            <div className="rounded-xl border border-[#E9ECEF] bg-white p-4 lg:col-span-2">
              <h3 className="text-[14px] font-semibold text-[#111315] mb-3">Latest Operational Trail</h3>
              <ActivityList entries={snapshot.recent_activity || []} />
            </div>
          </div>
          {workflow && (
            <div className="mt-5 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4">
              <p className="text-[14px] font-semibold text-[#14532D]">{workflow.summary}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {(workflow.steps || []).map((step) => (
                  <div key={step.stage} className="rounded-lg bg-white/80 border border-[#DCFCE7] p-3">
                    <p className="text-[12px] font-semibold text-[#166534]">{step.stage}</p>
                    <p className="text-[12px] text-[#14532D] mt-1">{step.result}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function Planning() {
  const state = useAsync(async () => {
    const [snapshot, jobs, orders] = await Promise.all([getOperationsSnapshot(), getJobs(), getStoreOrders()]);
    return { snapshot, jobs: jobs.jobs || [], orders: orders.orders || [] };
  }, []);
  const status = state.data?.snapshot?.operational_status || {};
  const unplanned = (state.data?.orders || []).filter((o) => !o.job_id && String(o.id || "").startsWith("STORE-"));
  return (
    <div className="animate-fade-in">
      <PageHeader title="Planning" icon="planning" body="Prepare the operation from storefront demand, current route jobs, available drivers, and autonomy policies." />
      {state.loading ? <LoadingPanel /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <Metric label="Unplanned orders" value={fmt(unplanned.length || status.pending)} tone={(unplanned.length || status.pending) ? "warn" : "good"} />
            <Metric label="Route jobs" value={fmt(state.data?.jobs.length)} />
            <Metric label="Available drivers" value={fmt(status.drivers_available)} />
            <Metric label="Orders needing review" value={fmt(status.unresolved_exceptions)} />
          </div>
          <div className="rounded-xl border border-[#E9ECEF] bg-white p-4">
            <h3 className="text-[14px] font-semibold text-[#111315] mb-3">Planning queue</h3>
            <ActivityList entries={state.data?.snapshot?.recent_activity || []} />
          </div>
        </>
      )}
    </div>
  );
}

export function Exceptions() {
  const state = useAsync(getExceptions, []);
  return (
    <div className="animate-fade-in">
      <PageHeader title="Exceptions" icon="exceptions" body="Operational disruptions raised from alerts, safety events, failed deliveries, and workflow guardrails." />
      {state.loading ? <LoadingPanel /> : (
        <div className="space-y-3">
          {(state.data?.exceptions || []).length === 0 && <div className="rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-4 text-[13px] text-[#166534]">No unresolved exceptions are currently raised.</div>}
          {(state.data?.exceptions || []).map((item) => (
            <div key={item.id} className="rounded-xl border border-[#E9ECEF] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[14px] font-semibold text-[#111315]">{item.title}</p>
                <span className="text-[11px] uppercase tracking-wide text-[#868E96]">{item.severity}</span>
              </div>
              <p className="text-[13px] text-[#5C636A] mt-1">{item.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Approvals() {
  const state = useAsync(getApprovals, []);
  const requests = useMemo(() => [...(state.data?.requests || []), ...(state.data?.alerts || [])], [state.data]);
  return (
    <div className="animate-fade-in">
      <PageHeader title="Approvals" icon="approvals" body="Human authority queue for restricted actions such as capacity shortages, safety escalations, and major route changes." />
      {state.loading ? <LoadingPanel /> : (
        <div className="space-y-3">
          {requests.length === 0 && <div className="rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-4 text-[13px] text-[#166534]">No approvals are waiting right now.</div>}
          {requests.map((item) => (
            <div key={item.id} className="rounded-xl border border-[#E9ECEF] bg-white p-4">
              <p className="text-[14px] font-semibold text-[#111315]">{item.summary || item.title}</p>
              <p className="text-[13px] text-[#5C636A] mt-1">{item.message || item.action_type || "Approval requested"}</p>
              <div className="mt-3 flex gap-2">
                <button className="rounded-lg bg-[#008080] text-white px-3 py-1.5 text-[12px] font-medium">Approve</button>
                <button className="rounded-lg bg-[#F1F3F5] text-[#111315] px-3 py-1.5 text-[12px] font-medium">Review</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AiviateActivity() {
  const state = useAsync(() => getActivity(150), []);
  return (
    <div className="animate-fade-in">
      <PageHeader title="Aiviate Activity" icon="activity" body="Append-only trail of autonomous and human-approved operational actions." />
      {state.loading ? <LoadingPanel /> : <ActivityList entries={state.data?.entries || []} />}
    </div>
  );
}

export function PoliciesAutonomy() {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const load = async () => {
    try { setState({ loading: false, data: await getPolicies(), error: "" }); }
    catch (e) { setState({ loading: false, data: null, error: e?.message || "Failed to load policies" }); }
  };
  useEffect(() => { load(); }, []);
  const policies = state.data?.policies || {};
  const toggle = async (field) => {
    setState((s) => ({ ...s, loading: true }));
    await updatePolicies({ [field]: !policies[field] });
    await load();
  };
  return (
    <div className="animate-fade-in">
      <PageHeader title="Policies & Autonomy" icon="policies" body="Backend-enforced guardrails for what Aiviate can do automatically and what needs approval." />
      {state.loading ? <LoadingPanel /> : (
        <>
          {state.error && <div className="mb-4 rounded-lg border border-[#FED7AA] bg-[#FFF7ED] p-3 text-[13px] text-[#9A3412]">{state.error}</div>}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#E9ECEF] bg-white p-4">
              <p className="text-[12px] text-[#868E96]">Autonomy level</p>
              <p className="text-[32px] font-semibold text-[#111315] mt-1">{policies.autonomy_level ?? 0}</p>
              <p className="text-[13px] text-[#5C636A] mt-2 capitalize">{policies.mode || "assist"} mode</p>
            </div>
            {["enabled", "auto_assign", "auto_optimize", "auto_notify"].map((field) => (
              <button key={field} onClick={() => toggle(field)} className="rounded-xl border border-[#E9ECEF] bg-white p-4 text-left hover:border-[#008080]/40 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold text-[#111315]">{field.replaceAll("_", " ")}</p>
                  {policies[field] ? <CheckCircle2 size={18} className="text-[#16A34A]" /> : <AlertTriangle size={18} className="text-[#D97706]" />}
                </div>
                <p className="text-[13px] text-[#868E96] mt-2">{policies[field] ? "Automatic where allowed" : "Manual or approval required"}</p>
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-[#E9ECEF] bg-white p-4">
            <h3 className="text-[14px] font-semibold text-[#111315] mb-3">Guardrails</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {(policies.guardrails || []).map((rule) => (
                <div key={rule} className="rounded-lg bg-[#F8F9FA] p-3 text-[13px] text-[#5C636A]">{rule}</div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Customers() {
  const state = useAsync(getStoreOrders, []);
  const customers = new Map();
  for (const order of state.data?.orders || []) {
    const key = order.customer_phone || order.customer_name || order.id;
    if (!customers.has(key)) customers.set(key, { ...order, count: 0 });
    customers.get(key).count += 1;
  }
  return (
    <div className="animate-fade-in">
      <PageHeader title="Customers" icon="customers" body="Customer delivery profiles built from real storefront stops and order history." />
      {state.loading ? <LoadingPanel /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {[...customers.values()].map((c) => (
            <div key={`${c.customer_name}-${c.customer_phone}`} className="rounded-xl border border-[#E9ECEF] bg-white p-4">
              <p className="text-[14px] font-semibold text-[#111315]">{c.customer_name || "Customer"}</p>
              <p className="text-[13px] text-[#5C636A] mt-1">{c.shipping_address}</p>
              <p className="text-[12px] text-[#868E96] mt-2">{c.count} delivery record(s) · {c.customer_phone || "no phone"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Communications() {
  const state = useAsync(() => getActivity(100), []);
  const comms = (state.data?.entries || []).filter((e) => /notify|notification|call|customer|driver_notified/.test(e.action_type || ""));
  return (
    <div className="animate-fade-in">
      <PageHeader title="Communications" icon="communications" body="Operational communication records across driver alerts, customer notification simulations, and future call-agent outcomes." />
      {state.loading ? <LoadingPanel /> : <ActivityList entries={comms} />}
    </div>
  );
}

export function Vehicles() {
  const state = useAsync(getDrivers, []);
  const vehicles = (state.data?.drivers || []).map((driver) => ({
    id: `${driver.id}-${driver.vehicle_type}`,
    type: driver.vehicle_type || "vehicle",
    driver: driver.name,
    status: driver.blocked ? "blocked" : driver.status || "available",
  }));
  return (
    <div className="animate-fade-in">
      <PageHeader title="Vehicles" icon="vehicles" body="Current vehicle allocation is derived from driver profiles until full vehicle records are connected." />
      {state.loading ? <LoadingPanel /> : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <div key={v.id} className="rounded-xl border border-[#E9ECEF] bg-white p-4">
              <p className="text-[14px] font-semibold text-[#111315] capitalize">{v.type}</p>
              <p className="text-[13px] text-[#5C636A] mt-1">Assigned driver: {v.driver}</p>
              <p className="text-[12px] text-[#868E96] mt-2 capitalize">{v.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Intelligence() {
  const state = useAsync(getOperationsSnapshot, []);
  const status = state.data?.operational_status || {};
  const humanInterventions = (status.pending_approvals || 0) + (status.unresolved_exceptions || 0);
  const perThousand = status.total_deliveries ? Math.round((humanInterventions / status.total_deliveries) * 1000) : 0;
  return (
    <div className="animate-fade-in">
      <PageHeader title="Intelligence" icon="intelligence" body="Operational metrics focused on reducing human interventions without degrading delivery quality or safety." />
      {state.loading ? <LoadingPanel /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric label="Human interventions / 1,000" value={fmt(perThousand)} tone={perThousand ? "warn" : "good"} />
          <Metric label="On-time projection" value={`${status.projected_on_time_pct || 0}%`} tone="good" />
          <Metric label="Exceptions" value={fmt(status.unresolved_exceptions)} />
          <Metric label="Approvals" value={fmt(status.pending_approvals)} />
        </div>
      )}
    </div>
  );
}

