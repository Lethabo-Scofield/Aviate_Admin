import { BarChart3, TrendingUp, DollarSign, Clock, Users, Gauge } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import StatCard from "../components/StatCard";
import { analyticsData } from "../data/mockData";

export default function Analytics() {
  const { costPerDelivery, avgDeliveryTime, driverUtilization, efficiencyTrend, summary } = analyticsData;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Performance metrics and operational insights</p>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <StatCard icon={DollarSign} label="Avg Cost / Delivery" value={`R ${summary.avgCostPerDelivery}`} sub={`${summary.totalDeliveries} total deliveries`} trend={-4} />
        <StatCard icon={Clock} label="Avg Delivery Time" value={`${summary.avgDeliveryTime} min`} sub="Door-to-door average" trend={-8} color="#1e3a5f" />
        <StatCard icon={Gauge} label="Avg Efficiency" value={`${summary.avgEfficiency}%`} sub={`${summary.activeDrivers} active drivers`} trend={6} />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Cost Per Delivery (This Week)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={costPerDelivery}>
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#008080" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#008080" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
              <Area type="monotone" dataKey="cost" stroke="#008080" fill="url(#costGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Average Delivery Time (min)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={avgDeliveryTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
              <Line type="monotone" dataKey="time" stroke="#1e3a5f" strokeWidth={2} dot={{ fill: "#1e3a5f", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Driver Utilization Rate (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={driverUtilization} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
              <Bar dataKey="rate" fill="#008080" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Route Efficiency Score Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={efficiencyTrend}>
              <defs>
                <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e3a5f" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#1e3a5f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#1e3a5f" fill="url(#effGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
