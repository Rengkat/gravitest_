import {
  Video, Headphones, BookOpen, FileText,
  ClipboardList, BookMarked, Image, Lock, Crown, Zap,
} from "lucide-react";
import type { ContentType, Subject, SubscriptionTier } from "./types";

// ─── Content Type Config ──────────────────────────────────────────────────────

export const CONTENT_TYPE_CONFIG: Record<
  ContentType,
  { label: string; icon: any; color: string; bg: string; accent: string }
> = {
  video:          { label: "Video",         icon: Video,          color: "#ef4444", bg: "#ef444415", accent: "#ef4444" },
  audio:          { label: "Audio",         icon: Headphones,     color: "#8b5cf6", bg: "#8b5cf615", accent: "#8b5cf6" },
  ebook:          { label: "E-Book",        icon: BookOpen,       color: "#2e8b57", bg: "#2e8b5715", accent: "#2e8b57" },
  document:       { label: "Document",      icon: FileText,       color: "#3b82f6", bg: "#3b82f615", accent: "#3b82f6" },
  past_question:  { label: "Past Questions",icon: ClipboardList,  color: "#f59e0b", bg: "#f59e0b15", accent: "#f59e0b" },
  lesson_note:    { label: "Lesson Notes",  icon: BookMarked,     color: "#0891b2", bg: "#0891b215", accent: "#0891b2" },
  infographic:    { label: "Infographic",   icon: Image,          color: "#ec4899", bg: "#ec489915", accent: "#ec4899" },
};

// ─── Subject Config ───────────────────────────────────────────────────────────

export const SUBJECT_CONFIG: Record<Subject, { label: string; color: string }> = {
  mathematics:         { label: "Mathematics",          color: "#2563eb" },
  english:             { label: "English Language",      color: "#16a34a" },
  physics:             { label: "Physics",               color: "#9333ea" },
  chemistry:           { label: "Chemistry",             color: "#dc2626" },
  biology:             { label: "Biology",               color: "#15803d" },
  economics:           { label: "Economics",             color: "#ca8a04" },
  government:          { label: "Government",            color: "#0284c7" },
  literature:          { label: "Literature in English", color: "#c2410c" },
  geography:           { label: "Geography",             color: "#065f46" },
  history:             { label: "History",               color: "#92400e" },
  commerce:            { label: "Commerce",              color: "#1d4ed8" },
  accounting:          { label: "Accounting",            color: "#0f766e" },
  further_mathematics: { label: "Further Mathematics",   color: "#6d28d9" },
  agricultural_science:{ label: "Agricultural Science",  color: "#4d7c0f" },
  civic_education:     { label: "Civic Education",       color: "#0369a1" },
};

// ─── Exam labels ──────────────────────────────────────────────────────────────

export const EXAM_LABELS: Record<string, string> = {
  waec: "WAEC", neco: "NECO", jamb: "JAMB", nabteb: "NABTEB", common_entrance: "Common Entrance",
};

// ─── Class level labels ───────────────────────────────────────────────────────

export const CLASS_LABELS: Record<string, string> = {
  jss1: "JSS1", jss2: "JSS2", jss3: "JSS3", ss1: "SS1", ss2: "SS2", ss3: "SS3",
};

// ─── Subscription tier config ─────────────────────────────────────────────────

export const TIER_CONFIG: Record<
  SubscriptionTier,
  { label: string; icon: any; color: string; bg: string; rank: number }
> = {
  free:       { label: "Free",       icon: Zap,   color: "#6b7280", bg: "#6b728015", rank: 0 },
  basic:      { label: "Basic",      icon: Zap,   color: "#2e8b57", bg: "#2e8b5715", rank: 1 },
  standard:   { label: "Standard",   icon: Crown, color: "#3b82f6", bg: "#3b82f615", rank: 2 },
  premium:    { label: "Premium",    icon: Crown, color: "#8b5cf6", bg: "#8b5cf615", rank: 3 },
  enterprise: { label: "Enterprise", icon: Crown, color: "#f59e0b", bg: "#f59e0b15", rank: 4 },
};

// ─── Access gate config ───────────────────────────────────────────────────────

export const ACCESS_GATE = {
  no_access: {
    icon: Lock,
    headline: "Unlock this content",
    color: "#ef4444",
  },
  expired: {
    icon: Lock,
    headline: "Your access has expired",
    color: "#f59e0b",
  },
};

// ─── Preview limits ───────────────────────────────────────────────────────────

export const DEFAULT_PREVIEW = {
  videoSeconds:   90,   // 1.5 min preview
  audioSeconds:   60,   // 1 min preview
  documentPages:  2,
  ebookPages:     5,
  lessonNotePages:2,
};

// ─── File size formatter ──────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

// ─── Duration formatter ───────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ""}`.trim();
  return `${s}s`;
}

// ─── Price formatter ──────────────────────────────────────────────────────────

export function formatPrice(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}
