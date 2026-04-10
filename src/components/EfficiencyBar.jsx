export default function EfficiencyBar({ score, size = "md" }) {
  const getColor = (s) => {
    if (s >= 85) return "#34c759";
    if (s >= 70) return "#007aff";
    if (s >= 50) return "#ff9500";
    return "#ff3b30";
  };

  const getLabel = (s) => {
    if (s >= 85) return "Excellent";
    if (s >= 70) return "Good";
    if (s >= 50) return "Fair";
    return "Poor";
  };

  const color = getColor(score);
  const label = getLabel(score);
  const h = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className={`font-semibold ${size === "sm" ? "text-[11px]" : "text-[13px]"}`} style={{ color }}>
          {score}/100
        </span>
        <span className={`${size === "sm" ? "text-[10px]" : "text-[11px]"} text-[#aeaeb2] font-medium`}>{label}</span>
      </div>
      <div className={`w-full bg-[#e5e5ea] rounded-full ${h} overflow-hidden`}>
        <div
          className={`${h} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
