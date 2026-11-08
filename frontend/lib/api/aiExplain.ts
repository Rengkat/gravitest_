import { isAxiosError } from "axios";
import { apiClient } from "./client";

export interface ExplainResult {
  explanation: string;
  cached: boolean;
  /** How many question images Sabi actually looked at. */
  usedImages?: number;
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

/* ─── Failure classification ───────────────────────────────────────────── */

export interface ExplainFailure {
  /** Stable server code, e.g. attempt_first, exam_in_progress, image_unreachable, ai_unavailable. */
  code: string | null;
  /** Always safe to show a student: never a raw provider/stack message. */
  message: string;
  /** Whether trying the same request again can succeed. */
  retryable: boolean;
  /** The explanation is deliberately closed (not attempted yet / exam running) — not an error to "retry". */
  locked: boolean;
}

const GENERIC = "Sabi couldn't prepare this explanation just now. Your answer is saved — please try again.";

export function explainFailure(err: unknown): ExplainFailure {
  if (!isAxiosError(err)) return { code: null, message: GENERIC, retryable: true, locked: false };

  if (!err.response) {
    return { code: "network", message: "Couldn't reach Sabi. Check your connection and try again.", retryable: true, locked: false };
  }
  const status = err.response.status;
  const data = (err.response.data ?? {}) as { code?: string; message?: unknown; retryable?: boolean };
  const code = typeof data.code === "string" ? data.code : null;
  const locked = code === "attempt_first" || code === "exam_in_progress";
  const message = typeof data.message === "string" && data.message.trim() ? data.message : GENERIC;

  // Server errors without one of our codes may carry provider text — never show that.
  if (status >= 500 && !code) return { code, message: GENERIC, retryable: true, locked: false };

  return {
    code,
    message,
    retryable: locked ? false : typeof data.retryable === "boolean" ? data.retryable : status >= 500 || status === 429,
    locked,
  };
}
