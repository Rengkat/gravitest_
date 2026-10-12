"use client";

import { useRef, useState } from "react";
import {
  Camera,
  Edit2,
  CheckCircle,
  Mail,
  Phone,
  Zap,
  Trophy,
  Flame,
  Star,
  MapPin,
  Loader2,
} from "lucide-react";
import { UserProfile } from "@/types/profile";
import { getInitials, getRoleBadgeConfig, getXPToNextLevel } from "@/lib/constants/profile";
import * as profileApi from "@/lib/api/profile";

interface ProfileHeaderProps {
  user: UserProfile;
  isEditing: boolean;
  onToggleEdit: () => void;
  onAvatarChange?: (avatarUrl: string | null) => void;
}

export default function ProfileHeader({ user, isEditing, onToggleEdit, onAvatarChange }: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const role = getRoleBadgeConfig(user.role);
  const xpToNext = getXPToNextLevel(user.level);
  const xpProgress = Math.min(100, (user.totalXP / xpToNext) * 100);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setIsUploadingAvatar(true);
    try {
      const updated = await profileApi.uploadAvatar(file);
      onAvatarChange?.(updated.avatarUrl ?? null);
    } catch {
      setAvatarError("Couldn't upload photo — try a smaller JPEG/PNG under 5MB.");
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      {/* Cover */}
      <div className="relative h-32 bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700">
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="px-6 pb-6">
        {/* Avatar row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 mb-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white text-3xl font-black shadow-xl border-4 border-white">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.firstName}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                getInitials(user)
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-60"
              title="Change photo">
              {isUploadingAvatar ? (
                <Loader2 size={14} className="text-green-700 animate-spin" />
              ) : (
                <Camera size={14} className="text-green-700" />
              )}
            </button>
            <input
              title="image"
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarSelect}
            />
            {avatarError && (
              <p className="absolute -bottom-6 left-0 text-[10px] text-red-500 whitespace-nowrap">
                {avatarError}
              </p>
            )}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-black text-gray-900">
                {user.firstName} {user.middleName ? `${user.middleName} ` : ""}
                {user.lastName}
              </h2>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${role.bg} ${role.text} ${role.border}`}>
                {role.label}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-700 text-white">
                Lv. {user.level}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-500">
              {user.stateOfResidence && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {user.lga}, {user.stateOfResidence}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Mail size={11} />
                {user.email}
                {user.isEmailVerified && <CheckCircle size={11} className="text-green-600" />}
              </span>
              {user.phoneNumber && (
                <span className="flex items-center gap-1.5">
                  <Phone size={11} />
                  {user.phoneNumber}
                  {user.isPhoneVerified && <CheckCircle size={11} className="text-green-600" />}
                </span>
              )}
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={onToggleEdit}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
              isEditing
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-green-600 text-white hover:bg-green-700 shadow-sm"
            }`}>
            <Edit2 size={14} />
            {isEditing ? "Cancel Edit" : "Edit Profile"}
          </button>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-[13px] text-gray-600 leading-relaxed mb-5 max-w-2xl">{user.bio}</p>
        )}

        {/* XP bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-[12px] mb-1.5">
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              <Zap size={12} className="text-amber-500 fill-amber-500" />
              {user.totalXP.toLocaleString()} XP
            </span>
            <span className="text-gray-400">
              {getXPToNextLevel(user.level).toLocaleString()} XP to Level {user.level + 1}
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: Zap,
              label: "Level",
              value: user.level,
              color: "text-amber-500",
              bg: "bg-amber-50 border-amber-100",
            },
            {
              icon: Trophy,
              label: "Rank",
              value: `#${user.rank}`,
              color: "text-green-600",
              bg: "bg-green-50 border-green-100",
            },
            {
              icon: Flame,
              label: "Streak",
              value: `${user.streak} days`,
              color: "text-orange-500",
              bg: "bg-orange-50 border-orange-100",
            },
            {
              icon: Star,
              label: "Sessions",
              value: user.completedSessions,
              color: "text-blue-500",
              bg: "bg-blue-50 border-blue-100",
            },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div
              key={label}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bg}`}>
              <div
                className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0`}>
                <Icon size={15} className={color} />
              </div>
              <div>
                <p className="text-[14px] font-black text-gray-800">{value}</p>
                <p className="text-[10px] text-gray-500 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
