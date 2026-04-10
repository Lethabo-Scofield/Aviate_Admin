export default function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="apple-card p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[12px] text-[#86868b] font-medium uppercase tracking-wide mb-2">{label}</p>
          <p className="text-[26px] font-semibold text-[#1d1d1f] tracking-tight leading-none">{value}</p>
          {sub && <p className="text-[12px] text-[#aeaeb2] mt-2">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center">
          <Icon size={18} className="text-[#86868b]" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}
