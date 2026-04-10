import { useState } from "react";
import { Radio, CheckCircle, AlertTriangle, Zap, ArrowRight } from "lucide-react";
import { drivers, jobs } from "../data/mockData";
import { runOptimization } from "../services/scoringEngine";
import { useWeights } from "../context/WeightsContext";
import ExplainabilityPanel from "../components/ExplainabilityPanel";
import RouteBreakdownCard from "../components/RouteBreakdownCard";

const vehicleTypes = ["van", "truck", "bike"];

export default function DispatchCenter() {
  const { weights } = useWeights();
  const [form, setForm] = useState({
    pickup: "",
    dropoff: "",
    vehicle_type: "van",
    weight: "",
    priority: "medium",
    time_window: "09:00-12:00",
  });
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const handleAutoAssign = () => {
    setProcessing(true);
    setTimeout(() => {
      const mockJob = {
        id: "J_NEW",
        pickup: form.pickup || "10 Commissioner St, Johannesburg",
        pickup_lat: -26.205 + (Math.random() - 0.5) * 0.02,
        pickup_lng: 28.045 + (Math.random() - 0.5) * 0.02,
        dropoff: form.dropoff || "45 Rivonia Rd, Sandton",
        dropoff_lat: -26.107 + (Math.random() - 0.5) * 0.02,
        dropoff_lng: 28.057 + (Math.random() - 0.5) * 0.02,
        vehicle_type: form.vehicle_type,
        weight: parseInt(form.weight) || 100,
        time_window: form.time_window,
        priority: form.priority,
      };
      const optimizationResult = runOptimization(drivers, mockJob, weights);
      setResult(optimizationResult);
      setProcessing(false);
    }, 1200);
  };

  const pendingJobs = jobs.filter((j) => j.status === "pending");

  const handleQuickAssign = (job) => {
    setSelectedJob(job);
    setProcessing(true);
    setTimeout(() => {
      const optimizationResult = runOptimization(drivers, job, weights);
      setResult(optimizationResult);
      setProcessing(false);
    }, 800);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dispatch Center</h1>
        <p className="text-sm text-gray-400 mt-1">Create and assign delivery jobs with AI-powered driver matching</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Radio size={16} className="text-[#008080]" />
              <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">New Job</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Pickup Address</label>
                <input
                  type="text"
                  value={form.pickup}
                  onChange={(e) => setForm({ ...form, pickup: e.target.value })}
                  placeholder="e.g. 12 Commissioner St, JHB"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Drop-off Address</label>
                <input
                  type="text"
                  value={form.dropoff}
                  onChange={(e) => setForm({ ...form, dropoff: e.target.value })}
                  placeholder="e.g. 45 Rivonia Rd, Sandton"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Vehicle Type</label>
                  <select
                    value={form.vehicle_type}
                    onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080]"
                  >
                    {vehicleTypes.map((v) => (
                      <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Weight (kg)</label>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="e.g. 120"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Time Window</label>
                  <input
                    type="text"
                    value={form.time_window}
                    onChange={(e) => setForm({ ...form, time_window: e.target.value })}
                    placeholder="09:00-12:00"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080]"
                  />
                </div>
              </div>

              <button
                onClick={handleAutoAssign}
                disabled={processing}
                className="w-full mt-2 px-4 py-3 bg-[#008080] text-white rounded-lg font-medium text-sm hover:bg-[#006e6e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Auto-Assign Driver
                  </>
                )}
              </button>
            </div>
          </div>

          {pendingJobs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Pending Jobs</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{pendingJobs.length}</span>
              </div>
              <div className="space-y-2">
                {pendingJobs.map((job) => (
                  <div key={job.id} className="p-3 bg-amber-50/50 border border-amber-100/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700">{job.id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase font-semibold">{job.priority}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mb-2">{job.pickup} → {job.dropoff}</p>
                    <button
                      onClick={() => handleQuickAssign(job)}
                      className="text-xs text-[#008080] font-semibold hover:underline flex items-center gap-1"
                    >
                      Auto-Assign <ArrowRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-2 space-y-5">
          {processing && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-12 h-12 border-3 border-gray-200 border-t-[#008080] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-500">Running 4-layer optimization engine...</p>
              <div className="mt-4 space-y-2 text-xs text-gray-400">
                <p>Layer 1: Candidate filtering...</p>
                <p>Layer 2: Scoring engine...</p>
                <p>Layer 3: Route sequencing...</p>
                <p>Layer 4: Real-time adjustment check...</p>
              </div>
            </div>
          )}

          {!processing && result && result.success && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-green-500" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Driver Assigned Successfully</p>
                  <p className="text-xs text-green-600">{result.assignment.driver_name} matched to {result.assignment.job_id} with score {result.assignment.score}</p>
                </div>
              </div>
              <RouteBreakdownCard metrics={result.assignment.metrics} />
              <ExplainabilityPanel assignment={result.assignment} />
            </>
          )}

          {!processing && result && !result.success && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-800">No Eligible Drivers</p>
                <p className="text-xs text-red-600">{result.message}</p>
              </div>
            </div>
          )}

          {!processing && !result && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Radio size={24} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">Create a new job or select a pending job to see AI-powered driver assignment with full explainability.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
