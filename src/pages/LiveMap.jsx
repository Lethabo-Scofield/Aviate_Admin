import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Truck, Package, Clock } from "lucide-react";
import { drivers, jobs, routeAssignments } from "../data/mockData";

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
  }, [bounds, map]);
  return null;
}

const driverIcon = (status) =>
  L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="background:${status === "en_route" ? "#f59e0b" : "#008080"};color:#fff;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
        <span style="margin-right:3px;">${status === "en_route" ? "🚚" : "🟢"}</span>Driver
      </div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:8px solid ${status === "en_route" ? "#f59e0b" : "#008080"};"></div>
    </div>`,
    iconSize: [80, 35],
    iconAnchor: [40, 35],
  });

const pickupIcon = L.divIcon({
  className: "",
  html: `<div style="background:#1e3a5f;color:#fff;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.15);">📦 Pickup</div>`,
  iconSize: [70, 25],
  iconAnchor: [35, 25],
});

const dropoffIcon = L.divIcon({
  className: "",
  html: `<div style="background:#008080;color:#fff;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.15);">📍 Drop-off</div>`,
  iconSize: [80, 25],
  iconAnchor: [40, 25],
});

export default function LiveMap() {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const activeDrivers = drivers.filter((d) => d.status !== "offline");
  const activeJobs = jobs.filter((j) => j.status === "in_transit" || j.status === "assigned");

  const allPositions = [
    ...activeDrivers.map((d) => [d.lat, d.lng]),
    ...activeJobs.map((j) => [j.pickup_lat, j.pickup_lng]),
    ...activeJobs.map((j) => [j.dropoff_lat, j.dropoff_lng]),
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Live Map</h1>
        <p className="text-sm text-gray-400 mt-1">Real-time view of drivers, pickups, and active routes</p>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="col-span-3 h-[600px] rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <MapContainer center={[-26.195, 28.045]} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {allPositions.length > 0 && <FitBounds bounds={allPositions} />}

            {activeDrivers.map((d) => (
              <Marker key={d.id} position={[d.lat, d.lng]} icon={driverIcon(d.status)}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-sm">{d.name}</p>
                    <p className="text-gray-500">{d.vehicle_type} | {d.status}</p>
                    <p className="text-gray-500">Load: {d.current_load}/{d.capacity} kg</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {activeJobs.map((j) => (
              <div key={j.id}>
                <Marker position={[j.pickup_lat, j.pickup_lng]} icon={pickupIcon}>
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold">{j.id} Pickup</p>
                      <p className="text-gray-500">{j.pickup}</p>
                    </div>
                  </Popup>
                </Marker>
                <Marker position={[j.dropoff_lat, j.dropoff_lng]} icon={dropoffIcon}>
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold">{j.id} Drop-off</p>
                      <p className="text-gray-500">{j.dropoff}</p>
                      <p className="text-gray-400">ETA: {routeAssignments.find((r) => r.job_id === j.id)?.metrics.time || "–"} min</p>
                    </div>
                  </Popup>
                </Marker>
                <Polyline
                  positions={[[j.pickup_lat, j.pickup_lng], [j.dropoff_lat, j.dropoff_lng]]}
                  color="#008080"
                  weight={3}
                  dashArray="8 4"
                  opacity={0.7}
                />
              </div>
            ))}
          </MapContainer>
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Drivers</h3>
            <div className="space-y-2">
              {activeDrivers.map((d) => (
                <div
                  key={d.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedDriver === d.id ? "border-[#008080] bg-teal-50" : "border-gray-100 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedDriver(selectedDriver === d.id ? null : d.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${d.status === "en_route" ? "bg-amber-400" : "bg-green-400"}`} />
                    <span className="text-xs font-semibold text-gray-700">{d.name}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">{d.vehicle_type} | {d.completedToday} done today</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Jobs</h3>
            <div className="space-y-2">
              {activeJobs.slice(0, 4).map((j) => {
                const route = routeAssignments.find((r) => r.job_id === j.id);
                return (
                  <div key={j.id} className="p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700">{j.id}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        j.status === "in_transit" ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"
                      }`}>{j.status.replace("_", " ")}</span>
                    </div>
                    {route && <p className="text-[10px] text-gray-400">ETA: {route.metrics.time} min | R {route.metrics.cost}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
