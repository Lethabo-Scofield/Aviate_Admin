import { useState, useEffect } from "react";
import { BarChart3, DollarSign, MapPin, Package, Truck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import StatCard from "../components/StatCard";
import { getStats, getJobs, getDrivers } from "../services/api";

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, jobsRes, driversRes] = await Promise.all([getStats(), getJobs(), getDrivers()]);
        setStats(statsRes);
        setJobs(jobsRes.jobs || []);
        setDrivers(driversRes.drivers || []);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[#008080] rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats || stats.total_jobs === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">Performance metrics and operational insights</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <BarChart3 size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No data yet. Upload and optimize deliveries to see analytics.</p>
        </div>
      </div>
    );
  }

  const jobsByArea = jobs.reduce((acc, j) => {
    if (!acc[j.area]) acc[j.area] = { area: j.area, stops: 0, distance: 0, cost: 0 };
    acc[j.area].stops += j.total_stops;
    acc[j.area].distance += j.total_distance_km;
    acc[j.area].cost += j.estimated_cost;
    return acc;
  }, {});
  const areaData = Object.values(jobsByArea).map((d) => ({ ...d, distance: Math.round(d.distance * 10) / 10, cost: Math.round(d.cost) }));

  const driverData = drivers.map((d) => {
    const dJobs = jobs.filter((j) => j.driver_id === d.id);
    return {
      name: d.name.split(" ")[0],
      jobs: dJobs.length,
      stops: dJobs.reduce((s, j) => s + j.total_stops, 0),
    };
  }).filter((d) => d.jobs > 0);

  const avgCostPerStop = stats.total_stops > 0 ? Math.round(stats.total_estimated_cost / stats.total_stops) : 0;
  const avgDistPerJob = stats.total_jobs > 0 ? Math.round(stats.total_distance_km / stats.total_jobs * 10) / 10 : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Performance metrics and operational insights</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard icon={Package} label="Total Stops" value={stats.total_stops} sub={`Across ${stats.total_jobs} jobs`} />
        <StatCard icon={MapPin} label="Total Distance" value={`${stats.total_distance_km} km`} sub={`${avgDistPerJob} km avg/job`} color="#1e3a5f" />
        <StatCard icon={DollarSign} label="Total Est. Cost" value={`R ${stats.total_estimated_cost.toLocaleString()}`} sub={`R ${avgCostPerStop} avg/stop`} />
        <StatCard icon={Truck} label="Drivers" value={stats.total_drivers} sub={`${stats.assigned} jobs assigned`} color="#1e3a5f" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {areaData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Stops by Area</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={areaData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="area" type="category" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
                <Bar dataKey="stops" fill="#008080" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {areaData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Cost by Area (R)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={areaData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="area" type="category" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
                <Bar dataKey="cost" fill="#1e3a5f" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {driverData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 col-span-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Driver Workload (Stops Assigned)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={driverData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
                <Bar dataKey="stops" fill="#008080" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
