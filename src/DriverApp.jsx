import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Auto-fit map bounds
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
}

// Haversine formula to calculate distance between two lat/lng points in km
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function DriverApp({ stops }) {
  const [completed, setCompleted] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRoute = async () => {
      if (stops.length < 2) return;

      setLoadingRoute(true);
      setError("");

      const coordinates = stops.map((s) => [s.lng, s.lat]);

      try {
        const res = await fetch(
          "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
          {
            method: "POST",
            headers: {
              "Authorization": "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijk2MzVjOTZhZTIyNjRmY2U4YTIyZWY1NzdiZTMyZDAyIiwiaCI6Im11cm11cjY0In0=", // Replace with your ORS key
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ coordinates }),
          }
        );

        if (!res.ok) throw new Error("Failed to fetch route from ORS");
        const data = await res.json();

        const route = data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setRouteCoords(route);
      } catch (err) {
        console.error(err);
        setError("Failed to load route, showing straight lines.");
        setRouteCoords(stops.map((s) => [s.lat, s.lng]));
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [stops]);

  const markComplete = (id) => setCompleted((prev) => [...prev, id]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-4">
      {/* Stops List */}
      <ul className="w-full lg:w-64 max-h-[500px] overflow-y-auto border rounded p-4 bg-gray-50 shadow">
        {stops.map((stop, idx) => {
          // Calculate distance from previous stop (if not the first)
          let distance = null;
          if (idx > 0) {
            const prev = stops[idx - 1];
            distance = haversineDistance(prev.lat, prev.lng, stop.lat, stop.lng);
          }
          return (
            <li
              key={stop.id}
              className={`flex flex-col py-1 border-b last:border-b-0 ${completed.includes(stop.id) ? "line-through text-gray-400" : ""}`}
            >
              <div className="flex justify-between items-center">
                <span>{idx + 1}. {stop.address}</span>
                {!completed.includes(stop.id) && (
                  <button
                    onClick={() => markComplete(stop.id)}
                    className="ml-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Complete
                  </button>
                )}
              </div>
              {distance !== null && (
                <span className="text-xs text-gray-500 ml-4">Distance from previous: {distance.toFixed(2)} km</span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Map */}
      <div className="flex-1 h-[500px] rounded shadow overflow-hidden relative">
        {loadingRoute && (
          <div className="absolute z-10 top-0 left-0 w-full h-full flex items-center justify-center bg-white/70">
            <span className="text-lg font-semibold">Loading route...</span>
          </div>
        )}
        {error && (
          <div className="absolute z-10 top-0 left-0 w-full p-2 text-red-600 font-semibold">
            {error}
          </div>
        )}
        <MapContainer
          center={[stops[0].lat, stops[0].lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {stops.map((stop, idx) => {
            const stopIcon = L.divIcon({
              className: '',
              html: `<div style="display:flex;flex-direction:column;align-items:center;">
                <div style="background:#2563eb;color:#fff;padding:2px 8px;border-radius:8px;font-size:13px;font-weight:bold;display:flex;align-items:center;box-shadow:0 2px 6px #0002;">
                  <span style='margin-right:4px;'>🛑</span>Stop ${idx + 1}
                </div>
                <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid #2563eb;"></div>
              </div>`
            });
            return (
              <Marker
                key={stop.id}
                position={[stop.lat, stop.lng]}
                icon={stopIcon}
                opacity={completed.includes(stop.id) ? 0.5 : 1}
              >
                <Popup>
                  <div className="font-semibold text-blue-700">Stop {idx + 1}</div>
                  <div>{stop.address}</div>
                </Popup>
              </Marker>
            );
          })}

          {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" weight={4} />}

          <FitBounds positions={routeCoords.length > 0 ? routeCoords : stops.map(s => [s.lat, s.lng])} />
        </MapContainer>
      </div>
    </div>
  );
}
