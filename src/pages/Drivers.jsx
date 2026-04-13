import { useState, useEffect } from "react";
import { Truck, Plus, Trash2, X, Copy, Check, KeyRound, Shield } from "lucide-react";
import { Spinner, SkeletonList } from "../components/Loader";
import { getDrivers, addDriver, removeDriver, getJobs } from "../services/api";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", vehicle_type: "van", password: "" });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newDriverCredentials, setNewDriverCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const loadData = async () => {
    try {
      const [d, j] = await Promise.all([getDrivers(), getJobs()]);
      setDrivers(d.drivers || []);
      setJobs(j.jobs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setAdding(true);
    try {
      const result = await addDriver(form.name, form.email, form.vehicle_type, form.password);
      const driver = result.driver;
      setNewDriverCredentials({
        name: driver.name,
        email: form.email.toLowerCase(),
        password: driver.generated_password,
      });
      setForm({ name: "", email: "", vehicle_type: "van", password: "" });
      setShowForm(false);
      loadData();
    } catch (e) {
      alert("Failed: " + e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm("Remove this driver? Their login account will also be deleted.")) return;
    try {
      await removeDriver(id);
      loadData();
    } catch (e) {
      alert("Failed: " + e.message);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton h-8 w-28 mb-2" />
        <div className="skeleton h-4 w-40 mb-8" />
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Drivers</h1>
          <p className="text-[14px] text-[#86868b] mt-1">{drivers.length} drivers in your fleet</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setNewDriverCredentials(null); }} className="apple-btn apple-btn-primary w-full sm:w-auto">
          <Plus size={16} /> Add Driver
        </button>
      </div>

      {newDriverCredentials && (
        <div className="apple-card p-6 mb-6 max-w-lg animate-slide-up border-l-4 border-l-[#34c759]">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#34c759]/10 flex items-center justify-center shrink-0">
              <KeyRound size={18} className="text-[#34c759]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#1d1d1f]">Driver account created</h3>
              <p className="text-[12px] text-[#86868b] mt-0.5">
                Share these login details with <span className="font-medium text-[#1d1d1f]">{newDriverCredentials.name}</span> so they can sign in on their device.
              </p>
            </div>
          </div>

          <div className="space-y-2 bg-[#f5f5f7] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#86868b] font-medium uppercase tracking-wider">Email</p>
                <p className="text-[14px] text-[#1d1d1f] font-mono">{newDriverCredentials.email}</p>
              </div>
              <button
                onClick={() => copyToClipboard(newDriverCredentials.email, "email")}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/80 transition-colors"
              >
                {copiedField === "email" ? <Check size={14} className="text-[#34c759]" /> : <Copy size={14} className="text-[#86868b]" />}
              </button>
            </div>
            <div className="h-px bg-black/[0.06]" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#86868b] font-medium uppercase tracking-wider">Password</p>
                <p className="text-[14px] text-[#1d1d1f] font-mono">{newDriverCredentials.password}</p>
              </div>
              <button
                onClick={() => copyToClipboard(newDriverCredentials.password, "password")}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/80 transition-colors"
              >
                {copiedField === "password" ? <Check size={14} className="text-[#34c759]" /> : <Copy size={14} className="text-[#86868b]" />}
              </button>
            </div>
          </div>

          <button
            onClick={() => setNewDriverCredentials(null)}
            className="text-[12px] text-[#86868b] hover:text-[#1d1d1f] mt-3 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {showForm && (
        <div className="apple-card p-6 mb-6 max-w-lg animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-[#1d1d1f]">New Driver</h3>
            <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5ea] transition-colors">
              <X size={14} className="text-[#86868b]" />
            </button>
          </div>

          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#f5f5f7] mb-4">
            <Shield size={14} className="text-[#86868b] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#86868b] leading-relaxed">
              A login account is automatically created so the driver can sign in and view assigned jobs on their device.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[12px] text-[#86868b] font-medium mb-1 block">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sipho Ndlovu" className="apple-input" />
            </div>
            <div>
              <label className="text-[12px] text-[#86868b] font-medium mb-1 block">Email (used for login)</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="sipho@gmail.com" className="apple-input" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-[#86868b] font-medium mb-1 block">Password (optional)</label>
                <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Auto-generated" className="apple-input" />
              </div>
              <div>
                <label className="text-[12px] text-[#86868b] font-medium mb-1 block">Vehicle</label>
                <select value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                  className="apple-input">
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                  <option value="bike">Bike</option>
                  <option value="car">Car</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleAdd} disabled={adding || !form.name.trim() || !form.email.trim()} className="apple-btn apple-btn-primary">
                {adding ? <><Spinner size={14} /> Adding...</> : "Add Driver"}
              </button>
              <button onClick={() => setShowForm(false)} className="apple-btn apple-btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {drivers.length === 0 ? (
        <div className="apple-card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
            <Truck size={24} className="text-[#c7c7cc]" strokeWidth={1.5} />
          </div>
          <p className="text-[14px] text-[#86868b] mb-1">No drivers yet</p>
          <p className="text-[12px] text-[#aeaeb2] mb-4">Add drivers to assign them jobs. Each driver gets a login account.</p>
          <button onClick={() => setShowForm(true)} className="apple-btn apple-btn-primary">
            Add your first driver
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {drivers.map((driver, i) => {
            const driverJobs = jobs.filter(j => j.driver_id === driver.id);
            return (
              <div key={driver.id} className="apple-card p-4 flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center shrink-0">
                  <Truck size={17} className="text-[#86868b]" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-[#1d1d1f]">{driver.name}</p>
                    {driver.has_account && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#34c759]/10 text-[10px] font-semibold text-[#34c759]">APP</span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#aeaeb2]">
                    {driver.vehicle_type}
                    {driver.email && <span className="hidden sm:inline"> &middot; {driver.email}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  {driverJobs.length > 0 ? (
                    <span className="text-[12px] font-semibold text-[#1d1d1f]">{driverJobs.length} job{driverJobs.length !== 1 ? "s" : ""}</span>
                  ) : (
                    <span className="text-[12px] text-[#aeaeb2] hidden sm:inline">No jobs</span>
                  )}
                  <button onClick={() => handleRemove(driver.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#ff3b30]/10 transition-colors">
                    <Trash2 size={14} className="text-[#d1d1d6]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
