import { useState, useEffect } from "react";
import { Truck, Plus, Trash2, Package, Phone, X } from "lucide-react";
import { Spinner, SkeletonList } from "../components/Loader";
import { getDrivers, addDriver, removeDriver, getJobs } from "../services/api";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", vehicle_type: "van" });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const loadData = async () => {
    try {
      const [driversRes, jobsRes] = await Promise.all([getDrivers(), getJobs()]);
      setDrivers(driversRes.drivers || []);
      setJobs(jobsRes.jobs || []);
    } catch (e) {
      console.error("Failed to load drivers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setAdding(true);
    try {
      await addDriver(form.name, form.phone, form.vehicle_type);
      setForm({ name: "", phone: "", vehicle_type: "van" });
      setShowForm(false);
      loadData();
    } catch (e) {
      alert("Failed to add driver: " + e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm("Remove this driver? Any assigned jobs will be unassigned.")) return;
    try {
      await removeDriver(id);
      loadData();
    } catch (e) {
      alert("Failed to remove driver: " + e.message);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="skeleton h-7 w-28 mb-2" />
          <div className="skeleton h-4 w-44" />
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Drivers</h1>
          <p className="text-[14px] text-[#86868b] mt-1">Manage your delivery fleet</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="apple-btn apple-btn-primary"
        >
          <Plus size={16} /> Add Driver
        </button>
      </div>

      {showForm && (
        <div className="apple-card p-6 mb-6 max-w-lg animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-semibold text-[#1d1d1f]">New Driver</h3>
            <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5ea] transition-colors">
              <X size={14} className="text-[#86868b]" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[12px] text-[#86868b] font-medium mb-1.5 block">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Thabo Mokoena"
                className="apple-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-[#86868b] font-medium mb-1.5 block">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+27 82 123 4567"
                  className="apple-input"
                />
              </div>
              <div>
                <label className="text-[12px] text-[#86868b] font-medium mb-1.5 block">Vehicle Type</label>
                <select
                  value={form.vehicle_type}
                  onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                  className="apple-input"
                >
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                  <option value="bike">Bike</option>
                  <option value="car">Car</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAdd}
                disabled={adding || !form.name.trim()}
                className="apple-btn apple-btn-primary"
              >
                {adding ? <><Spinner size={14} /><span>Adding...</span></> : "Add Driver"}
              </button>
              <button onClick={() => setShowForm(false)} className="apple-btn apple-btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {drivers.length === 0 ? (
        <div className="apple-card p-16 text-center">
          <div className="w-16 h-16 rounded-[16px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-5">
            <Truck size={28} className="text-[#c7c7cc]" strokeWidth={1.5} />
          </div>
          <p className="text-[14px] text-[#86868b] mb-4">No drivers yet. Add drivers to start assigning jobs.</p>
          <button
            onClick={() => setShowForm(true)}
            className="apple-btn apple-btn-primary"
          >
            Add your first driver
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {drivers.map((driver, i) => {
            const driverJobs = jobs.filter((j) => j.driver_id === driver.id);
            const totalStops = driverJobs.reduce((s, j) => s + j.total_stops, 0);

            return (
              <div key={driver.id} className="apple-card p-5 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#f5f5f7] flex items-center justify-center">
                      <Truck size={18} className="text-[#86868b]" strokeWidth={1.8} />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-[#1d1d1f]">{driver.name}</h3>
                      <p className="text-[12px] text-[#aeaeb2]">{driver.id} | {driver.vehicle_type}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(driver.id)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#ff3b30]/10 transition-colors">
                    <Trash2 size={14} className="text-[#c7c7cc] hover:text-[#ff3b30]" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center p-2.5 bg-[#f5f5f7] rounded-xl">
                    <p className="text-[18px] font-semibold text-[#1d1d1f]">{driverJobs.length}</p>
                    <p className="text-[10px] text-[#aeaeb2] font-medium uppercase">Jobs</p>
                  </div>
                  <div className="text-center p-2.5 bg-[#f5f5f7] rounded-xl">
                    <p className="text-[18px] font-semibold text-[#1d1d1f]">{totalStops}</p>
                    <p className="text-[10px] text-[#aeaeb2] font-medium uppercase">Stops</p>
                  </div>
                </div>

                {driverJobs.length > 0 && (
                  <div className="space-y-1.5">
                    {driverJobs.map((j) => (
                      <div key={j.id} className="p-2.5 bg-[#007aff]/5 rounded-xl flex items-center gap-2">
                        <Package size={12} className="text-[#007aff]" />
                        <span className="text-[12px] font-semibold text-[#007aff]">{j.id}</span>
                        <span className="text-[11px] text-[#007aff]/60">{j.area} ({j.total_stops} stops)</span>
                      </div>
                    ))}
                  </div>
                )}

                {driver.phone && (
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#f0f0f0] text-[12px] text-[#aeaeb2]">
                    <Phone size={12} />
                    <span>{driver.phone}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
