import type { BroadcastStatus } from "./types";

// ─── AUDIENCE OPTIONS ───────────────────────────────────────────
export const AUDIENCE_OPTIONS: {
  value: "all" | "segment" | "specific";
  label: string;
  hint: string;
}[] = [
  { value: "all", label: "All users", hint: "Every registered student" },
  { value: "segment", label: "Segment", hint: "Filter by subscription tier or exam type" },
  { value: "specific", label: "Specific users", hint: "Search and pick individual users" },
];

export const TIER_OPTIONS: { value: "free" | "pro"; label: string }[] = [
  { value: "free", label: "Free tier" },
  { value: "pro", label: "Pro tier" },
];

export const CHANNEL_OPTIONS: {
  value: "in_app" | "email" | "both";
  label: string;
  hint: string;
}[] = [
  { value: "in_app", label: "In-app only", hint: "Shows in the notification bell" },
  { value: "email", label: "Email only", hint: "Sent to registered email addresses" },
  { value: "both", label: "In-app + Email", hint: "Delivered on both channels" },
];

// ─── STATUS CONFIG (for the sent-history list) ─────────────────
export const BROADCAST_STATUS_CONFIG: Record<
  BroadcastStatus,
  { label: string; color: string; bg: string }
> = {
  draft: { label: "Draft", color: "#6b7280", bg: "#f3f4f6" },
  queued: { label: "Queued", color: "#3b82f6", bg: "#dbeafe" },
  sending: { label: "Sending", color: "#f59e0b", bg: "#fed7aa" },
  sent: { label: "Sent", color: "#10b981", bg: "#d1fae5" },
  failed: { label: "Failed", color: "#ef4444", bg: "#fee2e2" },
};
