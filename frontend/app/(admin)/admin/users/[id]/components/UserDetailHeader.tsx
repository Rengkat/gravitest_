"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, BadgeCheck } from "lucide-react";
import type { AdminUser } from "../../types";
import { ROLE_CONFIG, STATUS_CONFIG } from "../../constants";
import { Avatar, Badge } from "../../components/Primitives";

export function UserDetailHeader({ user }: { user: AdminUser }) {
  const roleCfg = ROLE_CONFIG[user.role];
  const statusCfg = user.isActive ? STATUS_CONFIG.active : STATUS_CONFIG.inactive;
  const RoleIcon = roleCfg.icon;

  return (
    <div className="mb-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-green-800 transition-colors mb-4">
        <ArrowLeft size={14} /> Back to Users
      </Link>

      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar user={user} size="lg" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-serif text-2xl text-green-900">{user.fullName}</h1>
              {user.isEmailVerified && <BadgeCheck size={18} className="text-green-600" />}
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <Badge label={roleCfg.label} color={roleCfg.color} bg={roleCfg.bg} icon={RoleIcon} size="sm" />
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: statusCfg.bg, color: statusCfg.color }}>
                {statusCfg.label}
              </span>
            </div>

            <div className="flex items-center gap-4 flex-wrap text-[13px] text-text-muted">
              <span className="flex items-center gap-1.5">
                <Mail size={13} /> {user.email}
              </span>
              {user.phoneNumber && (
                <span className="flex items-center gap-1.5">
                  <Phone size={13} /> {user.phoneNumber}
                </span>
              )}
              {user.stateOfResidence && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} /> {user.stateOfResidence}
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[11px] text-text-muted uppercase tracking-wide mb-0.5">Joined</p>
            <p className="text-[13px] font-semibold text-green-900">
              {new Date(user.createdAt).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {user.lastLoginAt && (
              <>
                <p className="text-[11px] text-text-muted uppercase tracking-wide mt-2 mb-0.5">
                  Last Login
                </p>
                <p className="text-[13px] font-semibold text-green-900">
                  {new Date(user.lastLoginAt).toLocaleDateString("en-NG")}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
