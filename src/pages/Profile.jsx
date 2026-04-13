import { useState } from "react";
import { User, Mail, Building2, Shield, Calendar, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (user?.name || "?")
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="animate-fade-in max-w-lg">
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight">Profile</h1>
        <p className="text-[14px] text-[#86868b] mt-1">Your account details</p>
      </div>

      <div className="apple-card p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#f0f0f0] flex items-center justify-center shrink-0">
            <span className="text-[20px] font-semibold text-[#6e6e73]">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[18px] font-semibold text-[#1d1d1f] truncate">{user?.name || "—"}</p>
            <p className="text-[13px] text-[#86868b] truncate">{user?.email || "—"}</p>
          </div>
        </div>

        <div className="space-y-0">
          <ProfileRow icon={User} label="Name" value={user?.name} />
          <ProfileRow icon={Mail} label="Email" value={user?.email} />
          <ProfileRow icon={Building2} label="Company" value={user?.company_name} />
          <ProfileRow icon={Shield} label="Role" value={user?.role === "admin" ? "Admin" : "Driver"} last />
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="apple-btn apple-btn-secondary w-full text-[#86868b]"
      >
        <LogOut size={15} />
        Sign out
      </button>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value, last }) {
  return (
    <div className={`flex items-center gap-3 py-3.5 ${!last ? "border-b border-[#f0f0f0]" : ""}`}>
      <Icon size={16} className="text-[#c7c7cc] shrink-0" strokeWidth={1.8} />
      <span className="text-[13px] text-[#86868b] w-20 shrink-0">{label}</span>
      <span className="text-[13px] text-[#1d1d1f] font-medium truncate">{value || "—"}</span>
    </div>
  );
}
