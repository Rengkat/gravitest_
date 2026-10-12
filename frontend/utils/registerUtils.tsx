import { ExamTarget, RoleCard, RoleConfig, RoleId } from "@/types/registerType";
import {
  GraduationCap,
  Users,
  BookOpen,
  PenSquare,
  Briefcase,
  Target,
  ClipboardList,
  FileText,
  Stethoscope,
} from "lucide-react";

import { z } from "zod";

// Must match the backend's PASSWORD_REGEX in auth/dto/auth.dto.ts exactly —
// otherwise a password that looks valid client-side gets rejected by the
// API with a 400 the user can't make sense of.
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export function buildSchema(cfg: RoleConfig) {
  return z
    .object({
      firstName: z.string().min(2, "Too short"),
      lastName: z.string().min(2, "Too short"),
      email: z.string().email("Enter a valid email address"),
      // Nigerian local format only (e.g. 0801 234 5678) — normalized to
      // +234XXXXXXXXXX before it's sent to the API. Optional, but if
      // provided must be a full 11-digit local number.
      phone: z
        .string()
        .optional()
        .refine((v) => !v || /^0\d{10}$/.test(v.replace(/[\s\-()]/g, "")), {
          message: "Enter a valid Nigerian number, e.g. 0801 234 5678",
        }),
      subject: cfg.showSubject
        ? z.string().min(1, "Please select a subject")
        : z.string().optional(),
      examTarget: cfg.showExamTarget
        ? z.string().min(1, "Please select an exam target")
        : z.string().optional(),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(
          PASSWORD_REGEX,
          "Password must contain uppercase, lowercase, a number, and a special character",
        ),
      confirm: z.string(),
      agreeTerms: z.literal(true, {
        message: "Please agree to the Terms of Service",
      }),
      agreeMarketing: z.boolean().optional(),
    })
    .refine((d) => d.password === d.confirm, {
      message: "Passwords do not match",
      path: ["confirm"],
    });
}

// "0801 234 5678" → "+2348012345678" — the format BaseUserDto.phoneNumber
// requires on the backend (+234 followed by 10 digits).
/**
 * Normalizes a Nigerian phone number to E.164 (+234XXXXXXXXXX).
 * Handles the formats a user is actually likely to type:
 *   "08012345678"      (local, leading 0)
 *   "8012345678"       (local, no leading 0)
 *   "+2348012345678"   (already E.164)
 *   "2348012345678"    (E.164 without the +)
 *   with spaces/dashes/parentheses in any of the above
 * Returns null if the result isn't a valid 10-digit Nigerian subscriber
 * number, so the caller can surface a validation error instead of
 * silently sending a malformed number to the backend.
 */
export function toNigerianE164(local: string): string | null {
  const digits = local.replace(/\D/g, "");
  if (!digits) return null;

  let subscriber: string;
  if (digits.startsWith("234") && digits.length === 13) {
    subscriber = digits.slice(3);
  } else if (digits.startsWith("0") && digits.length === 11) {
    subscriber = digits.slice(1);
  } else if (digits.length === 10) {
    subscriber = digits;
  } else {
    return null;
  }

  return /^[0-9]{10}$/.test(subscriber) ? `+234${subscriber}` : null;
}

export const ROLES: RoleCard[] = [
  {
    id: "student",
    Icon: GraduationCap,
    title: "Student",
    desc: "JAMB, WAEC, Post-UTME prep & AI tutoring",
    badge: { label: "Most Popular", cls: "bg-green-500/10 text-green-600" },
    iconBg: "bg-green-500/10",
    iconCls: "text-green-600",
  },

  {
    id: "professional",
    Icon: Briefcase,
    title: "Professional",
    desc: "ICAN, Nursing Council, professional certification prep",
    iconBg: "bg-gold/15",
    iconCls: "text-gold-dark",
  },
];

export const EXAM_TARGETS: ExamTarget[] = [
  { value: "jamb", label: "JAMB", Icon: Target },
  { value: "waec", label: "WAEC", Icon: ClipboardList },
  { value: "post-utme", label: "Post-UTME", Icon: GraduationCap },
  { value: "neco", label: "NECO", Icon: FileText },
  { value: "ican", label: "ICAN", Icon: Briefcase },
  { value: "nursing", label: "Nursing", Icon: Stethoscope },
];

export const STATES = [
  "Lagos",
  "Abuja (FCT)",
  "Rivers",
  "Kano",
  "Oyo",
  "Kaduna",
  "Anambra",
  "Delta",
  "Enugu",
  "Ogun",
  "Imo",
  "Kwara",
  "Osun",
  "Ekiti",
  "Ondo",
  "Cross River",
  "Akwa Ibom",
  "Edo",
  "Benue",
  "Plateau",
  "Niger",
  "Kogi",
  "Nassarawa",
  "Taraba",
  "Adamawa",
  "Gombe",
  "Bauchi",
  "Borno",
  "Yobe",
  "Jigawa",
  "Katsina",
  "Kebbi",
  "Sokoto",
  "Zamfara",
  "Bayelsa",
  "Abia",
  "Ebonyi",
];

/* ─── Password strength ──────────────────────────────────────── */
export function getStrength(val: string): { score: number; label: string } {
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const labels = [
    "",
    "Weak — add uppercase & numbers",
    "Fair — add a special character",
    "Good — almost there!",
    "Strong ✓",
  ];
  return { score, label: val.length ? labels[score] : "" };
}

/* ─── Shared sub-components ──────────────────────────────────── */
export function FieldLabel({ text, hint }: { text: string; hint?: string }) {
  return (
    <label className="block text-xs font-semibold text-green-900/70 mb-1.5 tracking-wide uppercase">
      {text}
      {hint && (
        <span className="text-green-700/40 normal-case font-normal tracking-normal ml-1">
          {hint}
        </span>
      )}
    </label>
  );
}

export function FieldError({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1.5 ml-1">{msg}</p>;
}

// Only "student" and "professional" are actually selectable in Step1
// (parent/teacher are commented out of ROLES above, pending backend
// support for those account types) — this maps the two live ones to the
// backend's UserRole enum values.
export function toBackendRole(role: RoleId): "student" | "professional_student" {
  return role === "professional" ? "professional_student" : "student";
}

export const ROLE_CONFIG: Record<RoleId, RoleConfig> = {
  student: {
    Icon: GraduationCap,
    label: "Student Account",
    heading: "Create your student account",
    sub: "Start preparing for JAMB, WAEC, and more.",
    showExamTarget: false,
    showSubject: false,
  },
  professional: {
    Icon: Briefcase,
    label: "Professional Account",
    heading: "Create your professional account",
    sub: "Prepare for ICAN, Nursing Council, and other certifications.",
    showExamTarget: true,
    showSubject: false,
  },
};
