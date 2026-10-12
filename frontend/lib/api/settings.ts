import { apiClient } from "./client";
import type { AllSettings, DashboardLayout } from "@/types/settings";
import { useAppearanceStore } from "@/lib/theme/appearance-store";

// ── Backend shape ──────────────────────────────────────────────────────────
// Mirrors UserSettings entity / UpdateUserSettingsDto exactly
// (src/user/entities/user-settings.entity.ts, src/user/dto/update-user-settings.dto.ts).
export interface BackendUserSettings {
  theme: "light" | "dark" | "system";
  accentColor: string; // hex, e.g. '#4F46E5'
  fontSize: "small" | "medium" | "large" | "extra_large";
  dashboardLayout: "default" | "compact" | "expanded" | "minimal";
  showAvatar: boolean;
  collapseSidebar: boolean;
  colorVisionMode: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  primaryGoal: "exam_prep" | "skill_building" | "school_support" | "general_learning";
  showExplanationAfterAnswer: boolean;
  autoSubmitOnTime: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showTimerDuringExam: boolean;
  enableStudyReminders: boolean;
  studyReminderTimes: string[] | null;
  dailyStudyGoalMinutes: number;
  soundEffects: boolean;
  backgroundMusic: boolean;
  soundVolume: number;
  profileVisibility: "public" | "friends" | "private";
  showOnLeaderboard: boolean;
  showStreak: boolean;
  connectedIntegrations: {
    google?: { connected: boolean; email: string };
    whatsapp?: { connected: boolean; phone: string };
  } | null;
}

export type BackendUserSettingsPatch = Partial<Omit<BackendUserSettings, "connectedIntegrations">> & {
  connectedIntegrations?: BackendUserSettings["connectedIntegrations"];
};

// Theme and font size are applied to the whole app from a small device-level
// store (lib/theme). Whenever the server tells us what this user has saved —
// on sign-in, after a save, after "reset all" — that store is updated here,
// once, so no caller has to remember to do it.
function commitAppearance(b: BackendUserSettings) {
  useAppearanceStore.getState().commit({ theme: b.theme, fontSize: b.fontSize });
}

export async function getSettings(): Promise<BackendUserSettings> {
  const { data } = await apiClient.get("/users/me/settings");
  commitAppearance(data);
  return data;
}

export async function updateSettings(
  patch: BackendUserSettingsPatch,
): Promise<BackendUserSettings> {
  const { data } = await apiClient.patch("/users/me/settings", patch);
  commitAppearance(data);
  return data;
}

// ── Frontend ⇄ backend mapping ──────────────────────────────────────────
//
// The Settings UI (types/settings.ts) is a superset of what the backend's
// UserSettings entity actually stores. Every field mapped here round-trips
// through the API and survives a reload. Fields commented "local only"
// below have no backend column — they still work for the current
// session (the toggle responds, the preview updates) but reset on
// refresh until a backend column is added for them. That's a real,
// contained gap — not a mock pretending to be real.

// The accent colour is deliberately NOT mapped any more: it is a platform-wide
// setting owned by admins (lib/api/platform.ts), not a per-user one. The
// UserSettings.accentColor column is left untouched.

// Frontend's 3-option layout scale doesn't line up 1:1 with the backend's
// 4-option one — "minimal" only exists on the backend (e.g. if set via
// another client) and falls back to "comfortable" here since there's no
// frontend tile for it yet.
const LAYOUT_TO_BACKEND: Record<DashboardLayout, BackendUserSettings["dashboardLayout"]> = {
  compact: "compact",
  comfortable: "default",
  spacious: "expanded",
};
const LAYOUT_FROM_BACKEND: Record<BackendUserSettings["dashboardLayout"], DashboardLayout> = {
  compact: "compact",
  default: "comfortable",
  expanded: "spacious",
  minimal: "comfortable",
};

