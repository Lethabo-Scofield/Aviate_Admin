import { useState, useEffect } from "react";
import { Truck, Plus, Trash2, X } from "lucide-react";
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
    if (!form.name.trim()) return;
    setAdding(true);
    try {
      await addDriver(form.name, form.phone, form.vehicle_type);
      setForm({ name: "", phone: "", vehicle_type: "van" });
      setShowForm(false);
      loadData();
    } catch (e) {
      alert("Failed: " + e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm("Remove this driver?")) return;
    try {
      await removeDriver(id);
      loadData();
    } catch (e) {
      alert("Failed: " + e.message);
    }
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
        <button onClick={() => setShowForm(!showForm)} className="apple-btn apple-btn-primary w-full sm:w-auto">
          <Plus size={16} /> Add Driver
        </button>
      </div>

      {showForm && (
        <div className="apple-card p-6 mb-6 max-w-md animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-[#1d1d1f]">New Driver</h3>
            <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5ea] transition-colors">
              <X size={14} className="text-[#86868b]" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[12px] text-[#86868b] font-medium mb-1 block">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Thabo Mokoena" className="apple-input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-[#86868b] font-medium mb-1 block">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+27 82 123 4567" className="apple-input" />
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
              <button onClick={handleAdd} disabled={adding || !form.name.trim()} className="apple-btn apple-btn-primary">
                {adding ? <><Spinner size={14} /> Adding...</> : "Add Driver"}
              </button>
              <button onClick={() => setShowForm(false)} className="apple-btn apple-btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {drivers.length === 0 ? (
        <div className="apple-card p-12 text-center">
          <div className="w-14 h-14 rounded-[14px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
            <Truck size={24} className="text-[#c7c7cc]" strokeWidth={1.5} />
          </div>
          <p className="text-[14px] text-[#86868b] mb-4">Add drivers to start assigning jobs</p>
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
                  <p className="text-[14px] font-semibold text-[#1d1d1f]">{driver.name}</p>
                  <p className="text-[12px] text-[#aeaeb2]">
                    {driver.vehicle_type}
                    {driver.phone && <> | {driver.phone}</>}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {driverJobs.length > 0 ? (
                    <span className="text-[12px] font-semibold text-[#007aff]">{driverJobs.length} jobs</span>
                  ) : (
                    <span className="text-[12px] text-[#aeaeb2]">No jobs</span>
                  )}
                  <button onClick={() => handleRemove(driver.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#ff3b30]/10 transition-colors">
                    <Trash2 size={14} className="text-[#c7c7cc]" />
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
