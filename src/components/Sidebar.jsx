import { NavLink } from "react-router-dom";
import { LayoutDashboard, Radio, Map, Package, Truck, GitBranch, BarChart3, Settings } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/dispatch", icon: Radio, label: "Dispatch Center" },
  { to: "/map", icon: Map, label: "Live Map" },
  { to: "/jobs", icon: Package, label: "Jobs" },
  { to: "/drivers", icon: Truck, label: "Drivers" },
  { to: "/routes", icon: GitBranch, label: "Routes" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#0a1628] text-white flex flex-col min-h-screen fixed left-0 top-0 z-30">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#008080] flex items-center justify-center font-bold text-lg">A</div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Aviate Dispatch</h1>
            <p className="text-[11px] text-white/50 uppercase tracking-widest">Logistics OS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#008080] text-white shadow-lg shadow-teal-500/20"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#008080]/30 flex items-center justify-center text-xs font-bold text-teal-300">AD</div>
          <div>
            <p className="text-sm font-medium">Admin</p>
            <p className="text-[11px] text-white/40">admin@aviate.co.za</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
