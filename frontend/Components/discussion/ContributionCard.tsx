"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Flag, Loader2, Pencil, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import Avatar from "./Avatar";
import Composer from "./Composer";
import { useDiscussionCtx } from "./DiscussionContext";
import { absoluteTime, relativeTime } from "@/lib/discussion/relativeTime";
import { useReplies } from "@/lib/hooks/useDiscussions";
import type { Contribution, MyReaction, ReportReason } from "@/lib/api/discussions";

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "abusive", label: "Abusive or disrespectful" },
  { value: "spam", label: "Spam or advertising" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "wrong_info", label: "Misleading or wrong information" },
  { value: "off_topic", label: "Not about this question" },
  { value: "other", label: "Something else" },
];

const pill =
  "inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700";
const textBtn =
  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-gray-800 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700";

interface Props {
  c: Contribution;
  /** Replies render flat inside their parent; a reply has no reply list of its own. */
  isReply?: boolean;
  /** For replies: ask the parent card to open its reply box aimed at this one. */
  onReplyTo?: (target: Contribution) => void;
}

export default function ContributionCard({ c, isReply = false, onReplyTo }: Props) {
  const { announce, actions } = useDiscussionCtx();
  const uid = useId();
  const nameId = `${uid}-name`;
  const repliesId = `${uid}-replies`;

  const [expanded, setExpanded] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Contribution | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("abusive");
  const [reportDetails, setReportDetails] = useState("");

  const removed = c.state !== "visible";
  const name = c.author?.displayName ?? "A student";
  const when = relativeTime(c.createdAt);

  const replies = useReplies(c.id, !isReply && expanded);
  const replyList = useMemo(() => replies.data?.pages.flatMap((p) => p.data) ?? [], [replies.data]);

  function react(value: 1 | -1) {
    const next: MyReaction = c.myReaction === value ? 0 : value;
    actions.react.mutate(
      { id: c.id, value: next },
      {
        onSuccess: (s) => {
          const msg =
            next === 0 ? "Reaction removed." : next === 1 ? "You liked this contribution." : "You disliked this contribution.";
          announce(`${msg} ${s.likeCount} ${s.likeCount === 1 ? "like" : "likes"}, ${s.dislikeCount} ${s.dislikeCount === 1 ? "dislike" : "dislikes"}.`);
        },
      },
    );
  }

  function startReply() {
    if (isReply) onReplyTo?.(c);
    else { setExpanded(true); setReplyTarget(c); }
  }

  const reactDisabled = removed || c.isMine || actions.react.isPending;
  const reactHint = c.isMine ? "You can't react to your own contribution" : undefined;

  return (
    <article
      aria-labelledby={nameId}
      className={isReply ? "rounded-xl bg-gray-50 p-3.5" : "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"}>
      <header className="flex items-center gap-3">
        <Avatar url={removed ? null : c.author?.avatarUrl} size={isReply ? 32 : 44} />
        <div className="min-w-0">
          <p id={nameId} className="truncate text-[15px] font-bold text-gray-900">
            {removed ? "Removed contribution" : name}
            {c.isMine && !removed && <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-900">You</span>}
          </p>
          <p className="text-[12px] text-gray-700">
            <time dateTime={c.createdAt} title={absoluteTime(c.createdAt)}>{when}</time>
            {c.edited && !removed && <span> · edited</span>}
            {isReply && c.replyToName && <span> · replying to {c.replyToName}</span>}
          </p>
        </div>
      </header>

      <div className="mt-3">
        {editing && !removed ? (
          <Composer
            label={`Edit your contribution`}
            submitLabel="Save changes"
            initialContent={c.content ?? ""}
            initialImages={c.imageUrls}
            compact
            autoFocus
            onCancel={() => setEditing(false)}
            onSubmit={async (v) => {
              await actions.edit.mutateAsync({ id: c.id, content: v.content, imageUrls: v.imageUrls });
              setEditing(false);
              announce("Your contribution was updated.");
            }}
          />
        ) : removed ? (
          <p className="text-[14px] italic text-gray-700">
            {c.state === "hidden" ? "This contribution was hidden by a moderator." : "This contribution was deleted."}
          </p>
        ) : (
          <>
            {c.content && <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-gray-800">{c.content}</p>}
            {c.imageUrls.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {c.imageUrls.map((url, i) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open image ${i + 1} from ${name} in a new tab`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Image ${i + 1} shared by ${name}`} loading="lazy" className="max-h-48 max-w-full rounded-lg border border-gray-200 object-contain" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {!removed && !editing && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => react(1)}
            disabled={reactDisabled}
            aria-pressed={c.myReaction === 1}
            aria-label={`Like, ${c.likeCount} ${c.likeCount === 1 ? "like" : "likes"}`}
            title={reactHint}
            className={`${pill} ${c.myReaction === 1 ? "!border-green-700 !bg-green-50 text-green-900" : ""}`}>
            <ThumbsUp size={16} aria-hidden="true" /> <span aria-hidden="true">{c.likeCount}</span>
          </button>
          <button
            type="button"
            onClick={() => react(-1)}
            disabled={reactDisabled}
            aria-pressed={c.myReaction === -1}
            aria-label={`Dislike, ${c.dislikeCount} ${c.dislikeCount === 1 ? "dislike" : "dislikes"}`}
            title={reactHint}
            className={`${pill} ${c.myReaction === -1 ? "!border-red-700 !bg-red-50 text-red-900" : ""}`}>
            <ThumbsDown size={16} aria-hidden="true" className="text-red-700" /> <span aria-hidden="true">{c.dislikeCount}</span>
          </button>
          <button type="button" onClick={startReply} aria-label={`Reply to ${name}`} className={pill}>
            Reply
          </button>

          {c.isMine ? (
            <>
              <button type="button" onClick={() => setEditing(true)} className={textBtn} aria-label={`Edit your contribution`}>
                <Pencil size={13} aria-hidden="true" /> Edit
              </button>
              <button type="button" onClick={() => setConfirmingDelete(true)} className={textBtn} aria-label="Delete your contribution">
                <Trash2 size={13} aria-hidden="true" /> Delete
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setReporting((v) => !v)} aria-expanded={reporting} className={textBtn} aria-label={`Report ${name}'s contribution`}>
              <Flag size={13} aria-hidden="true" /> Report
            </button>
          )}
        </div>
      )}

      {confirmingDelete && (
        <div role="group" aria-label="Confirm delete" className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="flex-1 text-[13px] font-semibold text-red-900">Delete this contribution? Replies to it will stay.</p>
          <button
            type="button"
            autoFocus
            onClick={() => setConfirmingDelete(false)}
            className="rounded-full px-4 py-2 text-[13px] font-semibold text-gray-900 hover:bg-white focus-visible:ring-2 focus-visible:ring-green-600">
            Keep it
          </button>
          <button
            type="button"
            disabled={actions.remove.isPending}
            onClick={() =>
              actions.remove.mutate(
                { id: c.id, parentId: c.parentId },
                { onSuccess: () => { setConfirmingDelete(false); announce("Your contribution was deleted."); } },
              )
            }
            className="inline-flex items-center gap-1.5 rounded-full bg-red-700 px-4 py-2 text-[13px] font-bold text-white hover:bg-red-800 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">
            {actions.remove.isPending && <Loader2 size={13} className="animate-spin" aria-hidden="true" />} Delete
          </button>
        </div>
      )}

      {reporting && !removed && (
        <form
          aria-label={`Report ${name}'s contribution`}
          className="mt-3 space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            actions.report.mutate(
              { id: c.id, reason: reportReason, details: reportDetails.trim() || undefined },
              {
                onSuccess: (r) => {
                  setReporting(false);
                  setReportDetails("");
                  announce(r.alreadyReported ? "You already reported this contribution." : "Report sent. Thank you — a moderator will review it.");
                },
              },
            );
          }}>
          <div>
            <label htmlFor={`${uid}-reason`} className="mb-1 block text-[12px] font-bold text-gray-900">Why are you reporting this?</label>
            <select
              id={`${uid}-reason`}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as ReportReason)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-900 focus-visible:ring-2 focus-visible:ring-green-600">
              {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${uid}-details`} className="mb-1 block text-[12px] font-bold text-gray-900">More detail (optional)</label>
            <textarea
              id={`${uid}-details`}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-900 focus-visible:ring-2 focus-visible:ring-green-600"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={actions.report.isPending} className="rounded-full bg-red-700 px-4 py-2 text-[13px] font-bold text-white hover:bg-red-800 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">
              Send report
            </button>
            <button type="button" onClick={() => setReporting(false)} className="rounded-full px-4 py-2 text-[13px] font-semibold text-gray-900 hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-green-600">
              Cancel
            </button>
          </div>
        </form>
      )}

      {!isReply && (c.replyCount > 0 || expanded) && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={repliesId}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-bold text-green-900 hover:bg-green-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700">
            {expanded ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
            {expanded ? "Hide replies" : `${c.replyCount} ${c.replyCount === 1 ? "reply" : "replies"}`}
            {expanded && <span className="sr-only"> ({c.replyCount})</span>}
          </button>
        </div>
      )}

      {!isReply && (
        <div id={repliesId} hidden={!expanded} className="mt-2 border-l-2 border-gray-100 pl-3 sm:pl-4">
          {expanded && (
            <>
              {replies.isLoading && <p role="status" className="py-2 text-[13px] text-gray-700">Loading replies…</p>}
              {replies.isError && (
                <p role="alert" className="py-2 text-[13px] text-red-800">
                  Couldn’t load replies. <button type="button" className="underline" onClick={() => void replies.refetch()}>Try again</button>
                </p>
              )}
              <ul className="space-y-2" aria-label={`Replies to ${name}`}>
                {replyList.map((r) => (
                  <li key={r.id}>
                    <ContributionCard c={r} isReply onReplyTo={(t) => setReplyTarget(t)} />
                  </li>
                ))}
              </ul>
              {replies.hasNextPage && (
                <button
                  type="button"
                  onClick={() => void replies.fetchNextPage()}
                  disabled={replies.isFetchingNextPage}
                  className={`${textBtn} mt-2`}>
                  {replies.isFetchingNextPage ? "Loading…" : "Show more replies"}
                </button>
              )}
              {replyTarget && (
                <div className="mt-3">
                  <p className="mb-1 text-[12px] font-semibold text-gray-800">
                    Replying to {replyTarget.author?.displayName ?? "this contribution"}
                  </p>
                  <Composer
                    label={`Write your reply to ${replyTarget.author?.displayName ?? "this contribution"}`}
                    placeholder="Write a reply…"
                    submitLabel="Post reply"
                    compact
                    autoFocus
                    onCancel={() => setReplyTarget(null)}
                    onSubmit={async (v) => {
                      await actions.create.mutateAsync({ ...v, parentId: replyTarget.id });
                      setReplyTarget(null);
                      announce(`Your reply to ${replyTarget.author?.displayName ?? "the contribution"} was posted.`);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}
