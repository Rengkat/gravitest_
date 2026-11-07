"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Lock, Loader2, MessageSquare, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import Composer from "./Composer";
import ContributionCard from "./ContributionCard";
import { DiscussionProvider } from "./DiscussionContext";
import { discussionLockCode, useDiscussionActions, useThread } from "@/lib/hooks/useDiscussions";
import type { DiscussionSort } from "@/lib/api/discussions";

export interface QuestionDiscussionProps {
  /** The underlying question's id — never a session position or display number. */
  questionId?: string | null;
  /** Permanent id of the sub-question; omit for the question's own thread. */
  partId?: string | null;
  /**
   * Whether this screen may show discussions at all (practice after the correction is revealed, or results after
   * an exam). When false NOTHING is rendered and NOTHING is requested. The server independently enforces the same
   * rule, so this is a convenience, not the security boundary.
   */
  enabled?: boolean;
  /** Short label used in the heading/announcements, e.g. "Question 1(a)". */
  label?: string;
}

/**
 * The discussion under ONE question (or one sub-question). Independent of the
 * explanation / AI-explain UI: it owns its own data, so opening, closing or
 * re-running an AI explanation can never reset or hide it.
 */
export default function QuestionDiscussion({ questionId, partId = null, enabled = true, label }: QuestionDiscussionProps) {
  const uid = useId();
  const [sort, setSort] = useState<DiscussionSort>("newest");
  const [message, setMessage] = useState("");
  const composerRegion = useRef<HTMLDivElement>(null);
  const active = enabled && !!questionId;
  const thread = useMemo(() => ({ questionId: questionId ?? "", partId }), [questionId, partId]);

  // Politely announced to screen readers; cleared shortly after so the same text can be announced again.
  const announce = useCallback((m: string) => {
    setMessage("");
    window.setTimeout(() => setMessage(m), 40);
  }, []);
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(""), 6000);
    return () => window.clearTimeout(t);
  }, [message]);

  const query = useThread(thread, sort, active);
  const actions = useDiscussionActions(thread, {
    onError: (m) => { announce(`Error: ${m}`); toast.error(m); },
  });

  if (!active) return null;

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];
  const count = query.data?.pages[0]?.meta.discussionCount ?? 0;
  const lock = query.isError ? discussionLockCode(query.error) : null;
  const headingId = `${uid}-h`;
  const what = label ? `${label} discussions` : "Discussions";

  return (
    <section aria-labelledby={headingId} className="mt-5 rounded-2xl border border-gray-200 bg-gray-50/60 p-4 sm:p-6" data-testid="question-discussion">
      {/* Polite live region for new contributions, reactions and errors */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{message}</div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h4 id={headingId} className="flex items-center gap-2 text-[18px] font-extrabold text-gray-900">
          <MessageSquare size={18} aria-hidden="true" />
          {label ? `${label} — ` : ""}Discussions{query.data && !lock ? ` (${count})` : ""}
        </h4>
        {!lock && (
          <>
            <button
              type="button"
              onClick={() => { void query.refetch(); announce("Refreshing discussion."); }}
              disabled={query.isFetching}
              aria-label={`Refresh ${what.toLowerCase()}`}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-800 hover:bg-gray-200 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700">
              <RefreshCw size={17} className={query.isFetching ? "animate-spin" : ""} aria-hidden="true" />
            </button>
            <div className="ml-auto flex items-center gap-2">
              <label htmlFor={`${uid}-sort`} className="text-[12px] font-semibold text-gray-800">Sort by</label>
              <select
                id={`${uid}-sort`}
                value={sort}
                onChange={(e) => { setSort(e.target.value as DiscussionSort); announce(`Sorted by ${e.target.value === "top" ? "most helpful" : "newest"}.`); }}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-[13px] text-gray-900 focus-visible:ring-2 focus-visible:ring-green-600">
                <option value="newest">Newest</option>
                <option value="top">Most helpful</option>
              </select>
            </div>
          </>
        )}
      </div>

      {lock ? (
        <p role="note" className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white p-4 text-[13px] text-gray-800">
          <Lock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {lock === "exam_in_progress"
            ? "Discussions are closed while an exam is in progress. They open again once you submit and your results are released."
            : "This discussion opens once you have attempted the question and its correction is available."}
        </p>
      ) : query.isLoading ? (
        <p role="status" className="flex items-center gap-2 py-6 text-[14px] text-gray-800">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading discussion…
        </p>
      ) : query.isError ? (
        <p role="alert" className="py-4 text-[14px] text-red-800">
          We couldn’t load this discussion.{" "}
          <button type="button" className="font-bold underline" onClick={() => void query.refetch()}>Try again</button>
        </p>
      ) : (
        <DiscussionProvider value={{ thread, announce, actions }}>
          {/* Composer first in reading order so a keyboard/screen-reader user never has to wade through a long list to post. */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <div ref={composerRegion} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:order-2 lg:self-start">
              <h5 className="mb-3 text-[16px] font-extrabold text-gray-900">Post your contribution</h5>
              <p className="mb-3 text-[12px] text-gray-700">
                Ask a question, explain how you got your answer, or share another way to solve it. Be kind and stay on topic.
              </p>
              <Composer
                label={`Your contribution to ${what.toLowerCase()}`}
                submitLabel="Post contribution"
                onSubmit={async (v) => {
                  await actions.create.mutateAsync(v);
                  announce("Your contribution was posted.");
                }}
              />
            </div>

            <div className="min-w-0 lg:order-1">
              {items.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-[14px] text-gray-800">
                  No contributions yet. Be the first to share an idea or ask a question.
                </p>
              ) : (
                <ul className="space-y-4" aria-label={`${count} ${count === 1 ? "contribution" : "contributions"}`}>
                  {items.map((c) => (
                    <li key={c.id}>
                      <ContributionCard c={c} />
                    </li>
                  ))}
                </ul>
              )}
              {query.hasNextPage && (
                <button
                  type="button"
                  onClick={() => void query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                  className="mt-4 w-full rounded-full border border-gray-300 bg-white px-5 py-2.5 text-[13px] font-bold text-gray-900 hover:bg-gray-50 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">
                  {query.isFetchingNextPage ? "Loading…" : "Load more contributions"}
                </button>
              )}
            </div>
          </div>
        </DiscussionProvider>
      )}
    </section>
  );
}
