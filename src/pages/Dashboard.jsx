import { useState, useEffect } from "react";
import { Package, Truck, MapPin, ArrowRight, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStats, getJobs, getDrivers } from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [s, j, d] = await Promise.all([getStats(), getJobs(), getDrivers()]);
        setStats(s);
        setJobs(j.jobs || []);
        setDrivers(d.drivers || []);
      } catch (e) {
        console.error(e);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-72 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="apple-card p-6"><div className="skeleton h-4 w-20 mb-3" /><div className="skeleton h-8 w-16" /></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Dashboard</h1>
        </div>
        <div className="apple-card p-10 text-center">
          <p className="text-[14px] text-[#ff3b30] mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="apple-btn apple-btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  const hasData = stats && (stats.total_jobs || 0) > 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Dashboard</h1>
        <p className="text-[14px] text-[#86868b] mt-1">Overview of your dispatch operations</p>
      </div>

      {!hasData ? (
        <div className="space-y-5">
          <div className="apple-card p-10 sm:p-14 text-center animate-slide-up">
            <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mx-auto mb-5">
              <Package size={28} className="text-[#86868b]" strokeWidth={1.5} />
            </div>
            <h2 className="text-[20px] font-semibold text-[#1d1d1f] mb-2 tracking-tight">Get started</h2>
            <p className="text-[14px] text-[#86868b] mb-8 max-w-sm mx-auto leading-relaxed">
              Upload a spreadsheet of delivery addresses and the system will optimize your routes automatically.
            </p>
            <button onClick={() => navigate("/dispatch")} className="apple-btn apple-btn-primary">
              Upload Deliveries <ArrowRight size={16} />
            </button>
          </div>

          <div className="apple-card p-6">
            <h3 className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wider mb-5">Three steps to optimized routes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
              {[
                { step: "1", title: "Upload", desc: "Upload an Excel or CSV file with delivery addresses" },
                { step: "2", title: "Optimize", desc: "System geocodes addresses, clusters stops, and finds the best routes" },
                { step: "3", title: "Dispatch", desc: "Assign optimized jobs to your drivers" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#008080] text-white flex items-center justify-center text-[12px] font-bold shrink-0">{step}</div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#1d1d1f] mb-1">{title}</p>
                    <p className="text-[12px] text-[#aeaeb2] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Jobs", value: stats.total_jobs || 0, sub: `${stats.unassigned || 0} unassigned`, icon: Package, accent: (stats.unassigned || 0) > 0 },
              { label: "Stops", value: stats.total_stops || 0, sub: `${stats.total_distance_km || 0} km total`, icon: MapPin },
              { label: "Drivers", value: stats.total_drivers || 0, sub: `${stats.assigned || 0} assigned`, icon: Truck },
            ].map(({ label, value, sub, icon: Icon, accent }) => (
              <div key={label} className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[12px] text-[#86868b] font-medium uppercase tracking-wide mb-2">{label}</p>
                    <p className="text-[32px] font-semibold text-[#1d1d1f] tracking-tight leading-none">{value}</p>
                    <p className={`text-[12px] mt-2 ${accent ? "text-[#ff9500] font-medium" : "text-[#aeaeb2]"}`}>{sub}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <Icon size={18} className="text-[#86868b]" strokeWidth={1.8} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="apple-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-semibold text-[#1d1d1f]">Recent Jobs</h2>
                <button onClick={() => navigate("/jobs")} className="text-[12px] text-[#86868b] hover:text-[#1d1d1f] transition-colors font-medium">
                  View all
                </button>
              </div>
              <div className="space-y-1">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#f5f5f7] transition-colors">
                    <div>
                      <p className="text-[13px] font-medium text-[#1d1d1f]">{job.area}</p>
                      <p className="text-[11px] text-[#aeaeb2]">{job.total_stops} stops | {job.total_distance_km} km</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                      job.status === "assigned" ? "bg-[#008080]/10 text-[#008080]" :
                      job.status === "completed" ? "bg-[#34c759]/10 text-[#34c759]" :
                      "bg-[#ff9500]/10 text-[#ff9500]"
                    }`}>{job.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="apple-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-semibold text-[#1d1d1f]">Drivers</h2>
                <button onClick={() => navigate("/drivers")} className="text-[12px] text-[#86868b] hover:text-[#1d1d1f] transition-colors font-medium">
                  Manage
                </button>
              </div>
              {drivers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[13px] text-[#aeaeb2] mb-3">No drivers added yet</p>
                  <button onClick={() => navigate("/drivers")} className="text-[13px] text-[#1d1d1f] font-semibold hover:underline">
                    Add drivers
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {drivers.map((d) => {
                    const count = jobs.filter(j => j.driver_id === d.id).length;
                    return (
                      <div key={d.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#f5f5f7] transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-[#34c759]" />
                          <p className="text-[13px] font-medium text-[#1d1d1f]">{d.name}</p>
                        </div>
                        <p className="text-[11px] text-[#aeaeb2]">{count} jobs</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button onClick={() => navigate("/dispatch")} className="apple-btn apple-btn-secondary text-[13px]">
            <Upload size={14} /> Upload new deliveries
          </button>
        </div>
      )}
    </div>
  );
}
