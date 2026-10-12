export type TimeRange = "week" | "month" | "3months" | "year" | "all";
export type ExamType = "all" | "jamb" | "waec" | "neco" | "nabteb" | "professional";
export type Subject =
  | "all"
  | "mathematics"
  | "english"
  | "physics"
  | "chemistry"
  | "biology"
  | "economics"
  | "government"
  | "literature";

export interface TopicPerformance {
  topic: string;
  score: number;
  questionsAttempted: number;
  masteryLevel: string;
  improvement: number;
}

export interface PerformanceData {
  overall: {
    averageScore: number;
    totalExams: number;
    totalQuestions: number;
    correctAnswers: number;
    totalTimeSpent: number;
    improvement: number;
    rank: number;
    percentile: number;
    streak: number;
    bestStreak: number;
  };
  subjectPerformance: {
    subject: string;
    score: number;
    averageScore: number;
    questionsAttempted: number;
    correctAnswers: number;
    timeSpent: number;
    trend: number;
    masteryLevel: "beginner" | "intermediate" | "advanced" | "expert";
    topics: TopicPerformance[];
  }[];
  examPerformance: {
    examType: string;
    averageScore: number;
    examsTaken: number;
    bestScore: number;
    worstScore: number;
    trend: number;
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
  weeklyTrend: {
    week: string;
    score: number;
    exams: number;
    averageTime: number;
  }[];
  topicMastery: TopicPerformance[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  leaderboard: {
    rank: number;
    name: string;
    score: number;
    exams: number;
    badge: string;
    isCurrentUser?: boolean;
  }[];
  goals: {
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
    deadline: string;
    completed: boolean;
  }[];
  studyHeatmap: {
    date: string;
    count: number;
  }[];
}
