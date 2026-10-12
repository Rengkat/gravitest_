import { apiClient } from "./client";

export interface ScoreEssayPayload {
  questionId?: string;
  questionText: string;
  studentAnswer: string;
  modelAnswer?: string;
  diagramImageUrls?: string[];
  maxScore: number;
  mode: "practice" | "exam";
}

export interface AiEssayScoreDto {
  id: string;
  aiScore: number;
  maxScore: number;
  aiFeedback: string;
  strengths: string[];
  improvements: string[];
  confidence: number;
  detailedFeedback?: string | null;
}

/** Free-tier note: this consumes one of the small daily AI-call allowance (see backend AiRateLimitService) — a 429 here means that cap was hit. */
export async function scoreEssayNow(payload: ScoreEssayPayload) {
  const { data } = await apiClient.post<AiEssayScoreDto>("/ai/scoring/essay", payload);
  return data;
}

// A deeper, quote-referenced breakdown of an existing score — generated
// once and cached server-side, so calling this again just returns the
// same cached result instead of spending another AI call.
export async function elaborateEssayScore(scoreId: string) {
  const { data } = await apiClient.post<AiEssayScoreDto>(`/ai/scoring/${scoreId}/elaborate`);
  return data;
}
