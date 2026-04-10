import { Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function DriverLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="bg-white/80 backdrop-blur-xl border-b border-black/[0.04] sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Aviate" className="w-7 h-7" />
            <span className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight">Aviate</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#008080] flex items-center justify-center">
              <span className="text-[11px] font-bold text-white">
                {(user?.name || "D").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
              </span>
            </div>
            <button
              onClick={logout}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#ff3b30]/10 transition-colors"
            >
              <LogOut size={15} className="text-[#86868b]" />
            </button>
          </div>
        </div>
      </header>
      <main className="px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
