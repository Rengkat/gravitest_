"use client";

import Link from "next/link";
import { Eye, UserMinus, UserCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import type { AdminUser } from "../types";
import { ROLE_CONFIG, STATUS_CONFIG } from "../constants";
import { Avatar, Badge } from "./Primitives";
import { RoleProfilePanel } from "./RoleProfilePanel";

interface Props {
  user: AdminUser;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDeactivate: (id: string) => Promise<void>;
  onReactivate: (id: string) => Promise<void>;
  canMutate: boolean;
}

export function UserTableRow({
  user,
  isSelected,
  onToggleSelect,
  onDeactivate,
  onReactivate,
  canMutate,
}: Props) {
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
      className={`p-4 rounded-2xl bg-white border flex items-start gap-4 hover:bg-cream/20 transition-colors ${
        isSelected ? "ring-2 ring-green-800/20" : ""
      }`}
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      {canMutate && (
        <input
          title="toggle"
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(user.id)}
          className="w-4 h-4 rounded border-gray-300 text-green-800 mt-1 shrink-0"
        />
      )}

      <Avatar user={user} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[14px] font-semibold text-green-900 truncate">{user.fullName}</span>
          <Badge label={roleCfg.label} color={roleCfg.color} bg={roleCfg.bg} icon={RoleIcon} size="xs" />
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ background: statusCfg.bg, color: statusCfg.color }}>
            {statusCfg.label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[12px] text-text-muted mb-2 flex-wrap">
          <span>{user.email}</span>
          {user.phoneNumber && (
            <>
              <span>·</span>
              <span>{user.phoneNumber}</span>
            </>
          )}
          <span>·</span>
          <span>Joined {new Date(user.createdAt).toLocaleDateString("en-NG")}</span>
          {user.lastLoginAt && (
            <>
              <span>·</span>
              <span>Last login {new Date(user.lastLoginAt).toLocaleDateString("en-NG")}</span>
            </>
          )}
        </div>

        <RoleProfilePanel user={user} compact />
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/admin/users/${user.id}`}
          className="p-2 rounded-lg hover:bg-green-50 transition-colors">
          <Eye size={16} className="text-text-muted hover:text-green-600" />
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
              <Loader2 size={16} className="animate-spin text-text-muted" />
            ) : user.isActive ? (
              <UserMinus size={16} className="text-text-muted hover:text-red-500" />
            ) : (
              <UserCheck size={16} className="text-text-muted hover:text-green-600" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
