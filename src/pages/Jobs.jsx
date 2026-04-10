import { useState } from "react";
import { Package, Search, Filter } from "lucide-react";
import { jobs, drivers } from "../data/mockData";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  assigned: "bg-blue-100 text-blue-700",
  in_transit: "bg-teal-100 text-teal-700",
  completed: "bg-green-100 text-green-700",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-red-100 text-red-600",
};

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = jobs.filter((j) => {
    const matchesSearch = j.id.toLowerCase().includes(search.toLowerCase()) ||
      j.pickup.toLowerCase().includes(search.toLowerCase()) ||
      j.dropoff.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Jobs</h1>
          <p className="text-sm text-gray-400 mt-1">All delivery jobs and their current status</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080] w-56"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In Transit</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Job ID</th>
              <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Pickup</th>
              <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Drop-off</th>
              <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Driver</th>
              <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Vehicle</th>
              <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Priority</th>
              <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Time Window</th>
              <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((job) => {
              const driver = drivers.find((d) => d.id === job.driver_id);
              return (
                <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-bold text-gray-800">{job.id}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-gray-600 max-w-[180px] truncate">{job.pickup}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-gray-600 max-w-[180px] truncate">{job.dropoff}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-600">{driver?.name || "—"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">{job.vehicle_type}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase ${priorityColors[job.priority]}`}>{job.priority}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-gray-500">{job.time_window}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase ${statusColors[job.status]}`}>
                      {job.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
