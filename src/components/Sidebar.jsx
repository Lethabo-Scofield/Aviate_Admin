import { NavLink } from "react-router-dom";
import { LayoutDashboard, Radio, Package, Truck } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/dispatch", icon: Radio, label: "Dispatch" },
  { to: "/jobs", icon: Package, label: "Jobs" },
  { to: "/drivers", icon: Truck, label: "Drivers" },
];

export default function Sidebar() {
  return (
    <aside className="w-[240px] fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-black/[0.04]"
      style={{
        background: "rgba(245, 245, 247, 0.72)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#1d1d1f] flex items-center justify-center font-bold text-sm text-white tracking-tight">
            A
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">Aviate</h1>
            <p className="text-[11px] text-[#86868b] font-medium">Route Optimization</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-[9px] rounded-[10px] text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#1d1d1f] text-white shadow-sm"
                  : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04]"
              }`
            }
          >
            <Icon size={17} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 mx-3 mb-4 rounded-xl bg-[#f5f5f7]">
        <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1">How it works</p>
        <p className="text-[11px] text-[#aeaeb2] leading-relaxed">
          Upload Excel → Optimize routes → Assign drivers
        </p>
      </div>
    </aside>
  );
}
