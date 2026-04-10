import { CheckCircle, XCircle, Info, TrendingUp, Users, MapPin } from "lucide-react";

export default function ExplainabilityPanel({ assignment }) {
  const { explanation, score, score_breakdown, weights } = assignment;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#008080] to-[#006666] px-5 py-4">
        <div className="flex items-center gap-2 text-white">
          <CheckCircle size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wide">Why This Driver Was Chosen</h3>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-gray-700 leading-relaxed bg-teal-50 p-3 rounded-lg border border-teal-100">
          {explanation.selected_reason}
        </p>

        <div className="grid grid-cols-3 gap-3">
          <InsightCard icon={MapPin} label="Distance Advantage" value={explanation.distance_advantage} />
          <InsightCard icon={TrendingUp} label="Efficiency Gain" value={explanation.route_efficiency_gain} />
          <InsightCard icon={Users} label="Workload" value={explanation.workload_comparison} />
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Score Breakdown</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-4 gap-2 text-center">
              {Object.entries(score_breakdown).map(([key, val]) => {
                const weightKeyMap = { distance_to_pickup: "w1", extra_route_time: "w2", idle_time: "w3", lateness_risk: "w4" };
                const wKey = weightKeyMap[key];
                return (
                  <div key={key}>
                    <p className="text-lg font-bold text-[#008080]">{val}</p>
                    <p className="text-[10px] text-gray-400 uppercase">{key.replace(/_/g, " ")}</p>
                    <p className="text-[9px] text-gray-300">×{wKey ? weights[wKey] : "?"}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 text-center">
              <span className="text-xs text-gray-400">Final Score: </span>
              <span className="text-lg font-bold text-[#0a1628]">{score}</span>
              <span className="text-xs text-gray-400 ml-1">(lower is better)</span>
            </div>
          </div>
        </div>

        {explanation.rejected_candidates && explanation.rejected_candidates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={14} className="text-red-400" />
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rejected Candidates</h4>
            </div>
            <div className="space-y-2">
              {explanation.rejected_candidates.map((rc) => (
                <div key={rc.driver_id} className="bg-red-50/50 rounded-lg p-3 border border-red-100/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-gray-700">{rc.name}</span>
                    <div className="flex items-center gap-2">
                      {rc.score !== null && (
                        <>
                          <span className="text-xs text-gray-400">Score: {rc.score}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">
                            +{rc.score_diff}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{rc.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <Icon size={16} className="text-[#008080] mx-auto mb-1" />
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-xs font-semibold text-gray-700 mt-0.5">{value}</p>
    </div>
  );
}
