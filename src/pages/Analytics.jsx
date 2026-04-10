import { useState, useEffect } from "react";
import { BarChart3, DollarSign, MapPin, Package, Truck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import StatCard from "../components/StatCard";
import { SkeletonGrid } from "../components/Loader";
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
      } catch (e) {
        console.error("Failed to load analytics:", e);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="skeleton h-7 w-36 mb-2" />
          <div className="skeleton h-4 w-52" />
        </div>
        <SkeletonGrid cols={4} />
      </div>
    );
  }

  if (!stats || stats.total_jobs === 0) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Analytics</h1>
          <p className="text-[14px] text-[#86868b] mt-1">Performance metrics and operational insights</p>
        </div>
        <div className="apple-card p-16 text-center">
          <BarChart3 size={36} className="text-[#c7c7cc] mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-[14px] text-[#86868b]">No data yet. Upload and optimize deliveries to see analytics.</p>
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

  const tooltipStyle = {
    borderRadius: 12,
    border: "1px solid #e5e5ea",
    fontSize: 12,
    fontFamily: "-apple-system, sans-serif",
    boxShadow: "0 4px 12px rgba(0,0,0,.08)",
    padding: "8px 12px",
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Analytics</h1>
        <p className="text-[14px] text-[#86868b] mt-1">Performance metrics and operational insights</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={Package} label="Total Stops" value={stats.total_stops} sub={`Across ${stats.total_jobs} jobs`} />
        <StatCard icon={MapPin} label="Total Distance" value={`${stats.total_distance_km} km`} sub={`${avgDistPerJob} km avg/job`} />
        <StatCard icon={DollarSign} label="Est. Cost" value={`R ${stats.total_estimated_cost.toLocaleString()}`} sub={`R ${avgCostPerStop} avg/stop`} />
        <StatCard icon={Truck} label="Drivers" value={stats.total_drivers} sub={`${stats.assigned} assigned`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {areaData.length > 0 && (
          <div className="apple-card p-6">
            <h3 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-5">Stops by Area</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={areaData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#aeaeb2" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="area" type="category" tick={{ fontSize: 11, fill: "#86868b" }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="stops" fill="#1d1d1f" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {areaData.length > 0 && (
          <div className="apple-card p-6">
            <h3 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-5">Cost by Area (R)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={areaData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#aeaeb2" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="area" type="category" tick={{ fontSize: 11, fill: "#86868b" }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="cost" fill="#86868b" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {driverData.length > 0 && (
          <div className="apple-card p-6 col-span-2">
            <h3 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-5">Driver Workload</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={driverData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#86868b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#aeaeb2" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="stops" fill="#1d1d1f" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
