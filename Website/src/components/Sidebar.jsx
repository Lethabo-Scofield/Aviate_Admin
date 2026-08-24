import { NavLink, useLocation } from "react-router-dom";
import {
  Boxes, Menu, PanelLeftClose, PenLine, Route, UserCircle, X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { to: "/", icon: PenLine, label: "New Chat", end: true },
  { to: "/orders", icon: Boxes, label: "Orders" },
  { to: "/routes", icon: Route, label: "Dispatch" },
  { to: "/drivers", icon: UserCircle, label: "Drivers" },
];

function isPathActive(pathname, to, end) {
  if (end || to === "/") return pathname === to;
  return pathname === to || pathname.startsWith(to + "/");
}

function NavItem({ to, icon: Icon, label, end, active }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={`group relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] outline-none transition-colors duration-150 active:scale-[0.985] ${
        active ? "text-[#111315] font-medium" : "text-[#5C636A] hover:text-[#111315] hover:bg-black/[0.03]"
      }`}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-xl bg-[#F1F3F5]"
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
        />
      )}
      {active && (
        <motion.span
          layoutId="sidebar-active-bar"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-[#111315]"
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
        />
      )}
      <span className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-[9px] border transition-colors duration-150 ${
        active
          ? "border-black/[0.08] bg-white text-[#111315] shadow-[0_1px_1px_rgba(17,19,21,0.04)]"
          : "border-transparent bg-transparent text-[#868E96] group-hover:bg-white group-hover:text-[#111315]"
      }`}>
        <Icon size={16} strokeWidth={1.55} strokeLinecap="round" strokeLinejoin="round" />
      </span>
      <span className="relative z-10 flex-1">{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ collapsed = false, onCollapse = () => {}, onExpand = () => {} }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => { onExpand(); setOpen(true); }}
        aria-label="Open menu"
        className={`fixed left-4 top-4 z-50 h-10 w-10 items-center justify-center rounded-xl border border-black/[0.06] bg-white/90 shadow-sm backdrop-blur-lg transition-transform active:scale-95 ${
          collapsed ? "flex" : "flex lg:hidden"
        }`}
      >
        <Menu size={18} className="text-[#111315]" strokeWidth={1.6} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`w-[260px] fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-white border-r border-black/[0.06] transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
          collapsed ? "-translate-x-full" : "lg:translate-x-0"
        } ${open && !collapsed ? "translate-x-0" : "-translate-x-full"}
        }`}
      >
        <div className="px-5 pt-7 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-black/[0.06] bg-[#F8F9FA]">
              <img src="/logo.png" alt="Aiviate" className="h-5 w-5" />
            </span>
            <h1 className="text-[15px] font-semibold text-[#111315] tracking-tight">Aiviate</h1>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              if (window.innerWidth >= 1024) onCollapse();
            }}
            aria-label="Close sidebar"
            title="Close sidebar"
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/[0.04] transition-colors"
          >
            <PanelLeftClose size={16} strokeWidth={1.55} className="hidden text-[#868E96] lg:block" />
            <X size={16} strokeWidth={1.55} className="text-[#868E96] lg:hidden" />
          </button>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto space-y-1">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item}
                     active={isPathActive(location.pathname, item.to, item.end)} />
          ))}

          <div className="px-3 pt-6 pb-1 text-[10px] uppercase tracking-wider text-[#ADB5BD] font-semibold">
            Try
          </div>
          <div className="space-y-1 px-1">
            {[
              "Show orders",
              "Prepare operation",
              "What needs attention?",
            ].map((text) => (
              <button
                key={text}
                onClick={() => window.dispatchEvent(new CustomEvent("ask-aiviate", { detail: { text } }))}
                className="w-full rounded-lg px-2 py-2 text-left text-[12px] text-[#5C636A] hover:bg-black/[0.03] hover:text-[#111315]"
              >
                {text}
              </button>
            ))}
          </div>
        </nav>

      </aside>
    </>
  );
}
