import { useState } from "react";
import { GitBranch, ChevronRight } from "lucide-react";
import { routeAssignments, drivers, jobs } from "../data/mockData";
import ExplainabilityPanel from "../components/ExplainabilityPanel";
import RouteBreakdownCard from "../components/RouteBreakdownCard";
import EfficiencyBar from "../components/EfficiencyBar";

export default function Routes() {
  const [selectedRoute, setSelectedRoute] = useState(null);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Routes</h1>
        <p className="text-sm text-gray-400 mt-1">Optimization results with full AI decision transparency</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Optimized Routes ({routeAssignments.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {routeAssignments.map((route) => {
                const driver = drivers.find((d) => d.id === route.driver_id);
                const job = jobs.find((j) => j.id === route.job_id);
                const isSelected = selectedRoute?.id === route.id;

                return (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRoute(route)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected ? "bg-teal-50 border-l-4 border-l-[#008080]" : "hover:bg-gray-50 border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <GitBranch size={14} className="text-[#008080]" />
                        <span className="text-sm font-bold text-gray-800">{route.id}</span>
                      </div>
                      <ChevronRight size={14} className={`transition-transform ${isSelected ? "rotate-90 text-[#008080]" : "text-gray-300"}`} />
                    </div>
                    <p className="text-xs text-gray-600 font-medium">{driver?.name}</p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{job?.pickup} → {job?.dropoff}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="w-20">
                        <EfficiencyBar score={route.metrics.efficiency_score} size="sm" />
                      </div>
                      <span className="text-xs font-semibold text-gray-500">Score: {route.score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-5">
          {selectedRoute ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg font-bold text-gray-800">{selectedRoute.id} Details</h2>
                <span className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-700 font-semibold">
                  {drivers.find((d) => d.id === selectedRoute.driver_id)?.name}
                </span>
                <span className="text-xs text-gray-400">→</span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  {selectedRoute.job_id}
                </span>
              </div>
              <RouteBreakdownCard metrics={selectedRoute.metrics} />
              <ExplainabilityPanel assignment={selectedRoute} />
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <GitBranch size={24} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">Select a route to view its optimization breakdown, scoring details, and AI decision transparency.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
