import { apiClient } from "./client";

export type ContributionState = "visible" | "hidden" | "deleted";
export type MyReaction = 1 | -1 | 0;

export interface Contribution {
  id: string;
  questionId: string;
  partId: string | null;
  parentId: string | null;
  replyToId: string | null;
  replyToName: string | null;
  author: { displayName: string; avatarUrl: string | null } | null;
  /** Null for removed/hidden contributions — shown as a placeholder so replies keep their context. */
  content: string | null;
  imageUrls: string[];
  likeCount: number;
  dislikeCount: number;
  replyCount: number;
  myReaction: MyReaction;
  state: ContributionState;
  isMine: boolean;
  edited: boolean;
  createdAt: string;
}

export interface Page<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number; discussionCount?: number };
}

export interface ThreadRef {
  questionId: string;
  /** Permanent sub-question id; omit for the question's own thread. */
  partId?: string | null;
}

export type DiscussionSort = "newest" | "top";

export type ReportReason = "spam" | "abusive" | "inappropriate" | "wrong_info" | "off_topic" | "other";

/** Stable codes the server sends when a discussion is closed to the caller. */
export type DiscussionLock = "discussion_locked" | "exam_in_progress";

export async function listContributions(
  ref: ThreadRef,
  params: { page: number; limit?: number; sort?: DiscussionSort },
): Promise<Page<Contribution>> {
  const { data } = await apiClient.get(`/discussions/questions/${ref.questionId}`, {
    params: { partId: ref.partId ?? undefined, page: params.page, limit: params.limit ?? 10, sort: params.sort ?? "newest" },
  });
  return data;
}

export async function listReplies(id: string, page: number): Promise<Page<Contribution>> {
  const { data } = await apiClient.get(`/discussions/contributions/${id}/replies`, { params: { page, limit: 10 } });
  return data;
}

export interface CreateInput extends ThreadRef {
  content: string;
  parentId?: string;
  imageUrls?: string[];
  clientToken: string;
}
export async function createContribution(input: CreateInput): Promise<Contribution> {
  const { data } = await apiClient.post("/discussions/contributions", {
    questionId: input.questionId,
    partId: input.partId ?? undefined,
    parentId: input.parentId,
    content: input.content,
    imageUrls: input.imageUrls?.length ? input.imageUrls : undefined,
    clientToken: input.clientToken,
  });
  return data;
}

export async function updateContribution(id: string, input: { content: string; imageUrls?: string[] }): Promise<Contribution> {
  const { data } = await apiClient.patch(`/discussions/contributions/${id}`, input);
  return data;
}

export async function deleteContribution(id: string): Promise<void> {
  await apiClient.delete(`/discussions/contributions/${id}`);
}

export async function setReaction(
  id: string,
  value: MyReaction,
): Promise<{ id: string; likeCount: number; dislikeCount: number; myReaction: MyReaction }> {
  const { data } = await apiClient.put(`/discussions/contributions/${id}/reaction`, { value });
  return data;
}

export async function reportContribution(id: string, reason: ReportReason, details?: string) {
  const { data } = await apiClient.post(`/discussions/contributions/${id}/report`, { reason, details: details || undefined });
  return data as { reported: true; alreadyReported: boolean };
}

export async function uploadDiscussionImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const { data } = await apiClient.post("/discussions/uploads", body, { headers: { "Content-Type": "multipart/form-data" } });
  return data.url as string;
}

/* ─── Admin moderation ─────────────────────────────────────────────────── */

export interface ReportedContribution {
  contributionId: string;
  questionId: string;
  partId: string | null;
  isReply: boolean;
  content: string;
  imageUrls: string[];
  status: ContributionState;
  moderationNote: string | null;
  author: { userId: string; displayName: string } | null;
  createdAt: string;
  reportCount: number;
  lastReportedAt: string;
  reports: { reason: ReportReason; details: string | null; createdAt: string }[];
}

export async function adminListReports(page: number, status: "open" | "actioned" | "dismissed"): Promise<Page<ReportedContribution>> {
  const { data } = await apiClient.get("/admin/discussions/reports", { params: { page, limit: 10, status } });
  return data;
}

export async function adminModerate(id: string, action: "hide" | "restore" | "delete", note?: string) {
  const { data } = await apiClient.post(`/admin/discussions/contributions/${id}/${action}`, { note: note || undefined });
  return data as { id: string; status: ContributionState };
}
