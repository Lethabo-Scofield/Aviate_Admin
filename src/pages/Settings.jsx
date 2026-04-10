import { useState } from "react";
import { Settings as SettingsIcon, Save, Info, Check } from "lucide-react";

export default function Settings() {
  const [clusterRadius, setClusterRadius] = useState(8);
  const [defaultDrivers, setDefaultDrivers] = useState(4);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Settings</h1>
        <p className="text-[14px] text-[#86868b] mt-1">Configure optimization and system preferences</p>
      </div>

      <div className="max-w-2xl space-y-5">
        <div className="apple-card p-6">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-[#f5f5f7] flex items-center justify-center">
              <SettingsIcon size={15} className="text-[#86868b]" strokeWidth={1.8} />
            </div>
            <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Optimization Defaults</h2>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-[14px] font-medium text-[#1d1d1f]">Cluster Radius</label>
                <p className="text-[12px] text-[#aeaeb2] mt-0.5">Stops within this radius are grouped into one job</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={clusterRadius}
                  onChange={(e) => setClusterRadius(parseInt(e.target.value) || 8)}
                  className="apple-input w-20 text-right"
                />
                <span className="text-[13px] text-[#aeaeb2]">km</span>
              </div>
            </div>
            <div className="h-px bg-[#f0f0f0]" />
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-[14px] font-medium text-[#1d1d1f]">Default Drivers</label>
                <p className="text-[12px] text-[#aeaeb2] mt-0.5">Used as default when running optimization</p>
              </div>
              <input
                type="number"
                min={1}
                max={20}
                value={defaultDrivers}
                onChange={(e) => setDefaultDrivers(parseInt(e.target.value) || 4)}
                className="apple-input w-20 text-right"
              />
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#f0f0f0]">
            <button
              onClick={handleSave}
              className={`apple-btn transition-all ${saved ? "bg-[#34c759] text-white" : "apple-btn-primary"}`}
            >
              {saved ? <><Check size={16} /> Saved</> : <><Save size={14} /> Save Settings</>}
            </button>
          </div>
        </div>

        <div className="apple-card p-6">
          <h2 className="text-[15px] font-semibold text-[#1d1d1f] mb-5">API Reference</h2>
          <div className="bg-[#f5f5f7] rounded-xl p-4 space-y-2 font-mono text-[12px] text-[#6e6e73]">
            <p><span className="text-[#34c759] font-bold">POST</span> /api/upload</p>
            <p><span className="text-[#34c759] font-bold">POST</span> /api/optimize</p>
            <p><span className="text-[#007aff] font-bold">GET</span>&nbsp; /api/jobs</p>
            <p><span className="text-[#34c759] font-bold">POST</span> /api/jobs/:id/assign</p>
            <p><span className="text-[#007aff] font-bold">GET</span>&nbsp; /api/drivers</p>
            <p><span className="text-[#34c759] font-bold">POST</span> /api/drivers</p>
            <p><span className="text-[#007aff] font-bold">GET</span>&nbsp; /api/driver/:id/jobs</p>
            <p><span className="text-[#34c759] font-bold">POST</span> /api/driver/:id/complete/:job_id/:stop_id</p>
          </div>
          <div className="mt-4 flex items-start gap-2.5 bg-[#f5f5f7] rounded-xl p-3.5">
            <Info size={14} className="text-[#86868b] mt-0.5 shrink-0" />
            <p className="text-[12px] text-[#6e6e73]">
              Driver apps call <code className="bg-[#e5e5ea] px-1.5 py-0.5 rounded-md text-[11px] font-semibold">/api/driver/:id/jobs</code> to fetch deliveries and mark stops complete.
            </p>
          </div>
        </div>

        <div className="apple-card p-6">
          <h2 className="text-[15px] font-semibold text-[#1d1d1f] mb-5">Excel Format</h2>
          <p className="text-[13px] text-[#86868b] mb-4">Your upload file should contain these columns:</p>
          <div className="overflow-hidden rounded-xl border border-[#e5e5ea]">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#f5f5f7]">
                  <th className="text-left px-4 py-2.5 font-semibold text-[#86868b]">Column</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#86868b]">Required</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#86868b]">Description</th>
                </tr>
              </thead>
              <tbody className="text-[#6e6e73]">
                {[
                  ["Full_Address", true, "Delivery address"],
                  ["Order_ID", false, "Unique order ID"],
                  ["Customer_Name", false, "Customer name"],
                  ["Demand", false, "Order quantity/weight"],
                  ["Time_Window_Start", false, "e.g. 08:00"],
                  ["Time_Window_End", false, "e.g. 12:00"],
                  ["Service_Time", false, "Minutes at stop"],
                  ["Phone", false, "Customer phone"],
                  ["Notes", false, "Delivery notes"],
                ].map(([col, req, desc]) => (
                  <tr key={col} className="border-t border-[#f0f0f0]">
                    <td className="px-4 py-2.5 font-medium text-[#1d1d1f]">{col}</td>
                    <td className="px-4 py-2.5">
                      {req ?
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#34c759]/10 text-[#34c759] font-semibold">Required</span> :
                        <span className="text-[#aeaeb2]">Optional</span>
                      }
                    </td>
                    <td className="px-4 py-2.5">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
