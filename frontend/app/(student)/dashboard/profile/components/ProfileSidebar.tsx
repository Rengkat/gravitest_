"use client";

import Link from "next/link";
import { LogOut, Settings, ChevronRight } from "lucide-react";
import { ProfileSection, UserProfile } from "@/types/profile";
import {
  getSectionNavForRole,
  getInitials,
  getRoleBadgeConfig,
  getMemberDuration,
} from "@/lib/constants/profile";

interface ProfileSidebarProps {
  user: UserProfile;
  activeSection: ProfileSection;
  onSectionChange: (s: ProfileSection) => void;
  onLogout: () => void;
}

export default function ProfileSidebar({
  user,
  activeSection,
  onSectionChange,
  onLogout,
}: ProfileSidebarProps) {
  const role = getRoleBadgeConfig(user.role);

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
        {/* Mini profile card */}
        <div className="bg-gradient-to-br from-green-700 to-emerald-700 px-5 py-5">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(user)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${role.bg} ${role.text} border ${role.border}`}>
                  {role.label}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-green-200 mt-3">
            Member for {getMemberDuration(user.createdAt)}
          </p>
        </div>

        {/* Navigation */}
        <div className="p-3">
          <div className="space-y-0.5">
            {getSectionNavForRole(user.role).map((section) => {
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${
                    active
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      active ? "bg-green-100" : "bg-gray-100 group-hover:bg-gray-200"
                    }`}>
                    <section.icon
                      size={15}
                      className={active ? "text-green-700" : "text-gray-500"}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold ${active ? "text-green-800" : ""}`}>
                      {section.label}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{section.description}</p>
                  </div>
                  {active && <ChevronRight size={14} className="text-green-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-100 mt-3 pt-3 space-y-0.5">
            {/* Settings link — goes to dedicated settings page */}
            <Link href="/dashboard/settings">
              <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center shrink-0 transition-colors">
                  <Settings size={15} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold">Settings</p>
                  <p className="text-[11px] text-gray-400">App preferences</p>
                </div>
                <div className="ml-auto">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    Soon
                  </span>
                </div>
              </div>
            </Link>

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center shrink-0 transition-colors">
                <LogOut size={15} className="text-red-500" />
              </div>
              <p className="text-[13px] font-semibold">Sign Out</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
