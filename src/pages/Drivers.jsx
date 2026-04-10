import { useState, useEffect } from "react";
import { Truck, Plus, Trash2, Package, Phone } from "lucide-react";
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
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[#008080] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Drivers</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your delivery fleet</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#008080] text-white rounded-lg font-medium text-sm hover:bg-[#006e6e] transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Add Driver
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 max-w-lg">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">New Driver</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Thabo Mokoena"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+27 82 123 4567"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Vehicle Type</label>
                <select
                  value={form.vehicle_type}
                  onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                  <option value="bike">Bike</option>
                  <option value="car">Car</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAdd}
                disabled={adding || !form.name.trim()}
                className="px-4 py-2 bg-[#008080] text-white rounded-lg text-sm font-medium hover:bg-[#006e6e] disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Driver"}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {drivers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Truck size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-3">No drivers yet. Add drivers to start assigning jobs.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-[#008080] font-semibold hover:underline"
          >
            Add your first driver
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {drivers.map((driver) => {
            const driverJobs = jobs.filter((j) => j.driver_id === driver.id);
            const totalStops = driverJobs.reduce((s, j) => s + j.total_stops, 0);

            return (
              <div key={driver.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#008080]/10 flex items-center justify-center">
                      <Truck size={20} className="text-[#008080]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">{driver.name}</h3>
                      <p className="text-xs text-gray-400">{driver.id} | {driver.vehicle_type}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(driver.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-800">{driverJobs.length}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Jobs</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-800">{totalStops}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Stops</p>
                  </div>
                </div>

                {driverJobs.length > 0 && (
                  <div className="space-y-1.5">
                    {driverJobs.map((j) => (
                      <div key={j.id} className="p-2 bg-teal-50 rounded-lg flex items-center gap-2">
                        <Package size={12} className="text-[#008080]" />
                        <span className="text-xs font-semibold text-teal-800">{j.id}</span>
                        <span className="text-xs text-teal-600">{j.area} ({j.total_stops} stops)</span>
                      </div>
                    ))}
                  </div>
                )}

                {driver.phone && (
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
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
