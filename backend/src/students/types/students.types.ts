import { StudentProfile } from '../entities/student-profile.entity';
import { ExamSession } from '../entities/exam-session.entity';
import { WeakTopic } from '../entities/weak-topic.entity';

// ─── Overview / Dashboard ──────────────────────────────────────────────────────

export interface StudentOverview {
  profile: StudentProfile;
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
  recentSessions: ExamSession[];
  weakTopics: WeakTopic[];
  daysUntilExam: number | null;
}

// ─── Performance / Analytics ───────────────────────────────────────────────────

export interface StudentPerformance {
  overall: {
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
    accuracyRate: number;
    totalTimeSpentMinutes: number;
    streak: number;
    bestStreak: number;
    improvement: number; // % change vs previous period
  };
  subjectPerformance: {
    subject: string;
    score: number;
    averageScore: number; // platform average for comparison
    masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    questionsAttempted: number;
    correctAnswers: number;
    timeSpent: number; // minutes
    trend: number; // % change
  }[];
  topicMastery: {
    subject: string;
    topic: string;
    score: number;
    masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    questionsAttempted: number;
    improvement: number;
  }[];
  weeklyTrend: {
    week: string;
    score: number;
    questionsAttempted: number;
    minutesStudied: number;
  }[];
  examPerformance: {
    examType: string;
    examsTaken: number;
    bestScore: number;
    worstScore: number;
    averageScore: number;
    trend: number; // % change — 0 until historical snapshots are retained
    lastAttemptAt: string;
  }[];
  studyHeatmap: {
    date: string;
    count: number; // sessions that day
    minutesStudied: number;
  }[];
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

// ─── Streak info ───────────────────────────────────────────────────────────────

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date | null;
  shields: number;
  milestones: {
    day3: boolean;
    day7: boolean;
    day14: boolean;
    day30: boolean;
    day100: boolean;
  };
  todayComplete: boolean;
}

// ─── Leaderboard entry ─────────────────────────────────────────────────────────

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
  // Only populated for the monthly leaderboard — XP earned within the
  // current calendar month (vs totalXp, which is all-time).
  periodXp?: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  // Present for the monthly leaderboard — when the current month's
  // standings reset, and whether the requesting user even qualifies to
  // appear on it (has an active paid subscription).
  period?: 'all-time' | 'monthly';
  periodResetsAt?: Date;
  requiresSubscription?: boolean;
}
