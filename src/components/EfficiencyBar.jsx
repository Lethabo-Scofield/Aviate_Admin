export default function EfficiencyBar({ score, size = "md" }) {
  const getColor = (s) => {
    if (s >= 85) return "#008080";
    if (s >= 70) return "#0ea5e9";
    if (s >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const getLabel = (s) => {
    if (s >= 85) return "Excellent";
    if (s >= 70) return "Good";
    if (s >= 50) return "Fair";
    return "Poor";
  };

  const color = getColor(score);
  const label = getLabel(score);
  const h = size === "sm" ? "h-2" : "h-3";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className={`font-semibold ${size === "sm" ? "text-xs" : "text-sm"}`} style={{ color }}>
          {score}/100
        </span>
        <span className={`${size === "sm" ? "text-[10px]" : "text-xs"} text-gray-400`}>{label}</span>
      </div>
      <div className={`w-full bg-gray-100 rounded-full ${h} overflow-hidden`}>
        <div
          className={`${h} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
