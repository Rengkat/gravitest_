import { apiClient } from "./client";

export interface BackendStudentProfileFull {
  id: string;
  currentSchool: string | null;
  currentClass: string | null;
  examTargets: string[];
  examDate: string | null;
  targetScore: number | null;
  totalXp: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  longestStreak: number;
  averageScore: number;
  totalExamsTaken: number;
}

export interface BackendExamSession {
  id: string;
  examType: string | null;
  subjects: string[];
  sessionTitle: string | null;
  percentage: number;
  questionsCorrect: number;
  totalQuestions: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
  timeSpentSeconds: number;
}

export interface BackendWeakTopic {
  id: string;
  subject: string;
  topic: string;
  averageScore: number;
  status: string;
}

export interface StudentOverviewResponse {
  profile: BackendStudentProfileFull;
  stats: {
    totalXp: number;
    level: number;
    levelTitle: string;
    currentStreak: number;
    longestStreak: number;
    averageScore: number;
    totalExamsTaken: number;
    totalQuestionsAttempted: number;
    totalQuestionsCorrect: number;
    accuracyRate: number;
    totalMinutesStudied: number;
    bestScore: number | null;
    worstScore: number | null;
    leaderboardRank: number | null;
    percentileStanding: number | null;
  };
  recentSessions: BackendExamSession[];
  weakTopics: BackendWeakTopic[];
  daysUntilExam: number | null;
}

// GET /students/me/overview
export async function getMyOverview(): Promise<StudentOverviewResponse> {
  const { data } = await apiClient.get("/students/me/overview");
  return data;
}

// ── Performance analytics ──────────────────────────────────────────────

export interface StudentPerformance {
  overall: {
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
    accuracyRate: number;
    totalTimeSpentMinutes: number;
    streak: number;
    bestStreak: number;
    improvement: number;
  };
  subjectPerformance: {
    subject: string;
    score: number;
    averageScore: number;
    masteryLevel: "beginner" | "intermediate" | "advanced" | "expert";
    questionsAttempted: number;
    correctAnswers: number;
    timeSpent: number;
    trend: number;
  }[];
  topicMastery: {
    subject: string;
    topic: string;
    score: number;
    masteryLevel: "beginner" | "intermediate" | "advanced" | "expert";
    questionsAttempted: number;
    improvement: number;
  }[];
  weeklyTrend: { week: string; score: number; questionsAttempted: number; minutesStudied: number }[];
  examPerformance: {
    examType: string;
    examsTaken: number;
    bestScore: number;
    worstScore: number;
    averageScore: number;
    trend: number;
    lastAttemptAt: string;
  }[];
  studyHeatmap: { date: string; count: number; minutesStudied: number }[];
  recentActivity: {
    date: string;
    examType: string;
    subject: string;
    score: number;
    timeSpent: number;
    questionsCorrect: number;
    totalQuestions: number;
  }[];
}

// GET /students/me/performance?days=90 — see the security note on the
// backend route: this resolves the profile from the JWT, unlike the
// admin-facing /students/:id/performance which takes a client-supplied id.
export async function getMyPerformance(days = 90): Promise<StudentPerformance> {
  const { data } = await apiClient.get("/students/me/performance", { params: { days } });
  return data;
}

// GET /students/me/sessions
export interface SessionHistoryParams {
  examType?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  page?: number;
  limit?: number;
}
export async function getMySessions(
  params?: SessionHistoryParams,
): Promise<{
  data: BackendExamSession[];
  meta: { totalItems: number; itemCount: number; itemsPerPage: number; totalPages: number; currentPage: number };
}> {
  const { data } = await apiClient.get("/students/me/sessions", { params });
  return data;
}

// GET /students/me/weak-topics
export async function getMyWeakTopics(params?: {
  subject?: string;
  status?: string;
}): Promise<{
  data: BackendWeakTopic[];
  meta: { totalItems: number; itemCount: number; itemsPerPage: number; totalPages: number; currentPage: number };
}> {
  const { data } = await apiClient.get("/students/me/weak-topics", { params });
  return data;
}

// GET /students/me/activity?days=90
export async function getMyStudyActivity(
  days = 90,
): Promise<{ date: string; count: number; minutesStudied: number }[]> {
  const { data } = await apiClient.get("/students/me/activity", { params: { days } });
  return data;
}

// GET /students/me/topic-mastery
export interface TopicMasteryHistoryEntry {
  id: string;
  subject: string;
  topic: string;
  masteryScore: number;
  recordedAt: string;
}
export async function getMyTopicMastery(subject?: string): Promise<TopicMasteryHistoryEntry[]> {
  const { data } = await apiClient.get("/students/me/topic-mastery", { params: { subject } });
  return data;
}

// GET /students/leaderboard
export interface LeaderboardEntry {
  rank: number;
  studentProfileId: string;
  name: string;
  avatarUrl: string | null;
  totalXp: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  averageScore: number;
  isCurrentUser: boolean;
  // Only present on the monthly leaderboard — XP earned this calendar month.
  periodXp?: number;
}
export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  period?: "all-time" | "monthly";
  periodResetsAt?: string;
  requiresSubscription?: boolean;
}
export async function getLeaderboard(params?: {
  page?: number;
  limit?: number;
  currentProfileId?: string;
}): Promise<LeaderboardResult> {
  const { data } = await apiClient.get("/students/leaderboard", { params });
  return data;
}

// GET /students/leaderboard/monthly — subscriber-only incentive board,
// scoped to XP earned within the current calendar month. Resets
// automatically each month (computed live, not a stored counter).
export async function getMonthlyLeaderboard(params?: {
  page?: number;
  limit?: number;
  currentProfileId?: string;
}): Promise<LeaderboardResult> {
  const { data } = await apiClient.get("/students/leaderboard/monthly", { params });
  return data;
}
