"use client";

import { createContext, useContext } from "react";
import type { ThreadRef } from "@/lib/api/discussions";
import type { useDiscussionActions } from "@/lib/hooks/useDiscussions";

export interface DiscussionCtx {
  thread: ThreadRef;
  /** Politely announce something to screen-reader users (new contribution, reaction saved, errors…). */
  announce: (message: string) => void;
  actions: ReturnType<typeof useDiscussionActions>;
}

const Ctx = createContext<DiscussionCtx | null>(null);
export const DiscussionProvider = Ctx.Provider;

export function useDiscussionCtx(): DiscussionCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDiscussionCtx must be used inside <QuestionDiscussion>");
  return v;
}
