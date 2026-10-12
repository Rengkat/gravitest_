import { apiClient } from "./client";

// Mirrors backend src/common/enums/enums.ts — UserRole (category) and
// ExamType — plus src/leaderboard/* response shapes. Kept in this one file
// since the redesigned leaderboard is a self-contained module on both ends.

export type LeaderboardCategory = "student" | "professional_student";

export const CATEGORY_LABELS: Record<LeaderboardCategory, string> = {
  student: "Secondary School",
  professional_student: "Professional",
};

export type LeaderboardExamType =
  | "jamb"
  | "waec"
  | "neco"
  | "nabteb"
  | "bece"
  | "junior_neco"
  | "post_utme"
  | "common_entrance"
  | "ican"
  | "nmcn"
  | "cipm"
  | "nim"
  | "niesv"
  | "cibn"
  | "nse"
  | "icen"
  | "niqs"
  | "arcon"
  | "mlscn"
  | "pcn";

export const EXAM_TYPE_LABELS: Record<LeaderboardExamType, string> = {
  jamb: "JAMB UTME",
  waec: "WAEC SSCE",
  neco: "NECO SSCE",
  nabteb: "NABTEB",
  bece: "BECE",
  junior_neco: "Junior NECO",
  post_utme: "Post-UTME",
  common_entrance: "Common Entrance",
  ican: "ICAN",
  nmcn: "NMCN",
  cipm: "CIPM",
  nim: "NIM",
  niesv: "NIESV",
  cibn: "CIBN",
  nse: "NSE",
  icen: "ICEN",
  niqs: "NIQS",
  arcon: "ARCON",
  mlscn: "MLSCN",
  pcn: "PCN",
};

export type LeaderboardScope = "general" | "category" | "exam_type";

export interface LeaderboardRow {
  rank: number;
  studentProfileId: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  category: LeaderboardCategory;
  examTargets: LeaderboardExamType[];
  xpEarned: number;
  streak: number;
  performance: number;
  consistency: number;
  score: number;
  qualifiesForIncentive: boolean;
  isCurrentUser?: boolean;
  /** On the public leaderboard? (Admin lists can include entries that are not.) */
  isEligible: boolean;
  /** Admin lists that include ineligible entries: what each one is still missing. */
  ineligibleReasons?: string[];
}

/** What a student still needs to appear on the leaderboard. */
export interface EligibilityProgress {
  subscribersOnly: boolean;
  isSubscriber: boolean;
  sessions: { have: number; need: number };
  questions: { have: number; need: number };
  /** Plain-English list of what is still missing. Empty when eligible. */
  missing: string[];
}

export interface LeaderboardListResult {
  period: string;
  isFinalized: boolean;
  scope: LeaderboardScope;
  category: LeaderboardCategory | null;
  examType: LeaderboardExamType | null;
  rows: LeaderboardRow[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface MyLeaderboardPosition {
  period: string;
  isFinalized: boolean;
  isEligible: boolean;
  qualifiesForIncentive: boolean;
  entry: {
    xpEarned: number;
    streak: number;
    performance: number;
    consistency: number;
    score: number;
  } | null;
  ranks: {
    general: number | null;
    category: number | null;
    examType: { examType: LeaderboardExamType; rank: number | null }[];
  };
  totals: { general: number; category: number };
  eligibility: EligibilityProgress;
}

export interface LeaderboardPeriodSummary {
  period: string;
  isFinalized: boolean;
  finalizedAt: string | null;
  totalCount: number;
  eligibleCount: number;
}

export interface LeaderboardSettings {
  id: string;
  xpWeight: number;
  streakWeight: number;
  performanceWeight: number;
  consistencyWeight: number;
  minSessionsRequired: number;
  minQuestionsAttemptedRequired: number;
  subscribersOnly: boolean;
  incentiveTopN: number;
  notifyDaysBeforeClose: number[];
  notifyOnResultsPublished: boolean;
  lastUpdatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardQueryParams {
  scope?: LeaderboardScope;
  category?: LeaderboardCategory;
  examType?: LeaderboardExamType;
  period?: string; // 'current' or 'YYYY-MM'
  page?: number;
  limit?: number;
  includeIneligible?: boolean;
}

// ── Student-facing (/leaderboard) ──────────────────────────────────────────

export async function getLeaderboard(
  params: LeaderboardQueryParams = {},
): Promise<LeaderboardListResult> {
  const { data } = await apiClient.get("/leaderboard", { params });
  return data;
}

export async function getMyPosition(period = "current"): Promise<MyLeaderboardPosition> {
  const { data } = await apiClient.get("/leaderboard/me", { params: { period } });
  return data;
}

export async function getHistory(): Promise<LeaderboardPeriodSummary[]> {
  const { data } = await apiClient.get("/leaderboard/history");
  return data;
}

export async function getHistoryPeriod(
  period: string,
  params: Omit<LeaderboardQueryParams, "period"> = {},
): Promise<LeaderboardListResult> {
  const { data } = await apiClient.get(`/leaderboard/history/${period}`, { params });
  return data;
}

// ── Admin (/admin/leaderboard) ──────────────────────────────────────────────

export async function getAdminLeaderboard(
  params: LeaderboardQueryParams = {},
): Promise<LeaderboardListResult> {
  const { data } = await apiClient.get("/admin/leaderboard", { params });
  return data;
}

export async function getAdminHistory(): Promise<LeaderboardPeriodSummary[]> {
  const { data } = await apiClient.get("/admin/leaderboard/history");
  return data;
}

export async function getIncentiveEligible(
  period = "current",
  category?: LeaderboardCategory,
): Promise<LeaderboardRow[]> {
  const { data } = await apiClient.get("/admin/leaderboard/incentive-eligible", {
    params: { period, category },
  });
  return data;
}

export async function getSettings(): Promise<LeaderboardSettings> {
  const { data } = await apiClient.get("/admin/leaderboard/settings");
  return data;
}

export async function updateSettings(
  patch: Partial<
    Pick<
      LeaderboardSettings,
      | "xpWeight"
      | "streakWeight"
      | "performanceWeight"
      | "consistencyWeight"
      | "minSessionsRequired"
      | "minQuestionsAttemptedRequired"
      | "subscribersOnly"
      | "incentiveTopN"
      | "notifyDaysBeforeClose"
      | "notifyOnResultsPublished"
    >
  >,
): Promise<LeaderboardSettings> {
  const { data } = await apiClient.patch("/admin/leaderboard/settings", patch);
  return data;
}

export async function recalculate(): Promise<{ period: string; updated: number }> {
  const { data } = await apiClient.post("/admin/leaderboard/recalculate");
  return data;
}

export async function finalize(period: string): Promise<{ period: string; finalized: number }> {
  const { data } = await apiClient.post(`/admin/leaderboard/finalize/${period}`);
  return data;
}

// ── Display helpers ─────────────────────────────────────────────────────────

/** '2026-09' -> 'September 2026' */
export function formatPeriodLabel(period: string): string {
  if (!period || period === "current") return "Current Month";
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
