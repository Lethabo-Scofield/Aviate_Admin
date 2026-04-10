import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-[#f5f5f7]">
      <Sidebar />
      <main className="flex-1 lg:ml-[260px] px-4 sm:px-6 lg:px-10 py-6 pt-16 lg:pt-8 overflow-auto">
        <div className="max-w-[1100px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
