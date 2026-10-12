import { GraduationCap, Briefcase, ShieldCheck, Shield, UserCheck, UserX } from "lucide-react";
import type { UserRole } from "./types";

// ─── ROLE CONFIG ─────────────────────────────────────────────
// Matches the real backend UserRole enum (student, professional_student,
// admin, super_admin) — the old version only had 3 of these 4 and used
// "professional" instead of the real "professional_student" value.
export const ROLE_CONFIG: Record<
  UserRole,
  { label: string; icon: any; color: string; bg: string; description: string }
> = {
  student: {
    label: "Student",
    icon: GraduationCap,
    color: "#0284c7",
    bg: "#0284c715",
    description: "Practicing past questions for JAMB, WAEC, NECO & more",
  },
  professional_student: {
    label: "Professional",
    icon: Briefcase,
    color: "#8b5cf6",
    bg: "#8b5cf615",
    description: "Practicing past questions for certification exams (ICAN, ACCA, etc.)",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "#f97316",
    bg: "#f9731615",
    description: "Platform administration access",
  },
  super_admin: {
    label: "Super Admin",
    icon: ShieldCheck,
    color: "#ef4444",
    bg: "#ef444415",
    description: "Full platform access — can create, edit, and deactivate any account",
  },
};

// ─── ACTIVE / INACTIVE ──────────────────────────────────────
// The backend only tracks a boolean isActive plus a deactivation reason
// (see DeactivationType) — there's no separate "suspended" / "pending"
// state machine, so this is a simple two-state config, not the old
// five-state one that had no backend data behind most of the states.
export const STATUS_CONFIG = {
  active: { label: "Active", icon: UserCheck, color: "#10b981", bg: "#10b98115" },
  inactive: { label: "Inactive", icon: UserX, color: "#9ca3af", bg: "#9ca3af15" },
};
