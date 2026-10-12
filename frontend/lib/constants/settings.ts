import { Palette, BookOpen, Eye, Globe, Lock, Database, Plug, AlertTriangle } from "lucide-react";
import {
  AllSettings,
  AppearanceSettings,
  StudySettings,
  AccessibilitySettings,
  LanguageSettings,
  PrivacySettings,
  SettingsSection,
  Integration,
} from "@/types/settings";

// ── Default values ────────────────────────────────────────────────────────

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: "light",
  accentColor: "green",
  fontSize: "medium",
  dashboardLayout: "comfortable",
  showAnimations: true,
  sidebarCollapsed: false,
  showAvatarInHeader: true,
};

export const DEFAULT_STUDY: StudySettings = {
  dailyGoalMinutes: 30,
  preferredStudyTime: "evening",
  primaryGoal: "exam_prep",
  autoPlayVideos: false,
  showExplanationsAfterAnswer: true,
  soundEffects: true,
  streakReminders: true,
  defaultQuizDifficulty: "adaptive",
  subjectsOfFocus: ["mathematics", "english", "physics"],
  weeklyTargetSessions: 5,
};

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  reduceMotion: false,
  highContrast: false,
  largerClickTargets: false,
  screenReaderOptimized: false,
  keyboardShortcutsEnabled: true,
  focusIndicatorEnhanced: false,
  colorBlindMode: "none",
};

export const DEFAULT_LANGUAGE: LanguageSettings = {
  appLanguage: "en-NG",
  contentLanguage: "en-NG",
  dateFormat: "dd/mm/yyyy",
  timeFormat: "12h",
  currency: "NGN",
  timezone: "Africa/Lagos",
};

export const DEFAULT_PRIVACY: PrivacySettings = {
  profileVisibility: "public",
  showInLeaderboard: true,
  showOnlineStatus: true,
  activityTracking: true,
  personalizedAds: false,
  dataSharedWithPartners: false,
};

export const DEFAULT_SETTINGS: AllSettings = {
  appearance: DEFAULT_APPEARANCE,
  study: DEFAULT_STUDY,
  accessibility: DEFAULT_ACCESSIBILITY,
  language: DEFAULT_LANGUAGE,
  privacy: DEFAULT_PRIVACY,
};

// ── Navigation ────────────────────────────────────────────────────────────

export const SETTINGS_NAV: {
  id: SettingsSection;
  label: string;
  description: string;
  icon: any;
}[] = [
  { id: "appearance", label: "Appearance", description: "Theme, colors & layout", icon: Palette },
  {
    id: "study",
    label: "Study Preferences",
    description: "Goals, schedule & quiz settings",
    icon: BookOpen,
  },
  {
    id: "accessibility",
    label: "Accessibility",
    description: "Motion, contrast & readability",
    icon: Eye,
  },
  {
    id: "language",
    label: "Language & Region",
    description: "Language, time & currency",
    icon: Globe,
  },
  { id: "privacy", label: "Privacy", description: "Visibility & data sharing", icon: Lock },
  {
    id: "data",
    label: "Data & Export",
    description: "Download or delete your data",
    icon: Database,
  },
  { id: "integrations", label: "Integrations", description: "Connect external apps", icon: Plug },
  { id: "danger", label: "Advanced", description: "Reset & danger zone", icon: AlertTriangle },
];

// ── Integrations mock ─────────────────────────────────────────────────────

export const INTEGRATIONS: Integration[] = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync study sessions and schedules to your calendar",
    category: "calendar",
    isConnected: true,
    lastSync: "2 minutes ago",
    icon: "📅",
    accentColor: "blue",
  },
  {
    id: "google-classroom",
    name: "Google Classroom",
    description: "Import assignments and share resources with your class",
    category: "learning",
    isConnected: false,
    icon: "🏫",
    accentColor: "green",
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Launch study sessions directly in Zoom",
    category: "communication",
    isConnected: true,
    lastSync: "1 hour ago",
    icon: "📹",
    accentColor: "blue",
  },
  {
    id: "google-meet",
    name: "Google Meet",
    description: "Use Google Meet for your online study sessions",
    category: "communication",
    isConnected: false,
    icon: "🎥",
    accentColor: "green",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Save study materials and session recordings to Drive",
    category: "storage",
    isConnected: false,
    icon: "💾",
    accentColor: "yellow",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Receive session reminders and progress updates on WhatsApp",
    category: "communication",
    isConnected: false,
    icon: "💬",
    accentColor: "green",
  },
];

// ── Options lists ─────────────────────────────────────────────────────────

export const ACCENT_COLORS: { id: string; label: string; cls: string; ring: string }[] = [
  { id: "green", label: "Gravitest Green", cls: "bg-green-500", ring: "ring-green-500" },
  { id: "blue", label: "Ocean Blue", cls: "bg-blue-500", ring: "ring-blue-500" },
  { id: "purple", label: "Royal Purple", cls: "bg-purple-500", ring: "ring-purple-500" },
  { id: "orange", label: "Sunset Orange", cls: "bg-orange-500", ring: "ring-orange-500" },
  { id: "red", label: "Ruby Red", cls: "bg-red-500", ring: "ring-red-500" },
];

