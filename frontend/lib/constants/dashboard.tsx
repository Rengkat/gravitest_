import { LayoutDashboard, BarChart3, Library, Bot, Settings, Target, Gamepad2 } from "lucide-react";
export const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", exact: true },
  { icon: Target, label: "Practice CBT", href: "/dashboard/practice" },
  { icon: BarChart3, label: "Performance", href: "/dashboard/performance" },
  { icon: Bot, label: "AI Tutor", href: "/ai-tutor" },
  { icon: Library, label: "Library", href: "/dashboard/library" },
  { icon: Gamepad2, label: "Games", href: "/dashboard/games" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export type RecentSession = {
  id: string;
  examType: string;
  subject: string;
  score: number;
  total: number;
  date: string;
  duration: string;
};

export type WeakTopic = {
  id: string;
  topic: string;
  subject: string;
  accuracy: number;
  priority: "high" | "medium" | "low";
};

export type LibraryContentType = "ebook" | "doc" | "video";

export type LibraryItem = {
  id: string;
  title: string;
  subject: string;
  type: LibraryContentType;
  duration?: string; // for video
  pages?: number; // for ebook/doc
};
