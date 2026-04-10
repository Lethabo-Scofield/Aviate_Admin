import { useState, useEffect } from "react";
import { GitBranch, ChevronRight, MapPin, Clock, DollarSign, Package } from "lucide-react";
import { PageLoader } from "../components/Loader";
import { getJobs } from "../services/api";

export default function Routes() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getJobs();
        setJobs(res.jobs || []);
      } catch (e) {
        console.error("Failed to load routes:", e);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Routes</h1>
        <p className="text-[14px] text-[#86868b] mt-1">Optimized route details and stop sequences</p>
      </div>

      {jobs.length === 0 ? (
        <div className="apple-card p-16 text-center">
          <GitBranch size={36} className="text-[#c7c7cc] mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-[14px] text-[#86868b]">No routes yet. Upload and optimize deliveries in the Dispatch Center.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1">
            <div className="apple-card overflow-hidden">
              <div className="px-5 py-3.5 bg-[#fafafa] border-b border-[#f0f0f0]">
                <h2 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Routes ({jobs.length})</h2>
              </div>
              <div className="divide-y divide-[#f5f5f7]">
                {jobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected ? "bg-[#1d1d1f]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <GitBranch size={13} className={isSelected ? "text-white/60" : "text-[#aeaeb2]"} strokeWidth={1.8} />
                          <span className={`text-[13px] font-semibold ${isSelected ? "text-white" : "text-[#1d1d1f]"}`}>{job.id}</span>
                        </div>
                        <ChevronRight size={13} className={`transition-transform ${isSelected ? "rotate-90 text-white/40" : "text-[#c7c7cc]"}`} />
                      </div>
                      <p className={`text-[12px] font-medium ${isSelected ? "text-white/80" : "text-[#6e6e73]"}`}>{job.area}</p>
                      <p className={`text-[10px] ${isSelected ? "text-white/40" : "text-[#aeaeb2]"}`}>{job.total_stops} stops | {job.total_distance_km} km</p>
                      {job.driver_name && (
                        <p className={`text-[10px] font-medium mt-1 ${isSelected ? "text-white/60" : "text-[#007aff]"}`}>
                          {job.driver_name}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-4">
            {selectedJob ? (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-[20px] font-semibold text-[#1d1d1f] tracking-tight">{selectedJob.area}</h2>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#f5f5f7] text-[#86868b] font-semibold">{selectedJob.id}</span>
                  {selectedJob.driver_name && (
                    <>
                      <span className="text-[#c7c7cc]">/</span>
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#007aff]/10 text-[#007aff] font-semibold">{selectedJob.driver_name}</span>
                    </>
                  )}
                </div>

                <div className="apple-card p-5 mb-4">
                  <div className="grid grid-cols-4 gap-5">
                    {[
                      { icon: MapPin, label: "Distance", value: `${selectedJob.total_distance_km} km` },
                      { icon: Clock, label: "Est. Time", value: `${selectedJob.estimated_time_min} min` },
                      { icon: DollarSign, label: "Est. Cost", value: `R ${selectedJob.estimated_cost}` },
                      { icon: Package, label: "Stops", value: selectedJob.total_stops },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center shrink-0">
                          {Icon ? <Icon size={15} className="text-[#86868b]" strokeWidth={1.8} /> :
                            <span className="text-[13px]">📦</span>
                          }
                        </div>
                        <div>
                          <p className="text-[11px] text-[#aeaeb2] font-medium uppercase">{label}</p>
                          <p className="text-[15px] font-semibold text-[#1d1d1f]">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="apple-card p-5">
                  <h3 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-4">Stop Sequence</h3>
                  <div className="space-y-0">
                    {selectedJob.stops.map((stop, idx) => (
                      <div key={stop.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                            stop.completed ? "bg-[#34c759]" : "bg-[#1d1d1f]"
                          }`}>
                            {idx + 1}
                          </div>
                          {idx < selectedJob.stops.length - 1 && <div className="w-px h-8 bg-[#e5e5ea]" />}
                        </div>
                        <div className={`flex-1 p-3 rounded-xl mb-1 ${stop.completed ? "bg-[#34c759]/5" : "bg-[#f5f5f7]"}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[13px] font-semibold text-[#1d1d1f]">
                                {stop.customer_name}
                                <span className="text-[11px] text-[#aeaeb2] font-normal ml-2">{stop.order_id}</span>
                              </p>
                              <p className="text-[12px] text-[#aeaeb2] mt-0.5">{stop.address}</p>
                              {stop.time_window_start && stop.time_window_end && (
                                <p className="text-[10px] text-[#aeaeb2] mt-0.5">{stop.time_window_start} - {stop.time_window_end}</p>
                              )}
                            </div>
                            <div className="text-right">
                              {stop.demand > 0 && <p className="text-[10px] text-[#aeaeb2]">Qty: {stop.demand}</p>}
                              {stop.completed && <span className="text-[9px] px-2 py-0.5 bg-[#34c759]/10 text-[#34c759] rounded-full font-semibold">DONE</span>}
                            </div>
                          </div>
                          {stop.notes && <p className="text-[10px] text-[#aeaeb2] italic mt-1">{stop.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="apple-card p-16 text-center">
                <div className="w-16 h-16 rounded-[16px] bg-[#f5f5f7] flex items-center justify-center mx-auto mb-5">
                  <GitBranch size={28} className="text-[#c7c7cc]" strokeWidth={1.5} />
                </div>
                <p className="text-[14px] text-[#86868b]">Select a route to view its optimized stop sequence and breakdown.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
