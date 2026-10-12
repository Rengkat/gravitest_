import {
  BookOpen,
  Video,
  Image,
  FileText,
  Headphones,
  Monitor,
  Layers,
  Target,
  Gift,
  Zap,
  Star,
  Crown,
  Shield,
} from "lucide-react";
import type {
  ContentType,
  AccessLevel,
  ContentStatus,
  ContentQuality,
  SubjectCategory,
  ExamTarget,
  ContentAudience,
} from "@/types/admin-contents";

// ─── CONTENT TYPE CONFIG ─────────────────────────────────────
export const CONTENT_TYPES: Record<
  ContentType,
  { label: string; icon: any; color: string; bg: string; extensions: string[]; maxSize: string }
> = {
  ebook: {
    label: "E-Book",
    icon: BookOpen,
    color: "#2e8b57",
    bg: "#2e8b5715",
    extensions: [".pdf", ".epub", ".mobi"],
    maxSize: "50 MB",
  },
  video: {
    label: "Video",
    icon: Video,
    color: "#ef4444",
    bg: "#ef444415",
    extensions: [".mp4", ".webm", ".mov"],
    maxSize: "2 GB",
  },
  image: {
    label: "Image",
    icon: Image,
    color: "#3b82f6",
    bg: "#3b82f615",
    extensions: [".jpg", ".png", ".svg", ".webp"],
    maxSize: "25 MB",
  },
  document: {
    label: "Document",
    icon: FileText,
    color: "#f59e0b",
    bg: "#f59e0b15",
    extensions: [".pdf", ".doc", ".docx", ".ppt", ".pptx"],
    maxSize: "100 MB",
  },
  audio: {
    label: "Audio",
    icon: Headphones,
    color: "#8b5cf6",
    bg: "#8b5cf615",
    extensions: [".mp3", ".wav", ".aac"],
    maxSize: "500 MB",
  },
  interactive: {
    label: "Interactive",
    icon: Monitor,
    color: "#14b8a6",
    bg: "#14b8a615",
    extensions: [".html", ".scorm", ".xapi"],
    maxSize: "200 MB",
  },
  flashcard: {
    label: "Flashcard",
    icon: Layers,
    color: "#ec4899",
    bg: "#ec489915",
    extensions: [".json", ".csv", ".apkg"],
    maxSize: "10 MB",
  },
  quiz: {
    label: "Quiz",
    icon: Target,
    color: "#f97316",
    bg: "#f9731615",
    extensions: [".json", ".xml", ".gift"],
    maxSize: "5 MB",
  },
};

// ─── ACCESS LEVEL CONFIG ─────────────────────────────────────
export const ACCESS_LEVELS: Record<
  AccessLevel,
  { label: string; icon: any; color: string; bg: string }
> = {
  free: { label: "Free", icon: Gift, color: "#10b981", bg: "#10b98115" },
  basic: { label: "Basic", icon: Zap, color: "#0ea5e9", bg: "#0ea5e915" },
  standard: { label: "Standard", icon: Star, color: "#3b82f6", bg: "#3b82f615" },
  premium: { label: "Premium", icon: Crown, color: "#f59e0b", bg: "#f59e0b15" },
  enterprise: { label: "Enterprise", icon: Shield, color: "#7c3aed", bg: "#7c3aed15" },
};

// ─── STATUS CONFIG ───────────────────────────────────────────
export const STATUS_MAP: Record<ContentStatus, { label: string; bg: string; text: string }> = {
  published: { label: "Published", bg: "#10b98115", text: "#10b981" },
  draft: { label: "Draft", bg: "#6b728015", text: "#6b7280" },
  archived: { label: "Archived", bg: "#ef444415", text: "#ef4444" },
  review: { label: "In Review", bg: "#f59e0b15", text: "#f59e0b" },
};

// ─── QUALITY CONFIG ──────────────────────────────────────────
export const QUALITY_MAP: Record<ContentQuality, { label: string; color: string; bg: string }> = {
  basic: { label: "Basic", color: "#6b7280", bg: "#6b728015" },
  standard: { label: "Standard", color: "#3b82f6", bg: "#3b82f615" },
  premium: { label: "Premium", color: "#f59e0b", bg: "#f59e0b15" },
  gold: { label: "Gold", color: "#ef4444", bg: "#ef444415" },
};

// ─── SUBJECTS ────────────────────────────────────────────────
export const SUBJECTS: Record<SubjectCategory, { label: string; color: string }> = {
  mathematics: { label: "Mathematics", color: "#2e8b57" },
  english: { label: "English", color: "#3b82f6" },
  physics: { label: "Physics", color: "#ef4444" },
  chemistry: { label: "Chemistry", color: "#8b5cf6" },
  biology: { label: "Biology", color: "#10b981" },
  economics: { label: "Economics", color: "#f59e0b" },
  government: { label: "Government", color: "#6366f1" },
  literature: { label: "Literature", color: "#ec4899" },
  commerce: { label: "Commerce", color: "#14b8a6" },
  geography: { label: "Geography", color: "#f97316" },
  accounting: { label: "Accounting", color: "#dc2626" },
  nursing: { label: "Nursing", color: "#0284c7" },
  hr_management: { label: "HR Management", color: "#7c3aed" },
  management: { label: "Management", color: "#d97706" },
  estate: { label: "Estate", color: "#059669" },
  all: { label: "All Subjects", color: "#6b7280" },
};

// ─── EXAM TARGETS ────────────────────────────────────────────
export const SECONDARY_EXAMS: Record<string, { label: string; color: string }> = {
  jamb: { label: "JAMB UTME", color: "#7c3aed" },
  waec: { label: "WAEC SSCE", color: "#0284c7" },
  neco: { label: "NECO SSCE", color: "#059669" },
  nabteb: { label: "NABTEB", color: "#d97706" },
  bece: { label: "BECE", color: "#16a34a" },
  junior_neco: { label: "Junior NECO", color: "#0d9488" },
};

export const PROFESSIONAL_EXAMS: Record<string, { label: string; color: string }> = {
  ican: { label: "ICAN", color: "#dc2626" },
  nmcn: { label: "NMCN", color: "#0284c7" },
  cipm: { label: "CIPM", color: "#7c3aed" },
  nim: { label: "NIM", color: "#d97706" },
  niesv: { label: "NIESV", color: "#059669" },
};

export const ALL_EXAMS = { ...SECONDARY_EXAMS, ...PROFESSIONAL_EXAMS };

// ─── STAT KEY → ContentType MAP ──────────────────────────────
export const TYPE_STAT_KEYS: Record<ContentType, string> = {
  ebook: "ebook",
  video: "video",
  image: "image",
  document: "document",
  audio: "audio",
  interactive: "interactive",
  flashcard: "flashcard",
  quiz: "quiz",
};
