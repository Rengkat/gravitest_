import { apiClient, API_BASE_URL, httpErrorFromResponse } from "./client";
import { useAuthStore } from "@/lib/store/authStore";

export type TutorDifficulty = "beginner" | "intermediate" | "advanced";
export type TutorResponseStyle = "detailed" | "concise" | "examples" | "socratic";

export interface AiConversationDto {
  id: string;
  title: string | null;
  subject: string | null;
  topic: string | null;
  examType: string | null;
  status: "active" | "completed" | "expired" | "flagged";
  messageCount: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessageDto {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface SendMessagePayload {
  conversationId?: string;
  message: string;
  subject?: string;
  difficulty?: TutorDifficulty;
  style?: TutorResponseStyle;
  pidgin?: boolean;
}

export async function sendTutorMessage(payload: SendMessagePayload) {
  const { data } = await apiClient.post<{ conversation: AiConversationDto; message: AiMessageDto }>(
    "/ai/tutor/messages",
    payload,
  );
  return data;
}

export interface StreamChunk {
  delta: string;
  done: boolean;
  conversationId?: string;
  error?: string;
  /** HTTP status of the failure (the stream itself is always HTTP 200). */
  errorStatus?: number;
  /** Structured body of a deliberate error, e.g. { code: "UPGRADE_REQUIRED", ... }. */
  errorBody?: unknown;
}

/**
 * Real SSE streaming — the backend writes `data: {...}\n\n` lines per
 * chunk (see AiTutorController.streamMessage). axios doesn't do SSE well,
 * so this uses fetch's ReadableStream directly, with the same bearer
 * token axios's interceptor would attach.
 */
export async function* streamTutorMessage(
  payload: SendMessagePayload,
  signal?: AbortSignal,
): AsyncGenerator<StreamChunk> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${API_BASE_URL}/ai/tutor/messages/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok || !res.body) {
    // Keep the server's message: for a paywalled/limited feature it is the
    // student-readable explanation ("AI Tutor is available on paid plans…").
    throw await httpErrorFromResponse(res, `Tutor stream failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr) continue;
      try {
        yield JSON.parse(jsonStr) as StreamChunk;
      } catch {
        // Malformed chunk — skip rather than crash the whole stream.
      }
    }
  }
}

export async function listTutorConversations() {
  const { data } = await apiClient.get<AiConversationDto[]>("/ai/tutor/conversations");
  return data;
}

export async function getTutorConversation(id: string) {
  const { data } = await apiClient.get<AiConversationDto & { messages: AiMessageDto[] }>(
    `/ai/tutor/conversations/${id}`,
  );
  return data;
}

export async function renameTutorConversation(id: string, title: string) {
  const { data } = await apiClient.patch<{ id: string; title: string }>(`/ai/tutor/conversations/${id}`, { title });
  return data;
}

export async function deleteTutorConversation(id: string) {
  const { data } = await apiClient.delete(`/ai/tutor/conversations/${id}`);
  return data;
}

export async function rateTutorConversation(id: string, rating: number, feedback?: string) {
  const { data } = await apiClient.post(`/ai/tutor/conversations/${id}/rate`, { rating, feedback });
  return data;
}

export async function flagTutorConversation(id: string, reason: string) {
  const { data } = await apiClient.post(`/ai/tutor/conversations/${id}/flag`, { reason });
  return data;
}
