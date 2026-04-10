import { useState } from "react";
import { Settings as SettingsIcon, Save, RefreshCw } from "lucide-react";
import { useWeights } from "../context/WeightsContext";

export default function Settings() {
  const { weights, setWeights, resetWeights } = useWeights();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetWeights();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Configure optimization parameters and system preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <SettingsIcon size={16} className="text-[#008080]" />
            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Scoring Engine Weights</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Adjust the weights used in the scoring formula: score = (distance × w1) + (extra_route_time × w2) + (idle_time × w3) + (lateness_risk × w4)
          </p>

          <div className="space-y-4">
            {[
              { key: "w1", label: "Distance to Pickup", desc: "How much proximity to pickup matters" },
              { key: "w2", label: "Extra Route Time", desc: "Penalty for added detour time" },
              { key: "w3", label: "Idle Driving Time", desc: "Weight for non-productive driving" },
              { key: "w4", label: "Lateness Risk", desc: "Priority of on-time delivery" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <p className="text-[10px] text-gray-400">{desc}</p>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={weights[key]}
                  onChange={(e) => setWeights({ ...weights, [key]: parseFloat(e.target.value) })}
                  className="w-32 accent-[#008080]"
                />
                <span className="text-sm font-bold text-gray-800 w-10 text-right">{weights[key].toFixed(1)}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#008080] text-white rounded-lg text-sm font-medium hover:bg-[#006e6e] transition-colors flex items-center gap-2"
            >
              <Save size={14} />
              {saved ? "Saved!" : "Save Weights"}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Reset Defaults
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">General Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Auto-assign on job creation</p>
                <p className="text-[10px] text-gray-400">Automatically run optimization when new jobs are created</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#008080]/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#008080]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Real-time route adjustments</p>
                <p className="text-[10px] text-gray-400">Recalculate routes when conditions change (Layer 4)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#008080]/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#008080]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Maximum pickup radius</p>
                <p className="text-[10px] text-gray-400">Max distance a driver can be from a pickup point</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue={30}
                  className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm text-right"
                />
                <span className="text-xs text-gray-400">km</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">API Configuration</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">OpenRouteService API Key</label>
              <input
                type="password"
                defaultValue="••••••••••••••••"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Geocoding Provider</label>
              <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                <option>Nominatim (OpenStreetMap)</option>
                <option>Google Maps Geocoding</option>
                <option>Mapbox Geocoding</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
