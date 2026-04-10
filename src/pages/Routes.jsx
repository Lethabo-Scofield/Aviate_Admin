import { useState, useEffect } from "react";
import { GitBranch, ChevronRight, MapPin, Clock, DollarSign } from "lucide-react";
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
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[#008080] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Routes</h1>
        <p className="text-sm text-gray-400 mt-1">Optimized route details and stop sequences</p>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <GitBranch size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No routes yet. Upload and optimize deliveries in the Dispatch Center.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Optimized Routes ({jobs.length})</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {jobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected ? "bg-teal-50 border-l-4 border-l-[#008080]" : "hover:bg-gray-50 border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <GitBranch size={14} className="text-[#008080]" />
                          <span className="text-sm font-bold text-gray-800">{job.id}</span>
                        </div>
                        <ChevronRight size={14} className={`transition-transform ${isSelected ? "rotate-90 text-[#008080]" : "text-gray-300"}`} />
                      </div>
                      <p className="text-xs font-medium text-gray-600">{job.area}</p>
                      <p className="text-[10px] text-gray-400">{job.total_stops} stops | {job.total_distance_km} km</p>
                      {job.driver_name && <p className="text-[10px] text-teal-600 font-medium mt-1">Driver: {job.driver_name}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-5">
            {selectedJob ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-lg font-bold text-gray-800">{selectedJob.area}</h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-700 font-semibold">{selectedJob.id}</span>
                  {selectedJob.driver_name && (
                    <>
                      <span className="text-xs text-gray-400">→</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">{selectedJob.driver_name}</span>
                    </>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">Route Breakdown</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                        <MapPin size={16} className="text-[#008080]" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase">Distance</p>
                        <p className="text-sm font-bold text-gray-800">{selectedJob.total_distance_km} km</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Clock size={16} className="text-[#1e3a5f]" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase">Est. Time</p>
                        <p className="text-sm font-bold text-gray-800">{selectedJob.estimated_time_min} min</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                        <DollarSign size={16} className="text-[#008080]" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase">Est. Cost</p>
                        <p className="text-sm font-bold text-gray-800">R {selectedJob.estimated_cost}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                        <span className="text-sm">📦</span>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase">Stops</p>
                        <p className="text-sm font-bold text-gray-800">{selectedJob.total_stops}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">Optimized Stop Sequence</h3>
                  <div className="space-y-2">
                    {selectedJob.stops.map((stop, idx) => (
                      <div key={stop.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${stop.completed ? "bg-green-500" : "bg-[#008080]"}`}>
                            {idx + 1}
                          </div>
                          {idx < selectedJob.stops.length - 1 && <div className="w-px h-8 bg-gray-200" />}
                        </div>
                        <div className={`flex-1 p-3 rounded-lg ${stop.completed ? "bg-green-50" : "bg-gray-50"}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {stop.customer_name}
                                <span className="text-xs text-gray-400 font-normal ml-2">{stop.order_id}</span>
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{stop.address}</p>
                              {stop.time_window_start && stop.time_window_end && (
                                <p className="text-[10px] text-gray-400 mt-0.5">Window: {stop.time_window_start} - {stop.time_window_end}</p>
                              )}
                            </div>
                            <div className="text-right">
                              {stop.demand > 0 && <p className="text-[10px] text-gray-400">Demand: {stop.demand}</p>}
                              {stop.completed && <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-semibold">DONE</span>}
                            </div>
                          </div>
                          {stop.notes && <p className="text-[10px] text-gray-400 italic mt-1">{stop.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <GitBranch size={24} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">Select a route to view its optimized stop sequence, distance, time, and cost breakdown.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
