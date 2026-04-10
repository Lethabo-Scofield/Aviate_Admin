import { useState, useEffect } from "react";
import { Package, Search, UserPlus, ChevronDown, ChevronUp, X } from "lucide-react";
import { PageLoader, SkeletonList } from "../components/Loader";
import { getJobs, getDrivers, assignDriver, unassignDriver } from "../services/api";

const statusStyles = {
  unassigned: "bg-[#ff9500]/10 text-[#ff9500]",
  assigned: "bg-[#007aff]/10 text-[#007aff]",
  completed: "bg-[#34c759]/10 text-[#34c759]",
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
      <div>
        <div className="mb-8">
          <div className="skeleton h-7 w-24 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <SkeletonList count={5} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Jobs</h1>
          <p className="text-[14px] text-[#86868b] mt-1">{jobs.length} delivery jobs</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aeaeb2]" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="apple-input pl-10 w-52"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="apple-input w-auto"
          >
            <option value="all">All Status</option>
            <option value="unassigned">Unassigned</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="apple-card p-16 text-center">
          <Package size={36} className="text-[#c7c7cc] mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-[14px] text-[#86868b]">No jobs found. Upload deliveries in the Dispatch Center.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((job, i) => (
            <div key={job.id} className="apple-card overflow-hidden animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-[#fafafa] transition-colors"
                onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
              >
                <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center">
                  <Package size={17} className="text-[#86868b]" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#1d1d1f]">{job.id}</span>
                    <span className="text-[13px] text-[#6e6e73]">{job.area}</span>
                  </div>
                  <p className="text-[12px] text-[#aeaeb2]">{job.total_stops} stops | {job.total_distance_km} km | ~{job.estimated_time_min} min</p>
                </div>
                <div className="flex items-center gap-3">
                  {job.driver_name ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#6e6e73] font-medium">{job.driver_name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUnassign(job.id); }}
                        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#ff3b30]/10 transition-colors"
                      >
                        <X size={12} className="text-[#ff3b30]" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setAssigningJob(assigningJob === job.id ? null : job.id); }}
                      className="apple-btn apple-btn-primary text-[12px] py-1.5 px-3"
                    >
                      <UserPlus size={12} /> Assign
                    </button>
                  )}
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${statusStyles[job.status]}`}>
                    {job.status}
                  </span>
                  {expandedJob === job.id ?
                    <ChevronUp size={16} className="text-[#aeaeb2]" /> :
                    <ChevronDown size={16} className="text-[#aeaeb2]" />
                  }
                </div>
              </div>

              {assigningJob === job.id && (
                <div className="px-4 pb-3 pt-3 bg-[#fafafa] border-t border-[#f0f0f0] animate-fade-in">
                  <p className="text-[12px] font-medium text-[#86868b] mb-2">Select a driver:</p>
                  {drivers.length === 0 ? (
                    <p className="text-[12px] text-[#aeaeb2]">No drivers available. Add drivers first.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {drivers.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => handleAssign(job.id, d)}
                          className="apple-btn apple-btn-secondary text-[12px] py-2 px-3"
                        >
                          {d.name} ({d.vehicle_type})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {expandedJob === job.id && (
                <div className="px-4 pb-4 pt-3 border-t border-[#f0f0f0] animate-fade-in">
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { v: job.total_stops, l: "Stops" },
                      { v: `${job.total_distance_km} km`, l: "Distance" },
                      { v: `${job.estimated_time_min} min`, l: "Est. Time" },
                      { v: `R ${job.estimated_cost}`, l: "Cost" },
                    ].map(({ v, l }) => (
                      <div key={l} className="bg-[#f5f5f7] rounded-xl p-2.5 text-center">
                        <p className="text-[14px] font-semibold text-[#1d1d1f]">{v}</p>
                        <p className="text-[10px] text-[#aeaeb2] font-medium">{l}</p>
                      </div>
                    ))}
                  </div>
                  <h4 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">Stops</h4>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {job.stops.map((stop, idx) => (
                      <div key={stop.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl text-[12px] transition-colors ${stop.completed ? "bg-[#34c759]/5" : "bg-[#f5f5f7]"}`}>
                        <span className="font-bold text-[#aeaeb2] w-5 shrink-0 text-right">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1d1d1f]">{stop.customer_name} <span className="text-[#aeaeb2]">({stop.order_id})</span></p>
                          <p className="text-[#aeaeb2] truncate">{stop.address}</p>
                          {stop.phone && <p className="text-[#aeaeb2]">{stop.phone}</p>}
                          {stop.notes && <p className="text-[#aeaeb2] italic">{stop.notes}</p>}
                        </div>
                        {stop.completed && <span className="text-[9px] px-2 py-0.5 bg-[#34c759]/10 text-[#34c759] rounded-full font-semibold">DONE</span>}
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
