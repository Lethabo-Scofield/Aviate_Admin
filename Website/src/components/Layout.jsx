import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import { ArrowUpRight, Cable, Settings2, UserCircle } from "lucide-react";
import { setPendingAsk } from "../lib/askBus";
import { useAuth } from "../contexts/AuthContext";

function UserAvatar({ user, size = 34 }) {
  return (
    <img
      src="/default-avatar.png"
      alt={user?.name || "Profile"}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isHome = location.pathname === "/";
  const [topText, setTopText] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("aiviate_sidebar_collapsed") === "true"; }
    catch { return false; }
  });
  const topInputRef = useRef(null);
  const profileRef = useRef(null);

  /**
   * Single entry point for "ask Aiviate" from anywhere in the app.
   * Always takes the user Home, where the page transforms into a
   * chat surface and renders the answer inline. No modal pop-up.
   */
  const goAsk = (text) => {
    const t = (text || "").trim();
    if (location.pathname !== "/") {
      // Queue the ask in a module-scoped buffer; Operations will drain
      // it the moment it mounts. This is reliable regardless of how
      // long the route transition takes.
      setPendingAsk(t);
      navigate("/");
    } else {
      // Already on Home — Operations is mounted, just fire the event.
      window.dispatchEvent(
        new CustomEvent("home:ask", { detail: { text: t } })
      );
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        goAsk("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Legacy: components that still dispatch the old "ask-aiviate" event
  // are routed through the new chat surface.
  useEffect(() => {
    const onAsk = (e) => goAsk(e?.detail?.text || "");
    window.addEventListener("ask-aiviate", onAsk);
    return () => window.removeEventListener("ask-aiviate", onAsk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const submitTop = (e) => {
    e?.preventDefault?.();
    const q = topText.trim();
    setTopText("");
    goAsk(q);
  };

  const setSidebar = (collapsed) => {
    setSidebarCollapsed(collapsed);
    try { localStorage.setItem("aiviate_sidebar_collapsed", String(collapsed)); }
    catch {
      // Ignore private-mode storage failures.
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebar(true)}
        onExpand={() => setSidebar(false)}
      />
      <main className={`flex-1 overflow-auto transition-[margin] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
        sidebarCollapsed ? "lg:ml-0" : "lg:ml-[260px]"
      }`}>
        {user && (
          <div ref={profileRef} className="fixed right-4 top-4 z-[170]">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              className="flex h-10 items-center gap-2 rounded-full border border-black/[0.08] bg-white/90 py-1 pl-2 pr-3 shadow-sm backdrop-blur transition-colors hover:bg-[#F8F9FA]"
            >
              <UserAvatar user={user} size={32} />
              <span className="max-w-[140px] truncate text-[13px] font-medium text-[#111315]">
                {user.name}
              </span>
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
                  className="absolute right-0 mt-2 w-[250px] overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_18px_48px_rgba(17,19,21,0.14)]"
                >
                  <div className="border-b border-black/[0.06] px-3 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size={34} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#111315]">{user.name}</p>
                        <p className="truncate text-[11px] text-[#868E96]">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/integrations"); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-[#343A40] hover:bg-[#F1F3F5] hover:text-[#111315]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#F1F3F5] text-[#111315]">
                        <Cable size={15} strokeWidth={1.55} />
                      </span>
                      Integrations
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-[#343A40] hover:bg-[#F1F3F5] hover:text-[#111315]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#F1F3F5] text-[#111315]">
                        <Settings2 size={15} strokeWidth={1.55} />
                      </span>
                      Settings
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/profile"); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-[#343A40] hover:bg-[#F1F3F5] hover:text-[#111315]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#F1F3F5] text-[#111315]">
                        <UserCircle size={15} strokeWidth={1.55} />
                      </span>
                      Profile
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {/* Persistent "Ask Aiviate" bar — shown on every page EXCEPT Home,
            because Home has its own centered hero prompt. */}
        {!isHome && (
          <div className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-black/[0.06]">
            <div className="max-w-[960px] mx-auto px-5 sm:px-8 lg:px-12 py-3 pt-16 lg:pt-3">
              <form onSubmit={submitTop}>
                <motion.div
                  layoutId="ask-aiviate-prompt"
                  transition={{ type: "tween", duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-xl bg-[#F1F3F5] border border-black/[0.04] focus-within:border-[#111315]/40 focus-within:bg-white transition-colors"
                >
                  <img src="/logo.png" alt="" className="w-4 h-4 shrink-0" />
                  <input
                    ref={topInputRef}
                    value={topText}
                    onChange={(e) => setTopText(e.target.value)}
                    placeholder='Ask Aiviate anything, like "show me today\u2019s routes"'
                    aria-label="Ask Aiviate"
                    className="flex-1 bg-transparent outline-none text-[13px] text-[#111315] placeholder:text-[#868E96]"
                  />
                  {topText.trim() ? (
                    <motion.button
                      type="submit"
                      aria-label="Ask"
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "tween", duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
                      className="w-7 h-7 rounded-lg bg-[#111315] hover:bg-[#343A40] text-white flex items-center justify-center shrink-0"
                    >
                      <ArrowUpRight size={13} strokeWidth={1.6} />
                    </motion.button>
                  ) : (
                    <span className="text-[10px] font-mono text-[#ADB5BD] border border-black/[0.08] rounded px-1.5 py-0.5 shrink-0">⌘K</span>
                  )}
                </motion.div>
              </form>
            </div>
          </div>
        )}

        <div className={`px-5 sm:px-8 lg:px-12 ${isHome ? "pt-14 lg:pt-8" : "py-6"} pb-10`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.26, ease: [0.2, 0, 0, 1] }}
              className="max-w-[960px] mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile floating Ask button — takes you straight to the Home chat. */}
      <motion.button
        onClick={() => goAsk("")}
        title="Ask Aiviate"
        aria-label="Ask Aiviate"
        whileTap={{ scale: 0.88 }}
        transition={{ type: "tween", duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
        className="fixed bottom-5 right-5 z-[150] lg:hidden w-12 h-12 flex items-center justify-center rounded-full bg-[#111315] shadow-lg"
      >
        <img src="/logo.png" alt="Ask Aiviate" className="w-6 h-6 brightness-0 invert" />
      </motion.button>
    </div>
  );
}
