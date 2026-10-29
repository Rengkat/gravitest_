import { apiClient } from "./client";

export interface ExplainResult {
  explanation: string;
  cached: boolean;
}

export type ExplainLevel = "standard" | "detailed";

export async function explainMcqQuestion(
  questionId: string,
  studentAnswerLabel?: string,
  detailLevel?: ExplainLevel,
) {
  const { data } = await apiClient.post<ExplainResult>("/ai/explain/mcq", {
    questionId,
    studentAnswerLabel,
    detailLevel,
  });
  return data;
}
