import { apiClient } from "./client";
import type { PaginatedResult } from "./notifications";

// ── Enums (must match src/common/enums/enums.ts exactly) ────────────────

export type AIFeature =
  | "sabi_tutor" | "sabi_explain" | "sabi_solve" | "sabi_quiz"
  | "sabi_essay" | "sabi_translate" | "practice_scoring" | "exam_grading" | "feedback_generation";

export type AIProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "deepseek"
  | "mistral"
  | "groq"
  | "openrouter"
  | "ollama";
export type AIConversationStatus = "active" | "completed" | "expired" | "flagged";
export type BackendSubscriptionTier = "free" | "basic" | "standard" | "premium" | "enterprise";

// ── Model registry ────────────────────────────────────────────────────────

export interface AiModelConfig {
  id: string;
  modelId: string;
  name: string;
  provider: AIProvider;
  description: string | null;
  costInputPerMillion: number;
  costOutputPerMillion: number;
  avgLatencyMs: number;
  isActive: boolean;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModelConfigPayload {
  modelId: string;
  name: string;
  provider: AIProvider;
  description?: string;
  costInputPerMillion: number;
  costOutputPerMillion: number;
  avgLatencyMs?: number;
  isActive?: boolean;
  tags?: string[];
}

export type UpdateModelConfigPayload = Partial<CreateModelConfigPayload>;

export async function listModels(): Promise<AiModelConfig[]> {
  const { data } = await apiClient.get("/ai/admin/models");
  return data;
}
export async function createModel(payload: CreateModelConfigPayload): Promise<AiModelConfig> {
  const { data } = await apiClient.post("/ai/admin/models", payload);
  return data;
}
export async function updateModel(id: string, payload: UpdateModelConfigPayload): Promise<AiModelConfig> {
  const { data } = await apiClient.patch(`/ai/admin/models/${id}`, payload);
  return data;
}
export async function deleteModel(id: string): Promise<{ id: string }> {
  const { data } = await apiClient.delete(`/ai/admin/models/${id}`);
  return data;
}

// ── Feature → model mappings ────────────────────────────────────────────

export interface AiFeatureModelMapping {
  id: string;
  feature: AIFeature;
  primaryModelId: string;
  fallbackModelId: string | null;
  isEnabled: boolean;
  maxTokens: number | null;
  temperature: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFeatureMappingPayload {
  primaryModelId: string;
  fallbackModelId?: string;
  isEnabled?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export async function listMappings(): Promise<AiFeatureModelMapping[]> {
  const { data } = await apiClient.get("/ai/admin/feature-mappings");
  return data;
}
export async function upsertMapping(
  feature: AIFeature,
  payload: UpdateFeatureMappingPayload,
): Promise<AiFeatureModelMapping> {
  const { data } = await apiClient.patch(`/ai/admin/feature-mappings/${feature}`, payload);
  return data;
}

// ── System prompts ───────────────────────────────────────────────────────

export interface AiSystemPrompt {
  id: string;
  name: string;
  feature: AIFeature;
  prompt: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export async function listPrompts(feature: AIFeature): Promise<AiSystemPrompt[]> {
  const { data } = await apiClient.get(`/ai/admin/prompts/${feature}`);
  return data;
}
export async function createPrompt(payload: {
  name: string;
  feature: AIFeature;
  prompt: string;
  activate?: boolean;
}): Promise<AiSystemPrompt> {
  const { data } = await apiClient.post("/ai/admin/prompts", payload);
  return data;
}
export async function activatePrompt(id: string): Promise<AiSystemPrompt> {
  const { data } = await apiClient.patch(`/ai/admin/prompts/${id}/activate`);
  return data;
}

// ── Rate limits ───────────────────────────────────────────────────────────

export interface AiRateLimitConfig {
  id: string;
  tier: BackendSubscriptionTier;
  requestsPerDay: number;
  requestsPerHour: number;
  tokensPerDay: number;
  concurrentSessions: number;
  updatedAt: string;
}

export interface UpdateRateLimitPayload {
  requestsPerDay?: number;
  requestsPerHour?: number;
  tokensPerDay?: number;
  concurrentSessions?: number;
}

export async function listRateLimits(): Promise<AiRateLimitConfig[]> {
  const { data } = await apiClient.get("/ai/admin/rate-limits");
  return data;
}
export async function updateRateLimits(
  tier: BackendSubscriptionTier,
  payload: UpdateRateLimitPayload,
): Promise<AiRateLimitConfig> {
  const { data } = await apiClient.patch(`/ai/admin/rate-limits/${tier}`, payload);
  return data;
}

// ── Conversations ─────────────────────────────────────────────────────────

export interface AiMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokensUsed: number | null;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  userId: string;
  feature: AIFeature;
  title: string | null;
  subject: string | null;
  topic: string | null;
  examType: string | null;
  lastModelId: string | null;
  status: AIConversationStatus;
  messageCount: number;
  totalTokens: number;
  totalCostUsd: number;
  isFlagged: boolean;
  flagReason: string | null;
  userRating: number | null;
  userFeedback: string | null;
  lastActivityAt: string | null;
  messages?: AiMessage[];
  createdAt: string;
  updatedAt: string;
}

export async function listConversations(filters: {
  feature?: AIFeature;
  flagged?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "lastActivityAt" | "totalCostUsd";
  sortOrder?: "ASC" | "DESC";
} = {}): Promise<PaginatedResult<AiConversation>> {
  const { data } = await apiClient.get("/ai/admin/conversations", { params: filters });
  return data;
}
export async function getConversation(id: string): Promise<AiConversation> {
  const { data } = await apiClient.get(`/ai/admin/conversations/${id}`);
  return data;
}
export async function unflagConversation(id: string): Promise<AiConversation> {
  const { data } = await apiClient.patch(`/ai/admin/conversations/${id}/unflag`);
  return data;
}

// ── Analytics ─────────────────────────────────────────────────────────────

export interface AiCostStats {
  totalCostUsd: number;
  costToday: number;
  costByFeature: Record<string, number>;
  costByModel: Record<string, number>;
  topUsersByCost: { userId: string; costUsd: number }[];
}

export interface AiPerformanceStats {
  totalRequests: number;
  successRate: number;
  avgResponseTimeMs: number;
  fallbackRate: number;
  errorsByModel: Record<string, number>;
}

export async function getCostStats(): Promise<AiCostStats> {
  const { data } = await apiClient.get("/ai/admin/analytics/cost");
  return data;
}
export async function getPerformanceStats(): Promise<AiPerformanceStats> {
  const { data } = await apiClient.get("/ai/admin/analytics/performance");
  return data;
}

// ── Practice/exam essay scoring review (matches PracticeQuestionScore) ───

export interface AiEssayScore {
  id: string;
  questionId: string | null;
  questionText: string | null;
  userId: string;
  feature: AIFeature;
  studentAnswer: string;
  modelAnswer: string | null;
  aiScore: number;
  maxScore: number;
  aiFeedback: string;
  strengths: string[];
  improvements: string[];
  confidence: number;
  scoringCriteria: {
    criterion: string;
    maxPoints: number;
    awardedPoints: number;
    feedback: string;
  }[];
  modelId: string | null;
  reviewedBy: string | null;
  reviewedScore: number | null;
  reviewNotes: string | null;
  gradedAt: string;
}

export interface ScoringAnalyticsResponse {
  totalQuestionsGraded: number;
  averageScorePct: number;
  scoreDistribution: { range: string; count: number }[];
  teacherReviewRate: number;
  reviewDiscrepancyAvg: number | null;
}

export async function listNeedsReview(): Promise<AiEssayScore[]> {
  const { data } = await apiClient.get("/ai/scoring/needs-review");
  return data;
}
export async function reviewScore(
  id: string,
  reviewedScore: number,
  reviewNotes?: string,
): Promise<AiEssayScore> {
  const { data } = await apiClient.patch(`/ai/scoring/${id}/review`, { reviewedScore, reviewNotes });
  return data;
}
export async function getScoringAnalytics(): Promise<ScoringAnalyticsResponse> {
  const { data } = await apiClient.get("/ai/scoring/analytics");
  return data;
}

export interface StudentInsightSubject {
  subject: string;
  avgScore: number;
  questionCount: number;
}

export interface StudentInsightResponse {
  studentId: string;
  subjects: StudentInsightSubject[];
  recentScores: AiEssayScore[];
}

export async function getStudentInsight(userId: string): Promise<StudentInsightResponse> {
  const { data } = await apiClient.get(`/ai/scoring/practice/students/${userId}`);
  return data;
}

export interface RubricCriterion {
  criterion: string;
  maxPoints: number;
  description?: string;
}

export interface AiRubric {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  examType: string | null;
  criteria: RubricCriterion[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRubricPayload {
  name: string;
  description?: string;
  subject?: string;
  examType?: string;
  criteria: RubricCriterion[];
}

export async function listRubrics(): Promise<AiRubric[]> {
  const { data } = await apiClient.get("/ai/admin/rubrics");
  return data;
}
export async function createRubric(payload: CreateRubricPayload): Promise<AiRubric> {
  const { data } = await apiClient.post("/ai/admin/rubrics", payload);
  return data;
}
export async function updateRubric(
  id: string,
  payload: Partial<CreateRubricPayload> & { isActive?: boolean },
): Promise<AiRubric> {
  const { data } = await apiClient.patch(`/ai/admin/rubrics/${id}`, payload);
  return data;
}
export async function deleteRubric(id: string): Promise<{ id: string }> {
  const { data } = await apiClient.delete(`/ai/admin/rubrics/${id}`);
  return data;
}

// ── Global AI settings ───────────────────────────────────────────────────
// Deliberately just the fields that have a real backend model — see
// AiSettings entity on the backend for why default model/temperature
// aren't duplicated here (they live per-feature in feature-mappings above).

export interface AiGlobalSettings {
  autoFlagThreshold: number;
  notifyOnFlagged: boolean;
  monthlyBudgetLimitUsd: number | null;
  notifyOnBudgetAlert: boolean;
  notifyEmail: string | null;
  retentionDays: number | null;
  updatedAt: string;
}

export async function getAiSettings(): Promise<AiGlobalSettings> {
  const { data } = await apiClient.get("/ai/admin/settings");
  return data;
}

export async function updateAiSettings(
  payload: Partial<Omit<AiGlobalSettings, "updatedAt">>,
): Promise<AiGlobalSettings> {
  const { data } = await apiClient.patch("/ai/admin/settings", payload);
  return data;
}
