import { useState, useEffect } from "react";
import { Upload, Zap, CheckCircle, AlertTriangle, MapPin, Package, FileSpreadsheet, Settings2 } from "lucide-react";
import { uploadExcel, optimizeStops, getStops, getJobs } from "../services/api";

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
      } catch (e) {}
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dispatch Center</h1>
        <p className="text-sm text-gray-400 mt-1">Upload delivery data, optimize routes, and create jobs for drivers</p>
      </div>

      <div className="flex items-center gap-4 mb-8">
        {["upload", "optimize", "results"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === s ? "bg-[#008080] text-white" :
              ["upload", "optimize", "results"].indexOf(step) > i ? "bg-green-500 text-white" :
              "bg-gray-200 text-gray-400"
            }`}>
              {["upload", "optimize", "results"].indexOf(step) > i ? "✓" : i + 1}
            </div>
            <span className={`text-sm font-medium ${step === s ? "text-gray-800" : "text-gray-400"}`}>
              {s === "upload" ? "Upload Excel" : s === "optimize" ? "Optimize" : "Jobs Ready"}
            </span>
            {i < 2 && <div className="w-12 h-px bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {step === "upload" && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet size={28} className="text-[#008080]" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Upload Delivery Data</h2>
              <p className="text-sm text-gray-400">Upload an Excel (.xlsx) or CSV file with delivery addresses</p>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#008080] transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? (
                  <div>
                    <div className="w-10 h-10 border-3 border-gray-200 border-t-[#008080] rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Uploading and geocoding addresses...</p>
                    <p className="text-xs text-gray-400 mt-1">This may take a minute depending on the number of addresses</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, .csv</p>
                  </div>
                )}
              </label>
            </div>

            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Expected Columns</h3>
              <p className="text-xs text-gray-400">
                <strong>Required:</strong> Full_Address (or address)<br />
                <strong>Optional:</strong> Order_ID, Customer_Name, Demand, Time_Window_Start, Time_Window_End, Service_Time, Phone, Notes
              </p>
            </div>
          </div>
        </div>
      )}

      {step === "optimize" && (
        <div className="max-w-3xl">
          {uploadResult && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 mb-5">
              <CheckCircle size={18} className="text-green-500" />
              <div>
                <p className="text-sm font-semibold text-green-800">Upload Complete</p>
                <p className="text-xs text-green-600">
                  {uploadResult.geocoded} of {uploadResult.total_rows} addresses geocoded successfully
                  {uploadResult.failed > 0 && ` | ${uploadResult.failed} failed`}
                </p>
              </div>
            </div>
          )}

          {uploadResult?.failed_details?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-amber-700 mb-2">Failed Addresses:</p>
              {uploadResult.failed_details.map((f, i) => (
                <p key={i} className="text-xs text-amber-600">Row {f.row}: {f.address} — {f.reason}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Geocoded Stops ({stops.length})</h3>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {stops.map((stop, idx) => (
                  <div key={stop.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg text-xs">
                    <span className="font-bold text-[#008080] w-6 shrink-0">{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-700 truncate">{stop.customer_name}</p>
                      <p className="text-gray-400 truncate">{stop.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 size={16} className="text-[#008080]" />
                <h3 className="text-sm font-semibold text-gray-800">Optimization Settings</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Number of Drivers</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={numDrivers}
                    onChange={(e) => setNumDrivers(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">How many drivers will handle these deliveries</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Cluster Radius (km)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={clusterRadius}
                    onChange={(e) => setClusterRadius(parseInt(e.target.value) || 8)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Stops within this radius are grouped into one job</p>
                </div>
              </div>

              <button
                onClick={handleOptimize}
                disabled={optimizing || stops.length < 2}
                className="w-full mt-6 px-4 py-3 bg-[#008080] text-white rounded-lg font-medium text-sm hover:bg-[#006e6e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {optimizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Optimizing routes...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Optimize &amp; Create Jobs
                  </>
                )}
              </button>
            </div>
          </div>

          <button onClick={handleReUpload} className="text-xs text-gray-400 hover:text-gray-600">
            ← Upload different file
          </button>
        </div>
      )}

      {step === "results" && (
        <div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-green-500" />
              <div>
                <p className="text-sm font-semibold text-green-800">{jobs.length} Jobs Created</p>
                <p className="text-xs text-green-600">{stops.length} stops grouped and optimized into delivery jobs</p>
              </div>
            </div>
            <button onClick={handleReUpload} className="text-xs text-green-700 font-medium hover:underline">Upload New File</button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-teal-100 text-teal-700 font-bold">{job.id}</span>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase ${
                    job.status === "assigned" ? "bg-blue-100 text-blue-700" :
                    job.status === "completed" ? "bg-green-100 text-green-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>{job.status}</span>
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-1">{job.area}</h3>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-gray-800">{job.total_stops}</p>
                    <p className="text-[10px] text-gray-400">Stops</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-gray-800">{job.total_distance_km}</p>
                    <p className="text-[10px] text-gray-400">km</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-gray-800">{job.estimated_time_min}</p>
                    <p className="text-[10px] text-gray-400">min</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-[#008080]">R {job.estimated_cost}</p>
                    <p className="text-[10px] text-gray-400">Cost</p>
                  </div>
                </div>
                {job.driver_name && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 font-medium">Assigned: {job.driver_name}</p>
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
