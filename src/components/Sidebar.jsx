import { NavLink } from "react-router-dom";
import { LayoutDashboard, Radio, Package, Truck, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/dispatch", icon: Radio, label: "Dispatch" },
  { to: "/jobs", icon: Package, label: "Jobs" },
  { to: "/drivers", icon: Truck, label: "Drivers" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white/80 backdrop-blur-lg border border-black/[0.06] flex items-center justify-center lg:hidden shadow-sm"
      >
        <Menu size={18} className="text-[#1d1d1f]" strokeWidth={1.8} />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`w-[240px] fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r border-black/[0.04] transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "rgba(245, 245, 247, 0.72)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
      >
        <div className="px-5 pt-7 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Aviate" className="w-9 h-9 rounded-[10px]" />
            <div>
              <h1 className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">Aviate</h1>
              <p className="text-[11px] text-[#86868b] font-medium">Route Optimization</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/[0.06] transition-colors lg:hidden"
          >
            <X size={16} className="text-[#86868b]" />
          </button>
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
                    ? "bg-[#008080] text-white shadow-sm"
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
    </>
  );
}
