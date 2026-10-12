"use client";

import { Star, ThumbsUp, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import type { LibraryContent, RatingEntry, RelatedItem } from "../types";
import { RichTextRenderer } from "@/Components/rich-text/RichTextRenderer";
import {
  CONTENT_CFG,
  SUBJECT_CFG,
  EXAM_LABELS,
  CLASS_LABELS,
  fmtDuration,
  fmtSize,
  fmtPrice,
} from "../config";

// ─── Shared star ─────────────────────────────────────────────────────────────

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={
            s <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          }
        />
      ))}
    </span>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────

export function AboutTab({ content }: { content: LibraryContent }) {
  const rows = [
    { label: "Type", value: CONTENT_CFG[content.contentType].label },
    ...(content.subject ? [{ label: "Subject", value: SUBJECT_CFG[content.subject].label }] : []),
    ...(content.topic ? [{ label: "Topic", value: content.topic }] : []),
    ...(content.author ? [{ label: "Author", value: content.author }] : []),
    ...(content.totalPages ? [{ label: "Pages", value: `${content.totalPages}` }] : []),
    ...(content.durationSeconds
      ? [{ label: "Duration", value: fmtDuration(content.durationSeconds) }]
      : []),
    ...(content.fileSizeBytes
      ? [{ label: "File Size", value: fmtSize(content.fileSizeBytes) }]
      : []),
    {
      label: "Published",
      value: new Date(content.createdAt).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
    { label: "Views", value: content.totalViews.toLocaleString() },
    { label: "Downloads", value: content.totalDownloads.toLocaleString() },
  ];

  return (
    <div className="space-y-5">
      {/* Description */}
      <div
        className="rounded-2xl bg-white border p-5"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
          Description
        </h2>
        {content.description ? (
          <RichTextRenderer html={content.description} className="!text-green-900" />
        ) : (
          <p className="text-[14px] text-green-900 leading-relaxed">No description provided.</p>
        )}
      </div>

      {/* Details grid */}
      <div
        className="rounded-2xl bg-white border p-5"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-4">
          Details
        </h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
          {rows.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                {label}
              </dt>
              <dd className="text-[13px] font-medium text-green-900 mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Exam + class chips */}
      {(content.examTypes.length > 0 || content.classLevels.length > 0) && (
        <div
          className="rounded-2xl bg-white border p-5"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          {content.examTypes.length > 0 && (
            <div className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                Exam Bodies
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {content.examTypes.map((e) => (
                  <span
                    key={e}
                    className="px-2.5 py-1 rounded-full bg-green-50 text-green-800 text-[11px] font-semibold">
                    {EXAM_LABELS[e] ?? e}
                  </span>
                ))}
              </div>
            </div>
          )}
          {content.classLevels.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                Class Levels
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {content.classLevels.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold">
                    {CLASS_LABELS[c] ?? c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Ratings ─────────────────────────────────────────────────────────────────

interface RatingsTabProps {
  content: LibraryContent;
  ratings: RatingEntry[];
  userRating: number;
  hoverRating: number;
  reviewText: string;
  submitting: boolean;
  done: boolean;
  hasAccess: boolean;
  onRate: (n: number) => void;
  onHover: (n: number) => void;
  onReview: (s: string) => void;
  onSubmit: () => void;
  onMarkHelpful?: (ratingId: string) => void;
}

export function RatingsTab({
  content,
  ratings,
  userRating,
  hoverRating,
  reviewText,
  submitting,
  done,
  hasAccess,
  onRate,
  onHover,
  onReview,
  onSubmit,
  onMarkHelpful,
}: RatingsTabProps) {
  const dist = [5, 4, 3, 2, 1].map((s) => ({
    s,
    count: ratings.filter((r) => r.rating === s).length,
    pct: ratings.length
      ? Math.round((ratings.filter((r) => r.rating === s).length / ratings.length) * 100)
      : 0,
  }));

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div
        className="rounded-2xl bg-white border p-5"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="flex gap-8 flex-wrap items-center">
          <div className="text-center">
            <div className="text-[48px] font-bold text-green-900 leading-none">
              {content.averageRating.toFixed(1)}
            </div>
            <Stars rating={content.averageRating} size={16} />
            <div className="text-[11px] text-text-muted mt-1">
              {(content.ratingCount ?? ratings.length).toLocaleString()} ratings
            </div>
          </div>
          <div className="flex-1 min-w-[160px] space-y-1.5">
            {dist.map(({ s, pct, count }) => (
              <div key={s} className="flex items-center gap-2 text-[12px]">
                <span className="text-text-muted w-3">{s}</span>
                <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-text-muted w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit form — only if user has access */}
      {hasAccess && !done && (
        <div
          className="rounded-2xl bg-white border p-5"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <h3 className="text-[13px] font-bold text-green-900 mb-3">Rate this content</h3>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => onRate(s)}
                onMouseEnter={() => onHover(s)}
                onMouseLeave={() => onHover(0)}
                className="p-1 transition-transform hover:scale-110"
                aria-label={`${s} stars`}>
                <Star
                  size={28}
                  className={
                    (hoverRating || userRating) >= s
                      ? "fill-amber-400 text-amber-400"
                      : "fill-gray-200 text-gray-200"
                  }
                />
              </button>
            ))}
          </div>
          <textarea
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[13px] text-green-900 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all"
            rows={3}
            value={reviewText}
            onChange={(e) => onReview(e.target.value)}
            placeholder="Share your thoughts (optional)…"
          />
          <button
            onClick={onSubmit}
            disabled={!userRating || submitting}
            className="mt-3 px-5 py-2.5 rounded-xl bg-green-800 text-white text-[13px] font-semibold hover:bg-green-700 transition-all disabled:opacity-40">
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </div>
      )}

      {/* Not-unlocked notice */}
      {!hasAccess && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex items-center gap-3 text-[13px] text-text-muted">
          <Lock size={14} className="shrink-0" />
          Unlock this content to leave a review.
        </div>
      )}

      {done && (
        <div className="rounded-2xl bg-green-50 border border-green-100 p-4 flex items-center gap-2 text-[13px] text-green-700">
          <CheckCircle2 size={16} /> Thank you for your review!
        </div>
      )}

      {/* Review list */}
      <div
        className="rounded-2xl bg-white border overflow-hidden"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        {ratings.map((r, i) => (
          <div
            key={r.id}
            className={`p-5 ${i < ratings.length - 1 ? "border-b" : ""}`}
            style={{ borderColor: "rgba(30,80,50,0.06)" }}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-green-800 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                {r.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[13px] font-semibold text-green-900">{r.userName}</span>
                  <Stars rating={r.rating} size={12} />
                  <span className="text-[11px] text-text-muted ml-auto">
                    {new Date(r.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {r.review && (
                  <p className="text-[13px] text-text-muted leading-relaxed">{r.review}</p>
                )}
                <button
                  onClick={() => onMarkHelpful?.(r.id)}
                  className="flex items-center gap-1 text-[11px] text-text-muted mt-1.5 hover:text-green-700 transition-colors">
                  <ThumbsUp size={11} /> Helpful ({r.helpful})
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
