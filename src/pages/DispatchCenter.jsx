import { useState, useEffect } from "react";
import { Upload, Zap, CheckCircle, AlertTriangle, FileSpreadsheet, Settings2, ArrowLeft } from "lucide-react";
import { Spinner } from "../components/Loader";
import { uploadExcel, optimizeStops, getStops, getJobs } from "../services/api";

const steps = [
  { key: "upload", label: "Upload" },
  { key: "optimize", label: "Optimize" },
  { key: "results", label: "Done" },
];

export default function DispatchCenter() {
  const [step, setStep] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [stops, setStops] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [numDrivers, setNumDrivers] = useState(4);
  const [clusterRadius, setClusterRadius] = useState(8);

  useEffect(() => {
    const load = async () => {
      try {
        const [stopsRes, jobsRes] = await Promise.all([getStops(), getJobs()]);
        if (stopsRes.stops?.length > 0) {
          setStops(stopsRes.stops);
          if (jobsRes.jobs?.length > 0) {
            setJobs(jobsRes.jobs);
            setStep("results");
          } else {
            setStep("optimize");
          }
        }
      } catch (e) {
        console.error("Failed to load dispatch data:", e);
      }
    };
    load();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await uploadExcel(file);
      setUploadResult(result);
      setStops(result.stops || []);
      setStep("optimize");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    setError("");
    try {
      const result = await optimizeStops(stops, numDrivers, clusterRadius);
      setJobs(result.jobs || []);
      setStep("results");
    } catch (err) {
      setError(err.message);
    } finally {
      setOptimizing(false);
    }
  };

  const handleReUpload = () => {
    setStep("upload");
    setStops([]);
    setJobs([]);
    setUploadResult(null);
    setError("");
  };

  const stepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Dispatch Center</h1>
        <p className="text-[14px] text-[#86868b] mt-1">Upload, optimize, and dispatch delivery jobs</p>
      </div>

      <div className="flex items-center gap-3 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all duration-300 ${
                stepIndex > i ? "bg-[#34c759] text-white" :
                stepIndex === i ? "bg-[#1d1d1f] text-white" :
                "bg-[#e5e5ea] text-[#aeaeb2]"
              }`}>
                {stepIndex > i ? "✓" : i + 1}
              </div>
              <span className={`text-[13px] font-medium transition-colors ${
                stepIndex === i ? "text-[#1d1d1f]" : "text-[#aeaeb2]"
              }`}>
                {s.label}
              </span>
            </div>
            {i < 2 && <div className={`w-10 h-px transition-colors ${stepIndex > i ? "bg-[#34c759]" : "bg-[#e5e5ea]"}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-5 apple-card p-4 flex items-center gap-3 border-l-4 border-l-[#ff3b30] animate-slide-up">
          <AlertTriangle size={18} className="text-[#ff3b30] shrink-0" />
          <p className="text-[13px] text-[#1d1d1f]">{error}</p>
        </div>
      )}

      {step === "upload" && (
        <div className="max-w-xl animate-slide-up">
          <div className="apple-card p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-[16px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-5">
                <FileSpreadsheet size={28} className="text-[#86868b]" strokeWidth={1.5} />
              </div>
              <h2 className="text-[18px] font-semibold text-[#1d1d1f] mb-1 tracking-tight">Upload Delivery Data</h2>
              <p className="text-[13px] text-[#86868b]">Upload an Excel or CSV file with delivery addresses</p>
            </div>

            <div className="border-2 border-dashed border-[#d2d2d7] rounded-2xl p-10 text-center hover:border-[#86868b] transition-all duration-300 group cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                {uploading ? (
                  <div>
                    <Spinner size={28} className="mx-auto mb-4" />
                    <p className="text-[14px] text-[#1d1d1f] font-medium">Uploading and geocoding...</p>
                    <p className="text-[12px] text-[#aeaeb2] mt-1">This may take a moment</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} className="text-[#c7c7cc] mx-auto mb-4 group-hover:text-[#86868b] transition-colors" strokeWidth={1.5} />
                    <p className="text-[14px] text-[#1d1d1f] font-medium">Click to upload or drag and drop</p>
                    <p className="text-[12px] text-[#aeaeb2] mt-1">.xlsx, .xls, or .csv</p>
                  </div>
                )}
              </label>
            </div>

            <div className="mt-6 bg-[#f5f5f7] rounded-xl p-4">
              <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">Required Column</p>
              <p className="text-[12px] text-[#6e6e73]">Full_Address (or address)</p>
              <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mt-3 mb-1.5">Optional</p>
              <p className="text-[12px] text-[#aeaeb2]">Order_ID, Customer_Name, Demand, Time_Window_Start/End, Service_Time, Phone, Notes</p>
            </div>
          </div>
        </div>
      )}

      {step === "optimize" && (
        <div className="max-w-3xl animate-slide-up">
          {uploadResult && (
            <div className="apple-card p-4 flex items-center gap-3 mb-5 border-l-4 border-l-[#34c759]">
              <CheckCircle size={18} className="text-[#34c759] shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-[#1d1d1f]">Upload Complete</p>
                <p className="text-[12px] text-[#86868b]">
                  {uploadResult.geocoded} of {uploadResult.total_rows} addresses geocoded
                  {uploadResult.failed > 0 && ` | ${uploadResult.failed} failed`}
                </p>
              </div>
            </div>
          )}

          {uploadResult?.failed_details?.length > 0 && (
            <div className="apple-card p-4 mb-5 border-l-4 border-l-[#ff9500]">
              <p className="text-[12px] font-semibold text-[#ff9500] mb-2">Failed Addresses</p>
              {uploadResult.failed_details.map((f, i) => (
                <p key={i} className="text-[12px] text-[#86868b]">Row {f.row}: {f.address} — {f.reason}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="apple-card p-5">
              <h3 className="text-[14px] font-semibold text-[#1d1d1f] mb-3">Geocoded Stops ({stops.length})</h3>
              <div className="max-h-72 overflow-y-auto space-y-1.5">
                {stops.map((stop, idx) => (
                  <div key={stop.id} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-[#f5f5f7] transition-colors">
                    <span className="text-[12px] font-bold text-[#86868b] w-5 shrink-0 text-right">{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-[#1d1d1f] truncate">{stop.customer_name}</p>
                      <p className="text-[11px] text-[#aeaeb2] truncate">{stop.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="apple-card p-5">
              <div className="flex items-center gap-2 mb-5">
                <Settings2 size={16} className="text-[#86868b]" strokeWidth={1.8} />
                <h3 className="text-[14px] font-semibold text-[#1d1d1f]">Settings</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] text-[#86868b] font-medium mb-1.5 block">Number of Drivers</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={numDrivers}
                    onChange={(e) => setNumDrivers(parseInt(e.target.value) || 1)}
                    className="apple-input"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-[#86868b] font-medium mb-1.5 block">Cluster Radius (km)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={clusterRadius}
                    onChange={(e) => setClusterRadius(parseInt(e.target.value) || 8)}
                    className="apple-input"
                  />
                  <p className="text-[11px] text-[#aeaeb2] mt-1">Stops within this radius are grouped into one job</p>
                </div>
              </div>

              <button
                onClick={handleOptimize}
                disabled={optimizing || stops.length < 2}
                className="apple-btn apple-btn-primary w-full mt-6"
              >
                {optimizing ? (
                  <>
                    <Spinner size={16} />
                    <span>Optimizing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Optimize & Create Jobs</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <button onClick={handleReUpload} className="text-[13px] text-[#aeaeb2] hover:text-[#1d1d1f] transition-colors flex items-center gap-1.5 mt-2">
            <ArrowLeft size={14} />
            Upload different file
          </button>
        </div>
      )}

      {step === "results" && (
        <div className="animate-slide-up">
          <div className="apple-card p-5 flex items-center justify-between mb-6 border-l-4 border-l-[#34c759]">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-[#34c759]" />
              <div>
                <p className="text-[14px] font-semibold text-[#1d1d1f]">{jobs.length} Jobs Created</p>
                <p className="text-[12px] text-[#86868b]">{stops.length} stops grouped and optimized</p>
              </div>
            </div>
            <button onClick={handleReUpload} className="apple-btn apple-btn-secondary text-[13px] py-2 px-4">
              Upload New
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job, i) => (
              <div key={job.id} className="apple-card p-5 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#f5f5f7] text-[#86868b] font-semibold">{job.id}</span>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                    job.status === "assigned" ? "bg-[#007aff]/10 text-[#007aff]" :
                    job.status === "completed" ? "bg-[#34c759]/10 text-[#34c759]" :
                    "bg-[#ff9500]/10 text-[#ff9500]"
                  }`}>{job.status}</span>
                </div>
                <h3 className="text-[16px] font-semibold text-[#1d1d1f] mb-3 tracking-tight">{job.area}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: job.total_stops, l: "Stops" },
                    { v: `${job.total_distance_km}`, l: "km" },
                    { v: `${job.estimated_time_min}`, l: "min" },
                    { v: `R ${job.estimated_cost}`, l: "Cost" },
                  ].map(({ v, l }) => (
                    <div key={l} className="bg-[#f5f5f7] rounded-xl p-2.5 text-center">
                      <p className="text-[15px] font-semibold text-[#1d1d1f]">{v}</p>
                      <p className="text-[10px] text-[#aeaeb2] font-medium">{l}</p>
                    </div>
                  ))}
                </div>
                {job.driver_name && (
                  <div className="mt-3 p-2.5 bg-[#007aff]/5 rounded-xl">
                    <p className="text-[12px] text-[#007aff] font-medium">{job.driver_name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
