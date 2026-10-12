"use client";

import Link from "next/link";
import { Eye, UserMinus, UserCheck, BadgeCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import type { AdminUser } from "../types";
import { ROLE_CONFIG, STATUS_CONFIG } from "../constants";
import { Avatar, Badge } from "./Primitives";
import { RoleProfilePanel } from "./RoleProfilePanel";

interface Props {
  user: AdminUser;
  onDeactivate: (id: string) => Promise<void>;
  onReactivate: (id: string) => Promise<void>;
  canMutate: boolean;
}

export function UserGridCard({ user, onDeactivate, onReactivate, canMutate }: Props) {
  const [busy, setBusy] = useState(false);
  const roleCfg = ROLE_CONFIG[user.role];
  const statusCfg = user.isActive ? STATUS_CONFIG.active : STATUS_CONFIG.inactive;
  const RoleIcon = roleCfg.icon;

  async function handleToggleActive() {
    setBusy(true);
    try {
      if (user.isActive) await onDeactivate(user.id);
      else await onReactivate(user.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="rounded-2xl bg-white border overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="h-2" style={{ background: roleCfg.color }} />

      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <Avatar user={user} size="lg" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="text-[14px] font-semibold text-green-900 truncate">
                {user.fullName}
              </span>
              {user.isEmailVerified && <BadgeCheck size={14} className="text-green-600 shrink-0" />}
            </div>

            <div className="flex flex-wrap gap-1 mb-1">
              <Badge label={roleCfg.label} color={roleCfg.color} bg={roleCfg.bg} icon={RoleIcon} size="xs" />
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                style={{ background: statusCfg.bg, color: statusCfg.color }}>
                {statusCfg.label}
              </span>
            </div>

            <div className="text-[11px] text-text-muted truncate">{user.email}</div>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-cream/40">
          <RoleProfilePanel user={user} />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
          <div className="p-2 rounded-lg bg-gray-50 text-center">
            <div className="font-bold text-green-900">
              {new Date(user.createdAt).toLocaleDateString("en-NG")}
            </div>
            <div className="text-text-muted">Joined</div>
          </div>
          <div className="p-2 rounded-lg bg-gray-50 text-center">
            <div className="font-bold text-green-900">
              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-NG") : "Never"}
            </div>
            <div className="text-text-muted">Last Login</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/users/${user.id}`}
            className="flex-1 py-2 rounded-lg bg-green-800 text-white text-[12px] font-semibold text-center hover:bg-green-700 transition-all flex items-center justify-center gap-1">
            <Eye size={12} /> View Profile
          </Link>
          {canMutate && (
            <button
              title={user.isActive ? "deactivate" : "reactivate"}
              onClick={handleToggleActive}
              disabled={busy}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                user.isActive ? "hover:bg-red-50" : "hover:bg-green-50"
              }`}>
              {busy ? (
                <Loader2 size={14} className="animate-spin text-text-muted" />
              ) : user.isActive ? (
                <UserMinus size={14} className="text-text-muted hover:text-red-500" />
              ) : (
                <UserCheck size={14} className="text-text-muted hover:text-green-600" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
