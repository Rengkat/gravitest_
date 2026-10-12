// app/admin/settings/components/AdminSettingsSidebar.tsx
"use client";

import Link from "next/link";
import { ChevronRight, LayoutDashboard, Users } from "lucide-react";
import { SettingsSection } from "@/types/settings";
import { ADMIN_SETTINGS_NAV } from "../constant";

interface AdminSettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (s: SettingsSection) => void;
  hasUnsavedChanges: boolean;
}

export default function AdminSettingsSidebar({
  activeSection,
  onSectionChange,
  hasUnsavedChanges,
}: AdminSettingsSidebarProps) {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-800 to-green-700 px-5 py-4">
          <p className="text-[11px] font-bold text-green-300 uppercase tracking-wider mb-1">
            Super Admin
          </p>
          <h2 className="text-[16px] font-black text-white">System Settings</h2>
          <p className="text-[11px] text-green-200 mt-1">Platform configuration</p>
          {hasUnsavedChanges && (
            <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-bold text-amber-300">Unsaved changes</span>
            </div>
          )}
        </div>

        {/* Nav items */}
        <div className="p-3">
          <div className="space-y-0.5">
            {ADMIN_SETTINGS_NAV.map((item) => {
              const active = activeSection === item.id;
              const isDanger = item.id === "danger";
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id as SettingsSection)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
                    active
                      ? "bg-green-50 text-green-800"
                      : isDanger
                        ? "text-red-500 hover:bg-red-50"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      active
                        ? "bg-green-100"
                        : isDanger
                          ? "bg-red-50 group-hover:bg-red-100"
                          : "bg-gray-100 group-hover:bg-gray-200"
                    }`}>
                    <item.icon
                      size={14}
                      className={
                        active ? "text-green-700" : isDanger ? "text-red-400" : "text-gray-500"
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[13px] font-semibold leading-tight ${active ? "text-green-800" : ""}`}>
                      {item.label}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  {active && <ChevronRight size={13} className="shrink-0 text-green-500" />}
                </button>
              );
            })}
          </div>

          {/* Quick links */}
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1">
            <Link href="/admin">
              <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center shrink-0">
                  <LayoutDashboard size={14} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold">Platform Overview</p>
                  <p className="text-[11px] text-gray-400">Back to dashboard</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/users">
              <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center shrink-0">
                  <Users size={14} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold">User Management</p>
                  <p className="text-[11px] text-gray-400">Manage users & roles</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
