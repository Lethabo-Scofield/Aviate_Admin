import { NavLink } from "react-router-dom";
import { LayoutDashboard, Radio, Map, Package, Truck, GitBranch, BarChart3, Settings } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/dispatch", icon: Radio, label: "Dispatch" },
  { to: "/map", icon: Map, label: "Live Map" },
  { to: "/jobs", icon: Package, label: "Jobs" },
  { to: "/drivers", icon: Truck, label: "Drivers" },
  { to: "/routes", icon: GitBranch, label: "Routes" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-[260px] fixed left-0 top-0 bottom-0 z-30 flex flex-col border-r border-black/[0.04]"
      style={{
        background: "rgba(245, 245, 247, 0.72)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div className="px-6 pt-7 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#1d1d1f] flex items-center justify-center font-bold text-sm text-white tracking-tight">
            A
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">Aviate</h1>
            <p className="text-[11px] text-[#86868b] font-medium tracking-wide">Dispatch System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
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

      <div className="px-5 py-5 border-t border-black/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#86868b] to-[#aeaeb2] flex items-center justify-center text-[11px] font-bold text-white">
            AD
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#1d1d1f]">Admin</p>
            <p className="text-[11px] text-[#aeaeb2]">admin@aviate.co.za</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
