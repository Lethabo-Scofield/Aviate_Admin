import { useState, useEffect } from "react";
import { Package, Truck, GitBranch, DollarSign, MapPin, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard";
import EfficiencyBar from "../components/EfficiencyBar";
import { getStats, getJobs, getDrivers } from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [statsRes, jobsRes, driversRes] = await Promise.all([getStats(), getJobs(), getDrivers()]);
      setStats(statsRes);
      setJobs(jobsRes.jobs || []);
      setDrivers(driversRes.drivers || []);
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    }
  };

  useEffect(() => { loadData(); }, []);

  const hasData = stats && stats.total_jobs > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Real-time overview of your logistics operations</p>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-5">
            <Package size={32} className="text-[#008080]" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Welcome to Aviate Dispatch</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            Upload your delivery Excel file to get started. The system will geocode addresses, cluster stops into geographic jobs, and optimize routes.
          </p>
          <button
            onClick={() => navigate("/dispatch")}
            className="px-6 py-3 bg-[#008080] text-white rounded-lg font-medium text-sm hover:bg-[#006e6e] transition-colors"
          >
            Go to Dispatch Center
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-5 mb-8">
            <StatCard icon={Package} label="Total Jobs" value={stats.total_jobs} sub={`${stats.unassigned} unassigned`} />
            <StatCard icon={Truck} label="Drivers" value={stats.total_drivers} sub={`${stats.assigned} jobs assigned`} color="#1e3a5f" />
            <StatCard icon={MapPin} label="Total Stops" value={stats.total_stops} sub={`${stats.total_distance_km} km total`} />
            <StatCard icon={DollarSign} label="Est. Total Cost" value={`R ${stats.total_estimated_cost.toLocaleString()}`} sub={`${stats.completed} completed`} />
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Jobs Overview</h2>
                <button onClick={() => navigate("/jobs")} className="text-xs text-[#008080] font-medium hover:underline">View All</button>
              </div>
              <div className="space-y-3">
                {jobs.slice(0, 6).map((job) => (
                  <div key={job.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-[#008080]/10 flex items-center justify-center">
                      <GitBranch size={16} className="text-[#008080]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{job.area}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">{job.id}</span>
                      </div>
                      <p className="text-xs text-gray-400">{job.total_stops} stops | {job.total_distance_km} km</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase ${
                        job.status === "assigned" ? "bg-blue-100 text-blue-700" :
                        job.status === "completed" ? "bg-green-100 text-green-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{job.status}</span>
                      {job.driver_name && <p className="text-[10px] text-gray-400 mt-1">{job.driver_name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Drivers</h2>
                <button onClick={() => navigate("/drivers")} className="text-xs text-[#008080] font-medium hover:underline">Manage</button>
              </div>
              {drivers.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-400 mb-3">No drivers added yet</p>
                  <button onClick={() => navigate("/drivers")} className="text-xs text-[#008080] font-semibold hover:underline">Add Drivers</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {drivers.map((d) => {
                    const driverJobs = jobs.filter((j) => j.driver_id === d.id);
                    return (
                      <div key={d.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-xs font-semibold text-gray-700">{d.name}</span>
                        </div>
                        <p className="text-[10px] text-gray-400">{d.vehicle_type} | {driverJobs.length} jobs assigned</p>
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
