import { MapPin, Clock, Gauge, DollarSign, Timer } from "lucide-react";
import EfficiencyBar from "./EfficiencyBar";

export default function RouteBreakdownCard({ metrics }) {
  const items = [
    { icon: MapPin, label: "Total Distance", value: `${metrics.distance} km`, color: "#008080" },
    { icon: Clock, label: "Est. Time", value: `${metrics.time} min`, color: "#1e3a5f" },
    { icon: Timer, label: "Idle Driving", value: `${metrics.idle_time} min`, color: "#f59e0b" },
    { icon: DollarSign, label: "Cost Estimate", value: `R ${metrics.cost.toFixed(2)}`, color: "#008080" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">Route Breakdown</h3>
      <div className="grid grid-cols-2 gap-4 mb-5">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "12" }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-bold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">Efficiency Score</p>
        <EfficiencyBar score={metrics.efficiency_score} />
      </div>
    </div>
  );
}
