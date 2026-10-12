import { ExamType, UserRole } from 'src/common/enums/enums';

export interface LeaderboardRow {
  rank: number;
  studentProfileId: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  category: UserRole;
  examTargets: ExamType[];
  xpEarned: number;
  streak: number;
  performance: number;
  consistency: number;
  score: number;
  qualifiesForIncentive: boolean;
  isCurrentUser?: boolean;
  /** Is this entry actually on the public leaderboard? */
  isEligible: boolean;
  /**
   * Only present on admin lists that include ineligible entries: what is still
   * missing, e.g. ['Needs an active paid subscription', '1 of 3 sessions'].
   */
  ineligibleReasons?: string[];
}

/** What a student still needs to appear on the leaderboard. */
export interface EligibilityProgress {
  /** The admin has made the leaderboard subscribers-only. */
  subscribersOnly: boolean;
  /** Has an active PAID plan (the free plan does not count). */
  isSubscriber: boolean;
  sessions: { have: number; need: number };
  questions: { have: number; need: number };
  /** Everything that is still missing, in plain English. Empty when eligible. */
  missing: string[];
}

export interface LeaderboardListResult {
  period: string;
  isFinalized: boolean;
  scope: string;
  category: UserRole | null;
  examType: ExamType | null;
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
    examType: { examType: ExamType; rank: number | null }[];
  };
  totals: {
    general: number;
    category: number;
  };
  eligibility: EligibilityProgress;
}

export interface LeaderboardPeriodSummary {
  period: string;
  isFinalized: boolean;
  finalizedAt: Date | null;
  eligibleCount: number;
  totalCount: number;
}
