import type { AIConversation, AIMessage, AIFeature, AIModel } from "../types";

// ─── Extended detail shape used by the conversation detail page ──────────────

export interface AISessionDetail extends AIConversation {
  messages: AIMessage[];
}

// ─── Feature display config ───────────────────────────────────────────────────

export const FEATURE_LABELS: Record<AIFeature, string> = {
  sabi_tutor: "Sabi Tutor",
  sabi_explain: "Sabi Explain",
  sabi_solve: "Sabi Solve",
  sabi_quiz: "Sabi Quiz",
  sabi_essay: "Sabi Essay",
  sabi_translate: "Sabi Translate",
  practice_scoring: "Practice Scoring",
  exam_grading: "Exam Grading",
  feedback_generation: "Feedback Generation",
};

export const FEATURE_COLORS: Record<AIFeature, { color: string; bg: string }> = {
  sabi_tutor: { color: "#2e8b57", bg: "#2e8b5715" },
  sabi_explain: { color: "#3b82f6", bg: "#3b82f615" },
  sabi_solve: { color: "#8b5cf6", bg: "#8b5cf615" },
  sabi_quiz: { color: "#f59e0b", bg: "#f59e0b15" },
  sabi_essay: { color: "#ec4899", bg: "#ec489915" },
  sabi_translate: { color: "#0891b2", bg: "#0891b215" },
  practice_scoring: { color: "#10b981", bg: "#10b98115" },
  exam_grading: { color: "#f97316", bg: "#f9731615" },
  feedback_generation: { color: "#6366f1", bg: "#6366f115" },
};

// ─── Model display config ─────────────────────────────────────────────────────

export const MODEL_LABELS: Record<AIModel, string> = {
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-3.5-turbo": "GPT-3.5 Turbo",
  "claude-3.5-sonnet": "Claude 3.5 Sonnet",
  "claude-3-opus": "Claude 3 Opus",
  "gemini-1.5-pro": "Gemini 1.5 Pro",
  "gemini-1.5-flash": "Gemini 1.5 Flash",
  "deepseek-v3": "DeepSeek V3",
  "mistral-large": "Mistral Large",
};

export const MODEL_PROVIDERS: Record<AIModel, string> = {
  "gpt-4o": "OpenAI",
  "gpt-4o-mini": "OpenAI",
  "gpt-3.5-turbo": "OpenAI",
  "claude-3.5-sonnet": "Anthropic",
  "claude-3-opus": "Anthropic",
  "gemini-1.5-pro": "Google",
  "gemini-1.5-flash": "Google",
  "deepseek-v3": "DeepSeek",
  "mistral-large": "Mistral AI",
};

// ─── Status display config — matches AISessionStatus exactly ─────────────────

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#3b82f6", bg: "#3b82f615" },
  completed: { label: "Completed", color: "#10b981", bg: "#10b98115" },
  expired: { label: "Expired", color: "#6b7280", bg: "#6b728015" },
  flagged: { label: "Flagged", color: "#ef4444", bg: "#ef444415" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatTokens(rawTokens: number | string): string {
  const tokens = Number(rawTokens) || 0;
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return `${tokens}`;
}

export function formatCost(rawCost: number | string | null | undefined): string {
  const cost = Number(rawCost) || 0;
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}

export function formatDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const diff = Math.max(0, Math.floor((end - start) / 1000));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
