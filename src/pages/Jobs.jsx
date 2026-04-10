import { useState, useEffect } from "react";
import { Package, Search, UserPlus, ChevronDown, ChevronUp, X } from "lucide-react";
import { getJobs, getDrivers, assignDriver, unassignDriver } from "../services/api";

const statusColors = {
  unassigned: "bg-amber-100 text-amber-700",
  assigned: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedJob, setExpandedJob] = useState(null);
  const [assigningJob, setAssigningJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [jobsRes, driversRes] = await Promise.all([getJobs(), getDrivers()]);
      setJobs(jobsRes.jobs || []);
      setDrivers(driversRes.drivers || []);
    } catch (e) {
      console.error("Failed to load jobs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAssign = async (jobId, driver) => {
    try {
      await assignDriver(jobId, driver.id);
      setAssigningJob(null);
      loadData();
    } catch (e) {
      alert("Failed to assign: " + e.message);
    }
  };

  const handleUnassign = async (jobId) => {
    try {
      await unassignDriver(jobId);
      loadData();
    } catch (e) {
      alert("Failed to unassign: " + e.message);
    }
  };

  const filtered = jobs.filter((j) => {
    const matchesSearch = j.id.toLowerCase().includes(search.toLowerCase()) ||
      j.area.toLowerCase().includes(search.toLowerCase()) ||
      (j.driver_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-gray-800">Jobs</h1>
          <p className="text-sm text-gray-400 mt-1">{jobs.length} delivery jobs | Assign drivers to unassigned jobs</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20 w-56"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="unassigned">Unassigned</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Package size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No jobs found. Upload an Excel file in the Dispatch Center to create jobs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
              >
                <div className="w-10 h-10 rounded-lg bg-[#008080]/10 flex items-center justify-center">
                  <Package size={18} className="text-[#008080]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">{job.id}</span>
                    <span className="text-sm text-gray-600">{job.area}</span>
                  </div>
                  <p className="text-xs text-gray-400">{job.total_stops} stops | {job.total_distance_km} km | ~{job.estimated_time_min} min</p>
                </div>
                <div className="flex items-center gap-3">
                  {job.driver_name ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{job.driver_name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUnassign(job.id); }}
                        className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setAssigningJob(assigningJob === job.id ? null : job.id); }}
                      className="text-xs px-3 py-1.5 bg-[#008080] text-white rounded-lg hover:bg-[#006e6e] flex items-center gap-1"
                    >
                      <UserPlus size={12} /> Assign
                    </button>
                  )}
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase ${statusColors[job.status]}`}>
                    {job.status}
                  </span>
                  {expandedJob === job.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>

              {assigningJob === job.id && (
                <div className="px-4 pb-3 border-t border-gray-100 pt-3 bg-teal-50/50">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Select a driver:</p>
                  {drivers.length === 0 ? (
                    <p className="text-xs text-gray-400">No drivers available. Add drivers first.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {drivers.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => handleAssign(job.id, d)}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:border-[#008080] hover:text-[#008080] transition-colors"
                        >
                          {d.name} ({d.vehicle_type})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {expandedJob === job.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-gray-800">{job.total_stops}</p>
                      <p className="text-[10px] text-gray-400">Stops</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-gray-800">{job.total_distance_km} km</p>
                      <p className="text-[10px] text-gray-400">Distance</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-gray-800">{job.estimated_time_min} min</p>
                      <p className="text-[10px] text-gray-400">Est. Time</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-[#008080]">R {job.estimated_cost}</p>
                      <p className="text-[10px] text-gray-400">Cost</p>
                    </div>
                  </div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Stops</h4>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {job.stops.map((stop, idx) => (
                      <div key={stop.id} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${stop.completed ? "bg-green-50" : "bg-gray-50"}`}>
                        <span className="font-bold text-[#008080] w-5 shrink-0">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-700">{stop.customer_name} <span className="text-gray-400">({stop.order_id})</span></p>
                          <p className="text-gray-400 truncate">{stop.address}</p>
                          {stop.phone && <p className="text-gray-400">{stop.phone}</p>}
                          {stop.notes && <p className="text-gray-400 italic">{stop.notes}</p>}
                        </div>
                        {stop.completed && <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-semibold">DONE</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
