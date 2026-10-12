"use client";

import { useState, useEffect } from "react";
import { Menu, X, Flame, Sparkles } from "lucide-react";
import SideBar from "@/Components/SideBar";
import UserMenu from "@/Components/UserMenu";
import Notifications from "./components/Notifications";
import Footer from "@/Components/Footer";
import * as studentsApi from "@/lib/api/students";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isParentView = false;

  // Layouts persist across route changes within the same route group in
  // the App Router, so this only fires once per dashboard session — not
  // on every page navigation — making a single extra overview call here
  // an acceptable cost for having live XP/streak in every page header
  // rather than only on the dashboard home page.
  const [streak, setStreak] = useState<number | null>(null);
  const [xp, setXp] = useState<number | null>(null);

  useEffect(() => {
    studentsApi
      .getMyOverview()
      .then((data) => {
        setStreak(data.stats.currentStreak);
        setXp(data.stats.totalXp);
      })
      .catch(() => {
        // Header stat display is non-critical — leave it blank rather
        // than blocking or erroring the whole dashboard shell.
      });
  }, []);

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
      <SideBar sidebarOpen={sidebarOpen} closeSidebar={closeSidebar} isParentView={isParentView} />

      {/* Main Content */}
      <main className="lg:ml-72 flex-1 flex flex-col">
        {/* Header */}
        <header
          className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b px-6 py-4"
          style={{ borderColor: "rgba(30,80,50,0.1)" }}>
          <div className="flex items-center justify-end gap-4">
            {/* XP Display */}
            {streak !== null && xp !== null && (
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-cream">
                <Flame size={14} className="text-orange-500" />
                <span className="text-[12px] font-semibold text-green-900">
                  {streak} day streak
                </span>
                <div className="w-px h-4 bg-text-muted/20" />
                <Sparkles size={14} className="text-gold" />
                <span className="text-[12px] font-semibold text-green-900">
                  {xp.toLocaleString()} XP
                </span>
              </div>
            )}

            {/* Notifications */}
            <Notifications
              notificationsOpen={notificationsOpen}
              setNotificationsOpen={setNotificationsOpen}
            />

            {/* User Menu */}
            <UserMenu userMenuOpen={userMenuOpen} setUserMenuOpen={setUserMenuOpen} />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 px-2 md:px-8 pt-6 pb-6">{children}</div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
