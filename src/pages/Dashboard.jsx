import { useState, useEffect } from "react";
import { Package, Truck, GitBranch, DollarSign, MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard";
import { PageLoader, SkeletonGrid } from "../components/Loader";
import { getStats, getJobs, getDrivers } from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [statsRes, jobsRes, driversRes] = await Promise.all([getStats(), getJobs(), getDrivers()]);
      setStats(statsRes);
      setJobs(jobsRes.jobs || []);
      setDrivers(driversRes.drivers || []);
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="skeleton h-7 w-40 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
        <SkeletonGrid cols={4} />
      </div>
    );
  }

  const hasData = stats && stats.total_jobs > 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Dashboard</h1>
        <p className="text-[14px] text-[#86868b] mt-1">Real-time overview of your logistics operations</p>
      </div>

      {!hasData ? (
        <div className="apple-card p-16 text-center animate-slide-up">
          <div className="w-20 h-20 rounded-[20px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-6">
            <Package size={36} className="text-[#86868b]" strokeWidth={1.5} />
          </div>
          <h2 className="text-[20px] font-semibold text-[#1d1d1f] mb-2 tracking-tight">Welcome to Aviate</h2>
          <p className="text-[14px] text-[#86868b] mb-8 max-w-md mx-auto leading-relaxed">
            Upload your delivery Excel file to get started. The system will geocode addresses, cluster stops into geographic jobs, and optimize routes.
          </p>
          <button
            onClick={() => navigate("/dispatch")}
            className="apple-btn apple-btn-primary"
          >
            Go to Dispatch
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard icon={Package} label="Total Jobs" value={stats.total_jobs} sub={`${stats.unassigned} unassigned`} />
            <StatCard icon={Truck} label="Drivers" value={stats.total_drivers} sub={`${stats.assigned} assigned`} />
            <StatCard icon={MapPin} label="Total Stops" value={stats.total_stops} sub={`${stats.total_distance_km} km total`} />
            <StatCard icon={DollarSign} label="Est. Cost" value={`R ${stats.total_estimated_cost.toLocaleString()}`} sub={`${stats.completed} completed`} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 apple-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight">Recent Jobs</h2>
                <button onClick={() => navigate("/jobs")} className="text-[13px] text-[#86868b] font-medium hover:text-[#1d1d1f] transition-colors">
                  View All
                </button>
              </div>
              <div className="space-y-2">
                {jobs.slice(0, 6).map((job, i) => (
                  <div key={job.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#f5f5f7] transition-colors" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center">
                      <GitBranch size={16} className="text-[#86868b]" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-[#1d1d1f]">{job.area}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#86868b] font-medium">{job.id}</span>
                      </div>
                      <p className="text-[12px] text-[#aeaeb2]">{job.total_stops} stops | {job.total_distance_km} km</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                        job.status === "assigned" ? "bg-[#007aff]/10 text-[#007aff]" :
                        job.status === "completed" ? "bg-[#34c759]/10 text-[#34c759]" :
                        "bg-[#ff9500]/10 text-[#ff9500]"
                      }`}>{job.status}</span>
                      {job.driver_name && <p className="text-[10px] text-[#aeaeb2] mt-1">{job.driver_name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="apple-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight">Fleet</h2>
                <button onClick={() => navigate("/drivers")} className="text-[13px] text-[#86868b] font-medium hover:text-[#1d1d1f] transition-colors">
                  Manage
                </button>
              </div>
              {drivers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[13px] text-[#aeaeb2] mb-3">No drivers added yet</p>
                  <button onClick={() => navigate("/drivers")} className="text-[13px] text-[#1d1d1f] font-semibold hover:underline">
                    Add Drivers
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {drivers.map((d) => {
                    const driverJobs = jobs.filter((j) => j.driver_id === d.id);
                    return (
                      <div key={d.id} className="p-3 rounded-xl hover:bg-[#f5f5f7] transition-colors">
                        <div className="flex items-center gap-2.5 mb-1">
                          <div className="w-2 h-2 rounded-full bg-[#34c759]" />
                          <span className="text-[13px] font-medium text-[#1d1d1f]">{d.name}</span>
                        </div>
                        <p className="text-[11px] text-[#aeaeb2] ml-[18px]">{d.vehicle_type} | {driverJobs.length} jobs</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
