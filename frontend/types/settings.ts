// ── Section navigation ─────────────────────────────────────────────────────

export type SettingsSection =
  | "appearance"
  | "study"
  | "accessibility"
  | "language"
  | "privacy"
  | "data"
  | "integrations"
  | "danger";

// ── Appearance ─────────────────────────────────────────────────────────────

export type ThemeMode = "light" | "dark" | "system";
/** @deprecated The accent colour is now platform-wide and set by an admin (see lib/theme/accent.ts). Kept only so old data still type-checks. */
export type AccentColor = "green" | "blue" | "purple" | "orange" | "red";
export type FontSize = "small" | "medium" | "large" | "extra_large";
export type DashboardLayout = "compact" | "comfortable" | "spacious";

export interface AppearanceSettings {
  theme: ThemeMode;
  /** @deprecated no longer read or written — accent is platform-wide */
  accentColor?: AccentColor;
  fontSize: FontSize;
  dashboardLayout: DashboardLayout;
  showAnimations: boolean;
  sidebarCollapsed: boolean;
  showAvatarInHeader: boolean;
}

// ── Study preferences ──────────────────────────────────────────────────────

export type StudyGoal = "exam_prep" | "skill_building" | "school_support" | "general_learning";
export type DailyGoalMinutes = 15 | 30 | 45 | 60 | 90 | 120;
export type QuizDifficulty = "adaptive" | "easy" | "medium" | "hard";

export interface StudySettings {
  dailyGoalMinutes: DailyGoalMinutes;
  preferredStudyTime: "morning" | "afternoon" | "evening" | "night";
  primaryGoal: StudyGoal;
  autoPlayVideos: boolean;
  showExplanationsAfterAnswer: boolean;
  soundEffects: boolean;
  streakReminders: boolean;
  defaultQuizDifficulty: QuizDifficulty;
  subjectsOfFocus: string[];
  weeklyTargetSessions: number;
  // Real backend fields (UserSettings entity) with no UI control until
  // now — added here rather than left unreachable from the type system.
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showTimerDuringExam?: boolean;
  autoSubmitOnTime?: boolean;
  backgroundMusic?: boolean;
  soundVolume?: number;
}

// ── Accessibility ──────────────────────────────────────────────────────────

export interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  largerClickTargets: boolean;
  screenReaderOptimized: boolean;
  keyboardShortcutsEnabled: boolean;
  focusIndicatorEnhanced: boolean;
  colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";
}

// ── Language & Region ──────────────────────────────────────────────────────

export interface LanguageSettings {
  appLanguage: string;
  contentLanguage: string;
  dateFormat: "dd/mm/yyyy" | "mm/dd/yyyy" | "yyyy-mm-dd";
  timeFormat: "12h" | "24h";
  currency: "NGN" | "USD" | "GBP";
  timezone: string;
}

// ── Privacy ────────────────────────────────────────────────────────────────

export interface PrivacySettings {
  profileVisibility: "public" | "friends" | "private";
  showInLeaderboard: boolean;
  showOnlineStatus: boolean;
  activityTracking: boolean;
  personalizedAds: boolean;
  dataSharedWithPartners: boolean;
}

// ── Integrations ───────────────────────────────────────────────────────────

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: "calendar" | "communication" | "storage" | "learning";
  isConnected: boolean;
  lastSync?: string;
  icon: string; // emoji
  accentColor: string;
}

// ── All settings bundle ────────────────────────────────────────────────────

export interface AllSettings {
  appearance: AppearanceSettings;
  study: StudySettings;
  accessibility: AccessibilitySettings;
  language: LanguageSettings;
  privacy: PrivacySettings;
}
