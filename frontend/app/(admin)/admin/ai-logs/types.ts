export type AIModel =
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gpt-3.5-turbo"
  | "claude-3.5-sonnet"
  | "claude-3-opus"
  | "gemini-1.5-pro"
  | "gemini-1.5-flash"
  | "deepseek-v3"
  | "mistral-large";

export type AIFeature =
  | "sabi_tutor"
  | "sabi_explain"
  | "sabi_solve"
  | "sabi_quiz"
  | "sabi_essay"
  | "sabi_translate"
  | "practice_scoring"
  | "exam_grading"
  | "feedback_generation";

export type AISessionStatus = "active" | "completed" | "expired" | "flagged";

export interface AIConversation {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: "student" | "admin";
  feature: AIFeature;
  model: AIModel;
  subject?: string;
  topic?: string;
  examType?: string;
  startTime: string;
  endTime?: string;
  lastActivity: string;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
  status: AISessionStatus;
  isFlagged: boolean;
  flagReason?: string;
  userRating?: number;
  userFeedback?: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  tokens?: number;
  cost?: number;
  responseTime?: number;
  metadata?: Record<string, any>;
}

export interface PracticeQuestionScore {
  id: string;
  questionId: string;
  questionText: string;
  studentId: string;
  studentName: string;
  studentAnswer: string;
  correctAnswer?: string;
  aiScore: number; // 0-100
  aiFeedback: string;
  confidence: number; // 0-1
  suggestedImprovements: string[];
  scoringCriteria: ScoringCriteria[];
  gradedAt: string;
  reviewedBy?: string;
  reviewedScore?: number;
  reviewNotes?: string;
}

export interface ScoringCriteria {
  criterion: string;
  maxPoints: number;
  awardedPoints: number;
  feedback: string;
}

export interface ReviewAdjustment {
  questionId: string;
  originalScore: number;
  adjustedScore: number;
  reason: string;
}

export interface AICostStats {
  dailyCost: { date: string; cost: number; tokens: number }[];
  monthlyCost: number;
  projectedMonthlyCost: number;
  budgetLimit: number;
  costByFeature: { feature: string; cost: number; percentage: number }[];
  costByModel: { model: string; cost: number; tokens: number }[];
  costByUser: { userId: string; userName: string; cost: number; requests: number }[];
}

export interface AIPerformanceStats {
  avgResponseTime: number;
  p95ResponseTime: number;
  successRate: number;
  errorRate: number;
  rateLimitHits: number;
  cacheHitRate: number;
  tokensPerSecond: number;
  concurrentSessions: number;
}

export interface ScoringAnalytics {
  totalQuestionsGraded: number;
  averageScore: number;
  scoreDistribution: { range: string; count: number }[];
  confidenceDistribution: { range: string; count: number }[];
  subjectPerformance: { subject: string; avgScore: number; questionCount: number }[];
  teacherReviewRate: number;
  reviewDiscrepancy: number; // average difference between AI and teacher scores
}

export interface RateLimitConfig {
  tier: "free" | "basic" | "pro" | "enterprise";
  requestsPerDay: number;
  requestsPerHour: number;
  tokensPerMinute: number;
  concurrentSessions: number;
}

export interface SystemPromptConfig {
  id: string;
  name: string;
  prompt: string;
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
