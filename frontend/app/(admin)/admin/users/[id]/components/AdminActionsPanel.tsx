"use client";

import { UserMinus, UserCheck, Edit3, KeyRound, BadgeCheck } from "lucide-react";
import type { AdminUser } from "../../types";
import type { AdminActionType } from "../types";
import { Card } from "../../components/Primitives";

// Trimmed to 5 actions, each backed by a real endpoint:
//   deactivate/reactivate → PATCH /users/:id/deactivate|reactivate
//   edit                  → PATCH /users/:id
//   reset_password        → POST /users/:id/reset-password
//   verify_email          → PATCH /users/:id { isEmailVerified: true }
// Dropped: "suspend" (backend has no state separate from deactivated),
// "delete" (no hard-delete endpoint for other users' accounts — only
// self-deactivation), "change subscription tier" (the DTO field for this
// was a silent no-op — see admin-dashboard.ts comments).
export function AdminActionsPanel({
  user,
  onAction,
}: {
  user: AdminUser;
  onAction: (action: AdminActionType) => void;
}) {
  return (
    <Card className="p-5">
      <h3 className="font-serif text-lg text-green-900 mb-4">Admin Actions</h3>
      <div className="space-y-2">
        <ActionButton
          icon={Edit3}
          label="Edit Profile"
          description="Update name, email, phone, role"
          onClick={() => onAction("edit")}
        />
        <ActionButton
          icon={KeyRound}
          label="Reset Password"
          description="Generate a new temporary password"
          onClick={() => onAction("reset_password")}
        />
        {!user.isEmailVerified && (
          <ActionButton
            icon={BadgeCheck}
            label="Force-Verify Email"
            description="Bypass the OTP verification step"
            onClick={() => onAction("verify_email")}
          />
        )}
        {user.isActive ? (
          <ActionButton
            icon={UserMinus}
            label="Deactivate Account"
            description="Sign them out and block login"
            onClick={() => onAction("deactivate")}
            danger
          />
        ) : (
          <ActionButton
            icon={UserCheck}
            label="Reactivate Account"
            description="Restore login access"
            onClick={() => onAction("reactivate")}
          />
        )}
      </div>
    </Card>
  );
}

function ActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  danger = false,
}: {
  icon: any;
  label: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
        danger
          ? "border-red-100 hover:bg-red-50 hover:border-red-200"
          : "border-gray-100 hover:bg-cream hover:border-green-800/20"
      }`}>
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          danger ? "bg-red-100" : "bg-green-100"
        }`}>
        <Icon size={16} className={danger ? "text-red-600" : "text-green-700"} />
      </div>
      <div>
        <p className={`text-[13px] font-semibold ${danger ? "text-red-700" : "text-green-900"}`}>
          {label}
        </p>
        <p className="text-[11px] text-text-muted">{description}</p>
      </div>
    </button>
  );
}
