import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
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
  sendCommand,
  updatePolicies,
} from "../services/api";
import ResultBlock from "../components/ResultBlock";
import { takePendingAsk } from "../lib/askBus";

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

function ChatTurn({ turn }) {
  return (
    <div className="space-y-3">
      <div className="ml-auto max-w-[78%] rounded-2xl bg-[#111315] px-4 py-3 text-[14px] text-white">
        {turn.input}
      </div>
      <div className="max-w-[86%] rounded-2xl border border-[#E9ECEF] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(17,19,21,0.03)]">
        {turn.busy ? (
          <div className="flex items-center gap-2 text-[13px] text-[#868E96]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#008080]" />
            Aiviate is checking the operation...
          </div>
        ) : (
          <ResultBlock result={turn.result} />
        )}
      </div>
    </div>
  );
}

function Surface({ title, action, children }) {
  return (
    <section className="rounded-xl border border-[#E6EAED] bg-white p-4 shadow-[0_1px_2px_rgba(17,19,21,0.03)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[14px] font-semibold text-[#111315]">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function ModuleLink({ to, label, detail, icon: Icon, tone = "neutral" }) {
  const tones = {
    neutral: "border-[#E9ECEF] hover:border-[#C8D1D6]",
    warn: "border-[#FED7AA] bg-[#FFF7ED] hover:border-[#FDBA74]",
    good: "border-[#BBF7D0] bg-[#F0FDF4] hover:border-[#86EFAC]",
  };
  return (
    <Link to={to} className={`rounded-lg border p-3 transition-colors ${tones[tone] || tones.neutral}`}>
      <div className="flex items-center gap-2">
        <Icon size={15} strokeWidth={1.8} className={tone === "warn" ? "text-[#D97706]" : "text-[#008080]"} />
        <p className="text-[13px] font-semibold text-[#111315]">{label}</p>
      </div>
      <p className="mt-1 text-[12px] leading-snug text-[#5C636A]">{detail}</p>
    </Link>
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
  const [askText, setAskText] = useState("");
  const [thread, setThread] = useState([]);
  const [chatBusy, setChatBusy] = useState(false);
  const askRef = useRef(null);
  const endRef = useRef(null);

  const load = async () => {
    try {
      setSnapshot(await getOperationsSnapshot());
      setError("");
    } catch (e) {
      setError(e?.message || "Failed to load operations");
    }
  };

  useEffect(() => { load(); }, []);

  const askHere = useCallback(async (raw) => {
    const text = (raw || "").trim();
    if (!text) {
      askRef.current?.focus();
      return;
    }
    setAskText("");
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setThread((items) => [...items, { id, input: text, busy: true, result: null }]);
    setChatBusy(true);
    try {
      const result = await sendCommand(text);
      setThread((items) => items.map((item) => item.id === id ? { ...item, busy: false, result } : item));
    } catch (e) {
      setThread((items) => items.map((item) => item.id === id
        ? { ...item, busy: false, result: { ok: false, summary: e?.message || "Aiviate could not answer that yet." } }
        : item));
    } finally {
      setChatBusy(false);
      await load();
    }
  }, []);

  useEffect(() => {
    const onHomeAsk = (e) => askHere(e?.detail?.text || "");
    window.addEventListener("home:ask", onHomeAsk);
    return () => window.removeEventListener("home:ask", onHomeAsk);
  }, [askHere]);

  useEffect(() => {
    const pending = takePendingAsk();
    if (pending !== null) askHere(pending);
  }, [askHere]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread]);

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
  const submitAsk = (e) => {
    e?.preventDefault?.();
    askHere(askText);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 sm:mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D9EDED] bg-white shadow-sm">
          <img src="/logo.png" alt="" className="h-7 w-7" />
        </div>
        <h1 className="text-[28px] sm:text-[36px] font-semibold tracking-tight text-[#111315]">
          What should Aiviate handle?
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-[14px] text-[#5C636A]">
          Ask for orders, routes, drivers, exceptions, or tell it to prepare the operation.
        </p>
      </div>

      <form onSubmit={submitAsk} className="mx-auto mb-4 max-w-[760px]">
        <div className="flex items-center gap-3 rounded-2xl border border-[#DDE5E8] bg-white px-4 py-3 shadow-[0_8px_28px_rgba(17,19,21,0.06)] focus-within:border-[#008080]/50">
          <Bot size={18} className="shrink-0 text-[#008080]" />
          <input
            ref={askRef}
            value={askText}
            onChange={(e) => setAskText(e.target.value)}
            placeholder='Message Aiviate, e.g. "prepare operation"'
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[#111315] outline-none placeholder:text-[#ADB5BD]"
          />
          <button
            type="submit"
            disabled={chatBusy || !askText.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#008080] text-white disabled:bg-[#E9ECEF] disabled:text-[#ADB5BD]"
            aria-label="Send"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </form>

      <div className="mx-auto mb-8 flex max-w-[760px] flex-wrap justify-center gap-2">
        {[
          "Show orders",
          "Prepare operation",
          "What needs attention?",
          "Assign Sipho",
        ].map((prompt) => (
          <button
            key={prompt}
            onClick={() => askHere(prompt)}
            className="rounded-full border border-[#E9ECEF] bg-white px-3 py-1.5 text-[12px] text-[#5C636A] hover:border-[#008080]/30 hover:text-[#111315]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {thread.length > 0 && (
        <div className="mx-auto mb-8 max-w-[820px] space-y-5">
          {thread.map((turn) => <ChatTurn key={turn.id} turn={turn} />)}
          <div ref={endRef} />
        </div>
      )}

      {error && <div className="mb-4 rounded-lg border border-[#FED7AA] bg-[#FFF7ED] p-3 text-[13px] text-[#9A3412]">{error}</div>}
      {!snapshot ? <LoadingPanel /> : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Metric label="Deliveries" value={fmt(status.total_deliveries)} />
            <Metric label="Pending" value={fmt(status.pending)} tone={status.pending ? "warn" : "good"} />
            <Metric label="Active" value={fmt(status.active)} />
            <Metric label="Drivers active" value={fmt(status.drivers_active)} />
            <Metric label="On-time projection" value={`${status.projected_on_time_pct || 0}%`} tone="good" />
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <Surface
              title="Autonomous workflow"
              action={
                <button
                  onClick={run}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#008080] px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-60"
                >
                  <RefreshCw size={13} className={busy ? "animate-spin" : ""} />
                  Prepare Operation
                </button>
              }
            >
              <div className="grid gap-2 sm:grid-cols-4">
                {["Sense orders", "Plan route", "Assign driver", "Notify"].map((stage, index) => (
                  <div key={stage} className="rounded-lg bg-[#F8F9FA] p-3">
                    <p className="text-[11px] font-semibold text-[#008080]">0{index + 1}</p>
                    <p className="mt-1 text-[13px] font-medium text-[#111315]">{stage}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-[#5C636A]">
                Runs only against `STORE-*` storefront orders. Customer messages are still simulation until a real provider is configured.
              </p>
            </Surface>

            <Surface title="Needs attention">
              <div className="grid gap-2">
                <ModuleLink
                  to="/exceptions"
                  icon={AlertTriangle}
                  label={`${fmt(status.unresolved_exceptions)} exceptions`}
                  detail="Delivery risks, failed stops, safety warnings, and unresolved alerts."
                  tone={status.unresolved_exceptions ? "warn" : "good"}
                />
                <ModuleLink
                  to="/approvals"
                  icon={ShieldCheck}
                  label={`${fmt(status.pending_approvals)} approvals`}
                  detail="Restricted actions that need manager authority."
                  tone={status.pending_approvals ? "warn" : "good"}
                />
              </div>
            </Surface>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Surface title="Work handled">
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Orders processed" value={fmt(activity.orders_processed)} />
                <Metric label="Routes created" value={fmt(activity.routes_created)} />
                <Metric label="Drivers assigned" value={fmt(activity.drivers_assigned)} />
                <Metric label="Customers contacted" value={fmt(activity.customers_contacted)} />
              </div>
            </Surface>
            <Surface
              title="Latest trail"
              action={<Link to="/activity" className="text-[12px] font-medium text-[#008080]">View all</Link>}
            >
              <ActivityList entries={snapshot.recent_activity || []} />
            </Surface>
            <Surface title="Deeper views">
              <div className="grid gap-2">
                <ModuleLink to="/communications" icon={Mail} label="Communications" detail="Driver alerts, customer notification simulations, and future call outcomes." />
                <ModuleLink to="/policies" icon={ShieldCheck} label="Policies" detail="Control what Aiviate can do automatically." />
                <ModuleLink to="/customers" icon={Users} label="Customers" detail="Customer delivery history from real orders." />
              </div>
            </Surface>
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
