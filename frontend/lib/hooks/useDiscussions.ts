"use client";

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { extractErrorMessage } from "@/lib/api/client";
import {
  createContribution, deleteContribution, listContributions, listReplies, reportContribution, setReaction, updateContribution,
  type Contribution, type CreateInput, type DiscussionLock, type DiscussionSort, type MyReaction, type Page, type ReportReason, type ThreadRef,
} from "@/lib/api/discussions";

export const discussionKeys = {
  all: ["discussion"] as const,
  thread: (ref: ThreadRef, sort: DiscussionSort) => ["discussion", "thread", ref.questionId, ref.partId ?? "", sort] as const,
  threadAny: (ref: ThreadRef) => ["discussion", "thread", ref.questionId, ref.partId ?? ""] as const,
  replies: (parentId: string) => ["discussion", "replies", parentId] as const,
};

type Pages = InfiniteData<Page<Contribution>, number>;

/** The stable code the server sends when this discussion is closed to the caller, if it did. */
export function discussionLockCode(error: unknown): DiscussionLock | null {
  if (!isAxiosError(error) || error.response?.status !== 403) return null;
  const code = (error.response.data as { code?: string } | undefined)?.code;
  return code === "exam_in_progress" || code === "discussion_locked" ? code : null;
}

/** Top-level contributions of one question/part, paginated ("Load more"). */
export function useThread(ref: ThreadRef, sort: DiscussionSort, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: discussionKeys.thread(ref, sort),
    queryFn: ({ pageParam }) => listContributions(ref, { page: pageParam, sort }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled,
    staleTime: 15_000,
    // A locked discussion won't unlock by retrying.
    retry: (count, err) => !discussionLockCode(err) && count < 2,
  });
}

/** Replies are fetched only when a thread is expanded — never for the whole assessment. */
export function useReplies(parentId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: discussionKeys.replies(parentId),
    queryFn: ({ pageParam }) => listReplies(parentId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled,
    staleTime: 15_000,
  });
}

/** Apply a change to one contribution wherever it is cached (thread pages and reply lists). */
function patchEverywhere(qc: QueryClient, id: string, patch: (c: Contribution) => Contribution) {
  qc.setQueriesData<Pages>({ queryKey: discussionKeys.all }, (old) =>
    old
      ? { ...old, pages: old.pages.map((p) => ({ ...p, data: p.data.map((c) => (c.id === id ? patch(c) : c)) })) }
      : old,
  );
}

/** What a like/dislike click should do given the current reaction, and the resulting counts. */
export function applyReaction(c: Pick<Contribution, "likeCount" | "dislikeCount" | "myReaction">, next: MyReaction) {
  const old = c.myReaction;
  return {
    myReaction: next,
    likeCount: Math.max(0, c.likeCount + (next === 1 ? 1 : 0) - (old === 1 ? 1 : 0)),
    dislikeCount: Math.max(0, c.dislikeCount + (next === -1 ? 1 : 0) - (old === -1 ? 1 : 0)),
  };
}

export function useDiscussionActions(ref: ThreadRef, handlers: { onError: (message: string) => void }) {
  const qc = useQueryClient();
  const refresh = (parentId?: string | null) => {
    void qc.invalidateQueries({ queryKey: discussionKeys.threadAny(ref) });
    if (parentId) void qc.invalidateQueries({ queryKey: discussionKeys.replies(parentId) });
  };

  const create = useMutation({
    mutationFn: (input: Omit<CreateInput, "questionId" | "partId">) => createContribution({ ...ref, ...input }),
    onSuccess: (created) => refresh(created.parentId),
    onError: (e) => handlers.onError(extractErrorMessage(e)),
  });

  const edit = useMutation({
    mutationFn: (v: { id: string; content: string; imageUrls?: string[] }) => updateContribution(v.id, { content: v.content, imageUrls: v.imageUrls }),
    onSuccess: (updated) => patchEverywhere(qc, updated.id, () => updated),
    onError: (e) => handlers.onError(extractErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (v: { id: string; parentId: string | null }) => deleteContribution(v.id),
    onSuccess: (_r, v) => refresh(v.parentId),
    onError: (e) => handlers.onError(extractErrorMessage(e)),
  });

  const react = useMutation({
    mutationFn: (v: { id: string; value: MyReaction }) => setReaction(v.id, v.value),
    // Optimistic: counts move instantly; the server's authoritative counts replace them on success.
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: discussionKeys.all });
      const snapshot = qc.getQueriesData<Pages>({ queryKey: discussionKeys.all });
      patchEverywhere(qc, v.id, (c) => ({ ...c, ...applyReaction(c, v.value) }));
      return { snapshot };
    },
    onSuccess: (server) =>
      patchEverywhere(qc, server.id, (c) => ({
        ...c, likeCount: server.likeCount, dislikeCount: server.dislikeCount, myReaction: server.myReaction,
      })),
    onError: (e, _v, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      handlers.onError(extractErrorMessage(e));
    },
  });

  const report = useMutation({
    mutationFn: (v: { id: string; reason: ReportReason; details?: string }) => reportContribution(v.id, v.reason, v.details),
    onError: (e) => handlers.onError(extractErrorMessage(e)),
  });

  return { create, edit, remove, react, report };
}
