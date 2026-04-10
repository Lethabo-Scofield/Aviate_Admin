import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Radio,
  Package,
  Map,
  Truck,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Building2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navSections = [
  {
    label: "Overview",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/dispatch", icon: Radio, label: "Dispatch Center" },
      { to: "/jobs", icon: Package, label: "Jobs" },
      { to: "/map", icon: Map, label: "Live Map" },
    ],
  },
  {
    label: "Fleet",
    items: [
      { to: "/drivers", icon: Truck, label: "Drivers" },
    ],
  },
];

function UserInitials({ name }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#008080] to-[#006060] flex items-center justify-center flex-shrink-0 shadow-sm">
      <span className="text-[11px] font-semibold text-white leading-none">{initials}</span>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white/80 backdrop-blur-lg border border-black/[0.06] flex items-center justify-center lg:hidden shadow-sm active:scale-95 transition-transform"
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
        className={`w-[260px] fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r border-black/[0.06] transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(245,245,247,0.92) 100%)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        }}
      >
        <div className="px-5 pt-6 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Aviate" className="w-10 h-10" />
            <div>
              <h1 className="text-[16px] font-bold text-[#1d1d1f] tracking-tight leading-tight">Aviate</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 size={10} className="text-[#aeaeb2]" />
                <p className="text-[11px] text-[#86868b] font-medium truncate max-w-[140px]">
                  {user?.company_name || "Dispatch"}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/[0.06] transition-colors lg:hidden"
          >
            <X size={16} className="text-[#86868b]" />
          </button>
        </div>

        <div className="px-4 mb-2">
          <div className="h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent" />
        </div>

        <nav className="flex-1 px-3 overflow-y-auto">
          {navSections.map((section, si) => (
            <div key={si} className={si > 0 ? "mt-5" : "mt-1"}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#aeaeb2]">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3 py-[10px] rounded-xl text-[13px] font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-[#008080] text-white shadow-[0_1px_3px_rgba(0,128,128,0.3)]"
                          : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04]"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            isActive ? "bg-white/20" : "bg-black/[0.03] group-hover:bg-black/[0.06]"
                          }`}
                        >
                          <Icon size={15} strokeWidth={1.8} />
                        </div>
                        <span className="flex-1">{label}</span>
                        <ChevronRight
                          size={13}
                          className={`transition-all ${
                            isActive
                              ? "opacity-60"
                              : "opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0"
                          }`}
                        />
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {user && (
          <div className="px-3 pb-4 pt-2">
            <div className="h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent mb-3" />
            <div className="flex items-center gap-3 px-2">
              <UserInitials name={user.name} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#1d1d1f] truncate leading-tight">{user.name}</p>
                <p className="text-[11px] text-[#aeaeb2] truncate leading-tight mt-0.5">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors group"
                title="Sign out"
              >
                <LogOut size={14} className="text-[#aeaeb2] group-hover:text-red-500 transition-colors" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
