"use client";

import { Mail, Phone, MapPin, Globe } from "lucide-react";
import type { AdminUser } from "../types";

/**
 * Real, list-safe info about a user — auth method, verification status,
 * location. This used to show per-row XP/streak/sessions/exam targets,
 * but that data lives on a separate student-profile record and fetching
 * it for every row in a list would mean an extra query per user (N+1).
 * Rich learner stats are shown on the user detail page instead, where
 * one fetch for one user is cheap.
 */
export function RoleProfilePanel({ user, compact = false }: { user: AdminUser; compact?: boolean }) {
  const items: { icon: any; label: string; ok?: boolean }[] = [
    { icon: Mail, label: user.isEmailVerified ? "Email verified" : "Email unverified", ok: user.isEmailVerified },
  ];
  if (user.phoneNumber) {
    items.push({
      icon: Phone,
      label: user.isPhoneVerified ? "Phone verified" : "Phone unverified",
      ok: user.isPhoneVerified,
    });
  }
  if (user.stateOfResidence) {
    items.push({ icon: MapPin, label: user.stateOfResidence });
  }
  if (user.authProvider !== "local") {
    items.push({ icon: Globe, label: `Signed up via ${user.authProvider}` });
  }

  return (
    <div className={`flex flex-wrap items-center ${compact ? "gap-3" : "gap-4"}`}>
      {items.map(({ icon: Icon, label, ok }) => (
        <div key={label} className="flex items-center gap-1.5 text-[11px]">
          <Icon size={12} className={ok === false ? "text-amber-500" : "text-text-muted"} />
          <span className={ok === false ? "text-amber-600 font-medium" : "text-text-muted"}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