export const LANGUAGES = [
  { id: "en-NG", label: "English (Nigeria)" },
  { id: "en-GB", label: "English (UK)" },
  { id: "en-US", label: "English (US)" },
  { id: "yo", label: "Yorùbá" },
  { id: "ig", label: "Igbo" },
  { id: "ha", label: "Hausa" },
  { id: "pcm", label: "Nigerian Pidgin" },
];

export const TIMEZONES = [
  { id: "Africa/Lagos", label: "Lagos (WAT, UTC+1)" },
  { id: "Africa/Abuja", label: "Abuja (WAT, UTC+1)" },
  { id: "Europe/London", label: "London (GMT/BST)" },
  { id: "America/New_York", label: "New York (EST/EDT)" },
];

export const SUBJECTS_LIST = [
  "mathematics",
  "english",
  "physics",
  "chemistry",
  "biology",
  "economics",
  "government",
  "literature",
  "history",
  "geography",
];

// ── Helpers ───────────────────────────────────────────────────────────────

function downloadBlob(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSettingsJSON(settings: AllSettings): void {
  const data = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    settings,
  };
  downloadBlob(JSON.stringify(data, null, 2), "application/json", `Gravitest-settings-${Date.now()}.json`);
}

// Real account data, passed in from the caller (profile + academic +
// stats already fetched elsewhere) — this used to be hardcoded to a
// single fake person for every user, which is a much worse bug than a
// missing feature: it handed everyone the same fabricated PII on export.
export interface ExportableUserData {
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  memberSince: string;
  stateOfResidence: string | null;
  currentClass: string | null;
  currentSchool: string | null;
  examTargets: string[];
  totalXp: number;
  level: number;
  totalExamsTaken: number;
  currentStreak: number;
  leaderboardRank: number | null;
}

export function exportUserDataCSV(data: ExportableUserData): void {
  const lines = [
    "Gravitest Learning Hub — Personal Data Export",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "PROFILE",
    "Field,Value",
    `Name,${data.fullName}`,
    `Email,${data.email}`,
    `Phone,${data.phoneNumber ?? "Not provided"}`,
    `Role,${capitalize(data.role)}`,
    `Member Since,${data.memberSince}`,
    `State,${data.stateOfResidence ?? "Not provided"}`,
    "",
    "ACADEMIC",
    `Class,${data.currentClass ?? "Not provided"}`,
    `School,${data.currentSchool ?? "Not provided"}`,
    `Target Exams,${data.examTargets.join("; ") || "Not set"}`,
    "",
    "STATS",
    `Total XP,${data.totalXp}`,
    `Level,${data.level}`,
    `Sessions Completed,${data.totalExamsTaken}`,
    `Current Streak,${data.currentStreak} days`,
    `Rank,${data.leaderboardRank ? `#${data.leaderboardRank}` : "Unranked"}`,
    "",
    "NOTE: Full session history and learning data available via the Session History export.",
  ];
  downloadBlob(lines.join("\n"), "text/csv", `Gravitest-my-data-${Date.now()}.csv`);
}

export interface ExportableSession {
  date: string;
  examType: string | null;
  subjects: string[];
  score: string;
  status: string;
  durationMinutes: number;
}

export function exportSessionsCSV(sessions: ExportableSession[]): void {
  const header = "Date,Exam Type,Subjects,Score,Status,Duration (min)";
  const rows = sessions.map((s) =>
    [
      s.date,
      s.examType ?? "Practice",
      `"${s.subjects.join("; ")}"`,
      s.score,
      s.status,
      s.durationMinutes,
    ].join(","),
  );
  downloadBlob(
    [header, ...rows].join("\n"),
    "text/csv",
    `Gravitest-session-history-${Date.now()}.csv`,
  );
}

export interface ExportableWeakTopic {
  subject: string;
  topic: string;
  averageScore: number;
  status: string;
}

export function exportProgressCSV(
  stats: { totalXp: number; level: number; currentStreak: number; longestStreak: number; averageScore: number; accuracyRate: number },
  weakTopics: ExportableWeakTopic[],
): void {
  const lines = [
    "Gravitest Learning Hub — Performance Report",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "OVERALL",
    "Metric,Value",
    `Total XP,${stats.totalXp}`,
    `Level,${stats.level}`,
    `Current Streak,${stats.currentStreak} days`,
    `Longest Streak,${stats.longestStreak} days`,
    `Average Score,${stats.averageScore}%`,
    `Accuracy Rate,${stats.accuracyRate}%`,
    "",
    "TOPICS TO IMPROVE",
    "Subject,Topic,Average Score,Status",
    ...weakTopics.map((t) => `${t.subject},${t.topic},${t.averageScore}%,${t.status}`),
  ];
  downloadBlob(lines.join("\n"), "text/csv", `Gravitest-performance-report-${Date.now()}.csv`);
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
