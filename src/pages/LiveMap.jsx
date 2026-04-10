import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Package, MapPin } from "lucide-react";
import { getJobs } from "../services/api";

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
  }, [bounds, map]);
  return null;
}

const COLORS = ["#008080", "#e63946", "#457b9d", "#f4a261", "#2a9d8f", "#e76f51", "#264653", "#a855f7"];

function makeIcon(label, color) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="background:${color};color:#fff;padding:2px 7px;border-radius:12px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.15);">${label}</div>
      <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:7px solid ${color};"></div>
    </div>`,
    iconSize: [60, 28],
    iconAnchor: [30, 28],
  });
}

export default function LiveMap() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getJobs();
        setJobs(res.jobs || []);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, []);

  const assignedJobs = jobs.filter((j) => j.status !== "completed");
  const allPositions = assignedJobs.flatMap((j) => j.stops.map((s) => [s.lat, s.lng]));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[#008080] rounded-full animate-spin" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Live Map</h1>
          <p className="text-sm text-gray-400 mt-1">Map view of all delivery jobs and stops</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <MapPin size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No jobs to display. Upload deliveries in the Dispatch Center first.</p>
        </div>
      </div>
    );
  }

  const displayJobs = selectedJob ? [jobs.find((j) => j.id === selectedJob)].filter(Boolean) : assignedJobs;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Live Map</h1>
        <p className="text-sm text-gray-400 mt-1">Delivery jobs and optimized stop sequences</p>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="col-span-3 h-[600px] rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <MapContainer center={[-26.195, 28.045]} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {allPositions.length > 0 && <FitBounds bounds={allPositions} />}

            {displayJobs.map((job, ji) => {
              const color = COLORS[ji % COLORS.length];
              const stopPositions = job.stops.map((s) => [s.lat, s.lng]);

              return (
                <div key={job.id}>
                  {job.stops.map((stop, si) => (
                    <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={makeIcon(`${si + 1}`, color)}>
                      <Popup>
                        <div className="text-xs">
                          <p className="font-bold text-sm">{stop.customer_name}</p>
                          <p className="text-gray-500">{stop.address}</p>
                          <p className="text-gray-400 mt-1">{job.area} | {job.id}</p>
                          {stop.phone && <p className="text-gray-400">{stop.phone}</p>}
                          {job.driver_name && <p className="text-teal-600 font-medium mt-1">Driver: {job.driver_name}</p>}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {stopPositions.length > 1 && (
                    <Polyline positions={stopPositions} color={color} weight={3} opacity={0.7} dashArray="6 4" />
                  )}
                </div>
              );
            })}
          </MapContainer>
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Jobs ({jobs.length})</h3>
            <button
              onClick={() => setSelectedJob(null)}
              className={`w-full text-left p-2 rounded-lg text-xs font-medium mb-2 transition-all ${!selectedJob ? "bg-teal-50 border border-[#008080] text-[#008080]" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
            >
              Show All
            </button>
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
              {jobs.map((j, ji) => (
                <div
                  key={j.id}
                  onClick={() => setSelectedJob(selectedJob === j.id ? null : j.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedJob === j.id ? "border-[#008080] bg-teal-50" : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[ji % COLORS.length] }} />
                    <span className="text-xs font-bold text-gray-700">{j.area}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">{j.total_stops} stops | {j.total_distance_km} km</p>
                  {j.driver_name && <p className="text-[10px] text-teal-600 font-medium mt-0.5">{j.driver_name}</p>}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold mt-1 inline-block ${
                    j.status === "assigned" ? "bg-blue-100 text-blue-700" :
                    j.status === "completed" ? "bg-green-100 text-green-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>{j.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
