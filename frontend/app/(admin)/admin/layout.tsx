"use client";

import { useState } from "react";
import { Menu, X, Shield } from "lucide-react";
import Footer from "../components/Footer";
import AdminSideBar from "../components/AdminSideBar";
import UserMenu from "@/Components/UserMenu";
import AdminNotifications from "../components/Notifications";
import { useAuthStore } from "@/lib/store/authStore";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
        style={{ border: "1px solid rgba(30,80,50,0.1)" }}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <AdminSideBar sidebarOpen={sidebarOpen} closeSidebar={closeSidebar} />

      {/* Main Content */}
      <main className="lg:ml-72 flex-1 flex flex-col">
        {/* Header */}
        <header
          className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b px-6 py-4"
          style={{ borderColor: "rgba(30,80,50,0.1)" }}>
          <div className="flex items-center justify-end gap-4">
            {/* Admin Badge — role only. The "System Active" pill that
                used to sit here was decorative: there's no backend
                health/status endpoint behind it. Real system-health data
                belongs on the admin overview dashboard (a separate item),
                not fabricated here. */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-green-800/5">
              <Shield size={14} className="text-green-800" />
              <span className="text-[12px] font-semibold text-green-900">
                {user?.role === "super_admin" ? "Super Admin" : "Admin"}
              </span>
            </div>

            {/* Notifications */}
            <AdminNotifications
              notificationsOpen={notificationsOpen}
              setNotificationsOpen={setNotificationsOpen}
            />

            {/* User Menu */}
            <UserMenu userMenuOpen={userMenuOpen} setUserMenuOpen={setUserMenuOpen} />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 px-4 md:px-8 pt-6 pb-12">{children}</div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
