import { useState } from "react";
import { Settings as SettingsIcon, Save, RefreshCw, Info } from "lucide-react";

export default function Settings() {
  const [clusterRadius, setClusterRadius] = useState(8);
  const [defaultDrivers, setDefaultDrivers] = useState(4);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Configure optimization and system preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <SettingsIcon size={16} className="text-[#008080]" />
            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Optimization Defaults</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Default Cluster Radius</label>
                <p className="text-[10px] text-gray-400">Stops within this radius (km) are grouped into one job</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={clusterRadius}
                  onChange={(e) => setClusterRadius(parseInt(e.target.value) || 8)}
                  className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
                />
                <span className="text-xs text-gray-400">km</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Default Number of Drivers</label>
                <p className="text-[10px] text-gray-400">Used as default when running optimization</p>
              </div>
              <input
                type="number"
                min={1}
                max={20}
                value={defaultDrivers}
                onChange={(e) => setDefaultDrivers(parseInt(e.target.value) || 4)}
                className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#008080] text-white rounded-lg text-sm font-medium hover:bg-[#006e6e] transition-colors flex items-center gap-2"
            >
              <Save size={14} />
              {saved ? "Saved!" : "Save Settings"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">API Endpoints</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-xs font-mono text-gray-600">
            <p><span className="text-green-600 font-bold">POST</span> /api/upload — Upload Excel with delivery addresses</p>
            <p><span className="text-green-600 font-bold">POST</span> /api/optimize — Cluster and optimize stops into jobs</p>
            <p><span className="text-blue-600 font-bold">GET</span>&nbsp; /api/jobs — Get all jobs</p>
            <p><span className="text-green-600 font-bold">POST</span> /api/jobs/:id/assign — Assign driver to job</p>
            <p><span className="text-blue-600 font-bold">GET</span>&nbsp; /api/drivers — Get all drivers</p>
            <p><span className="text-green-600 font-bold">POST</span> /api/drivers — Add a new driver</p>
            <p><span className="text-blue-600 font-bold">GET</span>&nbsp; /api/driver/:id/jobs — Get driver's assigned jobs</p>
            <p><span className="text-green-600 font-bold">POST</span> /api/driver/:id/complete/:job_id/:stop_id — Mark stop complete</p>
          </div>
          <div className="mt-3 flex items-start gap-2 bg-teal-50 rounded-lg p-3">
            <Info size={14} className="text-[#008080] mt-0.5 shrink-0" />
            <p className="text-xs text-teal-700">
              Driver apps can call <code className="bg-teal-100 px-1 rounded">/api/driver/:id/jobs</code> to fetch assigned deliveries, and mark stops complete as they go.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">Excel Format</h2>
          <p className="text-xs text-gray-400 mb-3">Your upload file should contain these columns:</p>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-500">Column</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-500">Required</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-500">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-t border-gray-100"><td className="px-3 py-2 font-medium">Full_Address</td><td className="px-3 py-2 text-green-600">Yes</td><td className="px-3 py-2">Delivery address</td></tr>
                <tr className="border-t border-gray-100"><td className="px-3 py-2 font-medium">Order_ID</td><td className="px-3 py-2 text-gray-400">No</td><td className="px-3 py-2">Unique order ID</td></tr>
                <tr className="border-t border-gray-100"><td className="px-3 py-2 font-medium">Customer_Name</td><td className="px-3 py-2 text-gray-400">No</td><td className="px-3 py-2">Customer name</td></tr>
                <tr className="border-t border-gray-100"><td className="px-3 py-2 font-medium">Demand</td><td className="px-3 py-2 text-gray-400">No</td><td className="px-3 py-2">Order quantity/weight</td></tr>
                <tr className="border-t border-gray-100"><td className="px-3 py-2 font-medium">Time_Window_Start</td><td className="px-3 py-2 text-gray-400">No</td><td className="px-3 py-2">e.g. 08:00</td></tr>
                <tr className="border-t border-gray-100"><td className="px-3 py-2 font-medium">Time_Window_End</td><td className="px-3 py-2 text-gray-400">No</td><td className="px-3 py-2">e.g. 12:00</td></tr>
                <tr className="border-t border-gray-100"><td className="px-3 py-2 font-medium">Service_Time</td><td className="px-3 py-2 text-gray-400">No</td><td className="px-3 py-2">Minutes at stop</td></tr>
                <tr className="border-t border-gray-100"><td className="px-3 py-2 font-medium">Phone</td><td className="px-3 py-2 text-gray-400">No</td><td className="px-3 py-2">Customer phone</td></tr>
                <tr className="border-t border-gray-100"><td className="px-3 py-2 font-medium">Notes</td><td className="px-3 py-2 text-gray-400">No</td><td className="px-3 py-2">Delivery notes</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
