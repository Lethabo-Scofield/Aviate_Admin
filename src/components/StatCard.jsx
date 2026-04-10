export default function StatCard({ icon: Icon, label, value, sub, trend, color = "#008080" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "12" }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <span className={`text-xs font-medium ${trend > 0 ? "text-green-500" : "text-red-500"}`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-gray-400 ml-1">vs last week</span>
        </div>
      )}
    </div>
  );
}
