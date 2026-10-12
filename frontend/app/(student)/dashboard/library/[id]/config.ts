import {
  Video,
  Headphones,
  BookOpen,
  FileText,
  ClipboardList,
  BookMarked,
  Image,
  Crown,
  Zap,
  Star,
} from "lucide-react";
import type { ContentType, Subject, SubscriptionTier } from "./types";

export const CONTENT_CFG: Record<
  ContentType,
  {
    label: string;
    icon: any;
    color: string;
    bg: string;
  }
> = {
  VIDEO: { label: "Video", icon: Video, color: "#ef4444", bg: "#ef444412" },
  AUDIO: { label: "Audio", icon: Headphones, color: "#8b5cf6", bg: "#8b5cf612" },
  EBOOK: { label: "E-Book", icon: BookOpen, color: "#2e8b57", bg: "#2e8b5712" },
  DOCUMENT: { label: "Document", icon: FileText, color: "#3b82f6", bg: "#3b82f612" },
  PAST_QUESTION: {
    label: "Past Questions",
    icon: ClipboardList,
    color: "#f59e0b",
    bg: "#f59e0b12",
  },
  LESSON_NOTE: { label: "Lesson Notes", icon: BookMarked, color: "#0891b2", bg: "#0891b212" },
  INFOGRAPHIC: { label: "Infographic", icon: Image, color: "#ec4899", bg: "#ec489912" },
};

export const SUBJECT_CFG: Record<Subject, { label: string; color: string }> = {
  MATHEMATICS: { label: "Mathematics", color: "#2563eb" },
  ENGLISH: { label: "English Language", color: "#16a34a" },
  PHYSICS: { label: "Physics", color: "#9333ea" },
  CHEMISTRY: { label: "Chemistry", color: "#dc2626" },
  BIOLOGY: { label: "Biology", color: "#15803d" },
  ECONOMICS: { label: "Economics", color: "#ca8a04" },
  GOVERNMENT: { label: "Government", color: "#0284c7" },
  LITERATURE: { label: "Literature in English", color: "#c2410c" },
  GEOGRAPHY: { label: "Geography", color: "#065f46" },
  HISTORY: { label: "History", color: "#92400e" },
  COMMERCE: { label: "Commerce", color: "#1d4ed8" },
  ACCOUNTING: { label: "Accounting", color: "#0f766e" },
  FURTHER_MATHEMATICS: { label: "Further Mathematics", color: "#6d28d9" },
  AGRICULTURAL_SCIENCE: { label: "Agricultural Science", color: "#4d7c0f" },
  CIVIC_EDUCATION: { label: "Civic Education", color: "#0369a1" },
};

export const EXAM_LABELS: Record<string, string> = {
  WAEC: "WAEC",
  NECO: "NECO",
  JAMB: "JAMB",
  NABTEB: "NABTEB",
  COMMON_ENTRANCE: "Common Entrance",
};

export const CLASS_LABELS: Record<string, string> = {
  JSS1: "JSS1",
  JSS2: "JSS2",
  JSS3: "JSS3",
  SS1: "SS1",
  SS2: "SS2",
  SS3: "SS3",
};

export const TIER_CFG: Record<
  SubscriptionTier,
  {
    label: string;
    icon: any;
    color: string;
    bg: string;
    rank: number;
  }
> = {
  FREE: { label: "Free", icon: Zap, color: "#6b7280", bg: "#6b728012", rank: 0 },
  BASIC: { label: "Basic", icon: Zap, color: "#2e8b57", bg: "#2e8b5712", rank: 1 },
  STANDARD: { label: "Standard", icon: Star, color: "#3b82f6", bg: "#3b82f612", rank: 2 },
  PREMIUM: { label: "Premium", icon: Crown, color: "#8b5cf6", bg: "#8b5cf612", rank: 3 },
  ENTERPRISE: { label: "Enterprise", icon: Crown, color: "#f59e0b", bg: "#f59e0b12", rank: 4 },
};

// Default preview limits
export const PREVIEW = {
  VIDEO_SECONDS: 90,
  AUDIO_SECONDS: 60,
  PAGES: 2,
  EBOOK_PAGES: 5,
};

export function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m${sec > 0 ? ` ${sec}s` : ""}`;
  return `${sec}s`;
}

export function fmtSize(b: number): string {
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
  return `${(b / 1073741824).toFixed(2)} GB`;
}

export function fmtPrice(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

export function isMediaType(type: ContentType) {
  return type === "VIDEO" || type === "AUDIO";
}

export function isDocType(type: ContentType) {
  return ["EBOOK", "DOCUMENT", "PAST_QUESTION", "LESSON_NOTE", "INFOGRAPHIC"].includes(type);
}
