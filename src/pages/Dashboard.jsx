import { Package, Truck, GitBranch, DollarSign, Clock, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import StatCard from "../components/StatCard";
import EfficiencyBar from "../components/EfficiencyBar";
import { drivers, jobs, routeAssignments } from "../data/mockData";

export default function Dashboard() {
  const activeJobs = jobs.filter((j) => j.status !== "completed").length;
  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const activeDrivers = drivers.filter((d) => d.status !== "offline").length;
  const pendingJobs = jobs.filter((j) => j.status === "pending").length;
  const avgEfficiency = Math.round(routeAssignments.reduce((s, r) => s + r.metrics.efficiency_score, 0) / routeAssignments.length);

  const recentActivity = [
    { id: 1, text: "Job J003 picked up by Lerato Dlamini", time: "2 min ago", type: "success" },
    { id: 2, text: "New job J008 created — awaiting assignment", time: "5 min ago", type: "warning" },
    { id: 3, text: "Route R001 optimized — efficiency 87%", time: "12 min ago", type: "info" },
    { id: 4, text: "Job J006 completed by Naledi Khumalo", time: "18 min ago", type: "success" },
    { id: 5, text: "Driver Mandla Sithole went offline", time: "25 min ago", type: "error" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Real-time overview of your logistics operations</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard icon={Package} label="Active Jobs" value={activeJobs} sub={`${pendingJobs} pending assignment`} trend={8} />
        <StatCard icon={Truck} label="Active Drivers" value={`${activeDrivers}/${drivers.length}`} sub="1 offline" trend={-2} color="#1e3a5f" />
        <StatCard icon={GitBranch} label="Routes Today" value={routeAssignments.length} sub={`${completedJobs} completed`} trend={12} />
        <StatCard icon={TrendingUp} label="Avg Efficiency" value={`${avgEfficiency}%`} sub="Route optimization score" trend={5} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">Active Routes</h2>
          <div className="space-y-3">
            {routeAssignments.slice(0, 4).map((route) => {
              const driver = drivers.find((d) => d.id === route.driver_id);
              const job = jobs.find((j) => j.id === route.job_id);
              return (
                <div key={route.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#008080]/10 flex items-center justify-center">
                    <Truck size={16} className="text-[#008080]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{driver?.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">{route.id}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{job?.pickup} → {job?.dropoff}</p>
                  </div>
                  <div className="w-24">
                    <EfficiencyBar score={route.metrics.efficiency_score} size="sm" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">R {route.metrics.cost}</p>
                    <p className="text-[10px] text-gray-400">{route.metrics.time} min</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">Activity Feed</h2>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {item.type === "success" && <CheckCircle size={14} className="text-green-500" />}
                  {item.type === "warning" && <AlertTriangle size={14} className="text-amber-500" />}
                  {item.type === "info" && <TrendingUp size={14} className="text-[#008080]" />}
                  {item.type === "error" && <AlertTriangle size={14} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 leading-relaxed">{item.text}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
