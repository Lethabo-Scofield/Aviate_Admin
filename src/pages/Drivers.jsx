import { Truck, Star, Phone, MapPin, Package } from "lucide-react";
import { drivers, jobs } from "../data/mockData";
import EfficiencyBar from "../components/EfficiencyBar";

const statusColors = {
  available: "bg-green-100 text-green-700",
  en_route: "bg-amber-100 text-amber-700",
  offline: "bg-gray-100 text-gray-500",
};

export default function Drivers() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Drivers</h1>
          <p className="text-sm text-gray-400 mt-1">Fleet management and driver performance overview</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="text-gray-500">{drivers.filter((d) => d.status === "available").length} Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-gray-500">{drivers.filter((d) => d.status === "en_route").length} En Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="text-gray-500">{drivers.filter((d) => d.status === "offline").length} Offline</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {drivers.map((driver) => {
          const driverJobs = jobs.filter((j) => j.driver_id === driver.id);
          const activeJob = driverJobs.find((j) => j.status === "in_transit" || j.status === "assigned");
          const utilization = Math.round((driver.current_load / driver.capacity) * 100);

          return (
            <div key={driver.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#008080]/10 flex items-center justify-center">
                    <Truck size={20} className="text-[#008080]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">{driver.name}</h3>
                    <p className="text-xs text-gray-400">{driver.id} | {driver.vehicle_type}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase ${statusColors[driver.status]}`}>
                  {driver.status.replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-800">{driver.completedToday}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Today</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    <Star size={12} className="text-amber-400" />
                    <span className="text-lg font-bold text-gray-800">{driver.rating}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase">Rating</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-800">{utilization}%</p>
                  <p className="text-[10px] text-gray-400 uppercase">Load</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Capacity Usage</p>
                <EfficiencyBar score={utilization} size="sm" />
              </div>

              {activeJob && (
                <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Package size={12} className="text-[#008080]" />
                    <span className="text-xs font-semibold text-teal-800">Active: {activeJob.id}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{activeJob.pickup} → {activeJob.dropoff}</p>
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Phone size={12} />
                  <span>{driver.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin size={12} />
                  <span>{driver.lat.toFixed(3)}, {driver.lng.toFixed(3)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
