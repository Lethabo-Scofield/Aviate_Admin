import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { PageLoader } from "../components/Loader";
import { getJobs } from "../services/api";

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
  }, [bounds, map]);
  return null;
}

const COLORS = ["#1d1d1f", "#007aff", "#ff9500", "#34c759", "#af52de", "#ff3b30", "#5ac8fa", "#ff2d55"];

function makeIcon(label, color) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="background:${color};color:#fff;padding:3px 8px;border-radius:10px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.15);letter-spacing:-0.02em;">${label}</div>
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
      } catch (e) {
        console.error("Failed to load map data:", e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const assignedJobs = jobs.filter((j) => j.status !== "completed");
  const allPositions = assignedJobs.flatMap((j) => j.stops.map((s) => [s.lat, s.lng]));

  if (loading) return <PageLoader />;

  if (jobs.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Live Map</h1>
          <p className="text-[14px] text-[#86868b] mt-1">Map view of delivery jobs and stops</p>
        </div>
        <div className="apple-card p-16 text-center">
          <MapPin size={36} className="text-[#c7c7cc] mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-[14px] text-[#86868b]">No jobs to display. Upload deliveries in the Dispatch Center.</p>
        </div>
      </div>
    );
  }

  const displayJobs = selectedJob ? [jobs.find((j) => j.id === selectedJob)].filter(Boolean) : assignedJobs;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Live Map</h1>
        <p className="text-[14px] text-[#86868b] mt-1">Delivery jobs and optimized stop sequences</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 h-[600px] rounded-2xl overflow-hidden apple-card p-0">
          <MapContainer center={[-26.195, 28.045]} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            {allPositions.length > 0 && <FitBounds bounds={allPositions} />}

            {displayJobs.map((job, ji) => {
              const color = COLORS[ji % COLORS.length];
              const stopPositions = job.stops.map((s) => [s.lat, s.lng]);

              return (
                <div key={job.id}>
                  {job.stops.map((stop, si) => (
                    <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={makeIcon(`${si + 1}`, color)}>
                      <Popup>
                        <div style={{ fontSize: 12, fontFamily: "-apple-system, sans-serif" }}>
                          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{stop.customer_name}</p>
                          <p style={{ color: "#86868b" }}>{stop.address}</p>
                          <p style={{ color: "#aeaeb2", marginTop: 4 }}>{job.area} | {job.id}</p>
                          {stop.phone && <p style={{ color: "#aeaeb2" }}>{stop.phone}</p>}
                          {job.driver_name && <p style={{ color: "#007aff", fontWeight: 600, marginTop: 4 }}>Driver: {job.driver_name}</p>}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {stopPositions.length > 1 && (
                    <Polyline positions={stopPositions} color={color} weight={2.5} opacity={0.6} dashArray="6 4" />
                  )}
                </div>
              );
            })}
          </MapContainer>
        </div>

        <div className="space-y-3">
          <div className="apple-card p-4">
            <h3 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-3">Jobs ({jobs.length})</h3>
            <button
              onClick={() => setSelectedJob(null)}
              className={`w-full text-left p-2.5 rounded-xl text-[12px] font-medium mb-2 transition-all ${
                !selectedJob ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e5e5ea]"
              }`}
            >
              Show All
            </button>
            <div className="space-y-1 max-h-[480px] overflow-y-auto">
              {jobs.map((j, ji) => (
                <div
                  key={j.id}
                  onClick={() => setSelectedJob(selectedJob === j.id ? null : j.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    selectedJob === j.id ? "bg-[#1d1d1f] text-white" : "hover:bg-[#f5f5f7]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[ji % COLORS.length] }} />
                    <span className={`text-[12px] font-semibold ${selectedJob === j.id ? "text-white" : "text-[#1d1d1f]"}`}>{j.area}</span>
                  </div>
                  <p className={`text-[10px] ml-[18px] ${selectedJob === j.id ? "text-white/60" : "text-[#aeaeb2]"}`}>
                    {j.total_stops} stops | {j.total_distance_km} km
                  </p>
                  {j.driver_name && (
                    <p className={`text-[10px] ml-[18px] font-medium mt-0.5 ${selectedJob === j.id ? "text-white/70" : "text-[#007aff]"}`}>
                      {j.driver_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