export function backendToFrontend(b: BackendUserSettings): AllSettings {
  return {
    appearance: {
      theme: b.theme,
      fontSize: b.fontSize,
      dashboardLayout: LAYOUT_FROM_BACKEND[b.dashboardLayout],
      showAnimations: true, // local only — no backend column
      sidebarCollapsed: b.collapseSidebar,
      showAvatarInHeader: b.showAvatar,
    },
    study: {
      dailyGoalMinutes: (b.dailyStudyGoalMinutes as any) ?? 30,
      preferredStudyTime: "evening", // local only — no backend column
      primaryGoal: b.primaryGoal,
      autoPlayVideos: false, // local only — no backend column
      showExplanationsAfterAnswer: b.showExplanationAfterAnswer,
      soundEffects: b.soundEffects,
      streakReminders: b.enableStudyReminders,
      defaultQuizDifficulty: "adaptive", // local only — no backend column
      subjectsOfFocus: [], // local only — no backend column (see Profile > Academic for real exam targets)
      weeklyTargetSessions: 5, // local only — no backend column
      shuffleQuestions: b.shuffleQuestions,
      shuffleOptions: b.shuffleOptions,
      showTimerDuringExam: b.showTimerDuringExam,
      autoSubmitOnTime: b.autoSubmitOnTime,
      backgroundMusic: b.backgroundMusic,
      soundVolume: b.soundVolume,
    },
    accessibility: {
      reduceMotion: b.reducedMotion,
      highContrast: b.highContrastMode,
      largerClickTargets: false, // local only
      screenReaderOptimized: false, // local only
      keyboardShortcutsEnabled: true, // local only
      focusIndicatorEnhanced: false, // local only
      colorBlindMode: b.colorVisionMode ? "protanopia" : "none",
    },
    language: {
      appLanguage: b.language,
      contentLanguage: b.language, // local only distinction — backend has one language field
      dateFormat: b.dateFormat as any,
      timeFormat: b.timeFormat as any,
      currency: "NGN", // local only — no backend column
      timezone: b.timezone,
    },
    privacy: {
      profileVisibility: b.profileVisibility,
      showInLeaderboard: b.showOnLeaderboard,
      showOnlineStatus: true, // local only
      activityTracking: true, // local only
      personalizedAds: false, // local only
      dataSharedWithPartners: false, // local only
    },
  };
}

// Builds a minimal PATCH body for just the section that changed, mapped
// to backend field names/enums.
export function frontendSectionToPatch(
  section: keyof AllSettings,
  values: AllSettings[keyof AllSettings],
): BackendUserSettingsPatch {
  switch (section) {
    case "appearance": {
      const v = values as AllSettings["appearance"];
      return {
        theme: v.theme,
        fontSize: v.fontSize,
        dashboardLayout: LAYOUT_TO_BACKEND[v.dashboardLayout],
        showAvatar: v.showAvatarInHeader,
        collapseSidebar: v.sidebarCollapsed,
      };
    }
    case "study": {
      const v = values as AllSettings["study"];
      return {
        dailyStudyGoalMinutes: v.dailyGoalMinutes,
        primaryGoal: v.primaryGoal as BackendUserSettings["primaryGoal"],
        showExplanationAfterAnswer: v.showExplanationsAfterAnswer,
        soundEffects: v.soundEffects,
        enableStudyReminders: v.streakReminders,
        ...(v.shuffleQuestions !== undefined && { shuffleQuestions: v.shuffleQuestions }),
        ...(v.shuffleOptions !== undefined && { shuffleOptions: v.shuffleOptions }),
        ...(v.showTimerDuringExam !== undefined && { showTimerDuringExam: v.showTimerDuringExam }),
        ...(v.autoSubmitOnTime !== undefined && { autoSubmitOnTime: v.autoSubmitOnTime }),
        ...(v.backgroundMusic !== undefined && { backgroundMusic: v.backgroundMusic }),
        ...(v.soundVolume !== undefined && { soundVolume: v.soundVolume }),
      };
    }
    case "accessibility": {
      const v = values as AllSettings["accessibility"];
      return {
        reducedMotion: v.reduceMotion,
        highContrastMode: v.highContrast,
        colorVisionMode: v.colorBlindMode !== "none",
      };
    }
    case "language": {
      const v = values as AllSettings["language"];
      return {
        language: v.appLanguage,
        dateFormat: v.dateFormat,
        timeFormat: v.timeFormat,
        timezone: v.timezone,
      };
    }
    case "privacy": {
      const v = values as AllSettings["privacy"];
      return {
        profileVisibility: v.profileVisibility,
        showOnLeaderboard: v.showInLeaderboard,
      };
    }
    default:
      return {};
  }
}
