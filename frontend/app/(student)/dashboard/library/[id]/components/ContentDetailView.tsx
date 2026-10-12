"use client";

import Link from "next/link";
import {
  ChevronRight,
  RefreshCw,
  Star,
  Eye,
  Clock,
  FileText,
  Download,
  User,
  Tag,
  Calendar,
  Crown,
  CreditCard,
  Zap,
  CheckCircle2,
  Bookmark,
} from "lucide-react";
import { useContentDetail, type ContentTab } from "../useContentDetail";
import { Player } from "./Player";
import { AboutTab, RatingsTab } from "./TabPanels";
import {
  CONTENT_CFG,
  SUBJECT_CFG,
  EXAM_LABELS,
  CLASS_LABELS,
  TIER_CFG,
  fmtDuration,
  fmtSize,
  fmtPrice,
} from "../config";
import { RelatedTab } from "./RelatedTab";
import GatewayPicker from "@/Components/billing/GatewayPicker";

const TABS: { id: ContentTab; label: string }[] = [
  { id: "about", label: "About" },
  { id: "ratings", label: "Ratings" },
  { id: "related", label: "Related" },
];

export function ContentDetailView({ contentId }: { contentId: string }) {
  const {
    content,
    access,
    record,
    preview,
    ratings,
    related,
    loading,
    activeTab,
    userRating,
    hoverRating,
    reviewText,
    submittingRating,
    ratingDone,
    progressPct,
    setTab,
    setUserRating,
    setHoverRating,
    setReviewText,
    submitRating,
    markHelpful,
    updateProgress,
    addBookmark,
    handlePurchase,
    gateways,
    purchaseGateway,
    setPurchaseGateway,
    reloadPlayback,
    purchasing,
  } = useContentDetail(contentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-text-muted text-[14px]">
        <RefreshCw size={20} className="animate-spin text-green-800" />
        Loading…
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-text-muted" role="alert">
        Content not found.
      </div>
    );
  }

  const typeCfg = CONTENT_CFG[content.contentType] ?? CONTENT_CFG.DOCUMENT;
  const TypeIcon = typeCfg.icon;
  const subCfg = content.subject ? SUBJECT_CFG[content.subject] : null;
  const tierCfg = content.requiredTier ? TIER_CFG[content.requiredTier] : null;
  const TierIcon = tierCfg?.icon ?? Crown;

  const accessLabel = content.isFree
    ? { text: "Free", color: "#10b981", bg: "#10b98115" }
    : tierCfg
      ? { text: `${tierCfg.label} Plan`, color: tierCfg.color, bg: tierCfg.bg }
      : { text: fmtPrice(content.priceKobo!), color: "#f59e0b", bg: "#f59e0b15" };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* ── Breadcrumb ── */}
      <nav
        className="flex items-center gap-1.5 text-[12px] text-text-muted mb-5"
        aria-label="Breadcrumb">
        <Link href="/dashboard/library" className="hover:text-green-700 transition-colors">
          Library
        </Link>
        <ChevronRight size={12} />

        <span className="text-green-900 font-medium truncate max-w-[220px]">{content.title}</span>
      </nav>

      {/* ── Title + meta strip ── */}
      <div className="mb-5">
        {/* Type + subject + access chips */}
        <div className="flex items-center flex-wrap gap-1.5 mb-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: typeCfg.bg, color: typeCfg.color }}>
            <TypeIcon size={10} /> {typeCfg.label}
          </span>
          {subCfg && (
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: `${subCfg.color}12`, color: subCfg.color }}>
              {subCfg.label}
            </span>
          )}
          {content.topic && (
            <span className="flex items-center gap-1 text-[11px] text-text-muted">
              <Tag size={10} /> {content.topic}
            </span>
          )}
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: accessLabel.bg, color: accessLabel.color }}>
            {accessLabel.text}
          </span>
          {/* Exam chips */}
          {content.examTypes.map((e) => (
            <span
              key={e}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700">
              {EXAM_LABELS[e] ?? e}
            </span>
          ))}
          {content.classLevels.map((c) => (
            <span
              key={c}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
              {CLASS_LABELS[c] ?? c}
            </span>
          ))}
        </div>

        <h1 className="font-serif text-[24px] text-green-900 leading-snug mb-2">{content.title}</h1>

        {/* One-line meta row */}
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-text-muted">
          {content.author && (
            <span className="flex items-center gap-1">
              <User size={11} /> {content.author}
            </span>
          )}
          {content.durationSeconds && (
            <span className="flex items-center gap-1">
              <Clock size={11} /> {fmtDuration(content.durationSeconds)}
            </span>
          )}
          {content.totalPages && (
            <span className="flex items-center gap-1">
              <FileText size={11} /> {content.totalPages} pages
            </span>
          )}
          {content.fileSizeBytes && (
            <span className="flex items-center gap-1">
              <Download size={11} /> {fmtSize(content.fileSizeBytes)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye size={11} /> {content.totalViews.toLocaleString()} views
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={11} />{" "}
            {new Date(content.createdAt).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          {/* Inline rating */}
          <span className="flex items-center gap-1 ml-auto">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <strong className="text-green-900">{content.averageRating.toFixed(1)}</strong>
            <span className="text-text-muted">
              ({(content.ratingCount ?? ratings.length).toLocaleString()})
            </span>
          </span>
        </div>

        {/* Progress bar (if user has access and has started) */}
        {access?.hasAccess && progressPct > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-text-muted font-semibold">Your progress</span>
              <span
                className="font-bold"
                style={{ color: progressPct >= 100 ? "#10b981" : "#2e8b57" }}>
                {progressPct >= 100 ? "Completed ✓" : `${progressPct}%`}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-600 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Main layout: player left, sidebar right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-6 items-start">
        {/* ── Left: player + tabs ── */}
        <div className="space-y-5 min-w-0">
          <Player
            content={content}
            access={access ?? { hasAccess: false, reason: "no_access" }}
            record={record}
            preview={preview}
            onProgress={updateProgress}
            onBookmark={(pos) => addBookmark(pos)}
            onPurchase={handlePurchase}
            purchasing={purchasing}
            onRetry={reloadPlayback}
          />

          {/* Tab bar */}
          <div
            className="flex gap-1 border-b"
            style={{ borderColor: "rgba(30,80,50,0.1)" }}
            role="tablist"
            aria-label="Content sections">
            {TABS.map((tab) => (
              <button
                title="tab"
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setTab(tab.id)}
                className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-green-800 text-green-900 font-semibold"
                    : "border-transparent text-text-muted hover:text-green-900"
                }`}>
                {tab.label}
                {tab.id === "ratings" && (
                  <span className="ml-1.5 text-[10px] text-text-muted">({ratings.length})</span>
                )}
              </button>
            ))}
          </div>

          <div
            hidden={activeTab !== "about"}
            id="panel-about"
            role="tabpanel"
            aria-labelledby="tab-about">
            <AboutTab content={content} />
          </div>
          <div
            hidden={activeTab !== "ratings"}
            id="panel-ratings"
            role="tabpanel"
            aria-labelledby="tab-ratings">
            <RatingsTab
              content={content}
              ratings={ratings}
              userRating={userRating}
              hoverRating={hoverRating}
              reviewText={reviewText}
              submitting={submittingRating}
              done={ratingDone}
              hasAccess={access?.hasAccess ?? false}
              onRate={setUserRating}
              onHover={setHoverRating}
              onReview={setReviewText}
              onSubmit={submitRating}
              onMarkHelpful={markHelpful}
            />
          </div>
          <div
            hidden={activeTab !== "related"}
            id="panel-related"
            role="tabpanel"
            aria-labelledby="tab-related">
            <RelatedTab items={related} />
          </div>
        </div>

        {/* ── Right: access / action sidebar ── */}
        <aside className="space-y-4 lg:sticky lg:top-6">
          {/* Access card */}
          <div
            className="rounded-2xl bg-white border p-5"
            style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            {/* Already has access */}
            {access?.hasAccess ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span className="text-[13px] font-semibold text-green-700">
                    {access.reason === "free"
                      ? "Free content"
                      : access.reason === "owned"
                        ? "You purchased this"
                        : "Included in your plan"}
                  </span>
                </div>

                {/* Download button for non-video/audio */}
                {content.contentType !== "VIDEO" && content.contentType !== "AUDIO" && (
                  content.fileUrl ? (
                    <a
                      href={content.fileUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-800 text-white text-[14px] font-semibold hover:bg-green-700 transition-all">
                      <Download size={15} /> Download
                    </a>
                  ) : (
                    // No URL (failed to resolve, or expired): an href="" would just reload this page.
                    <button
                      type="button"
                      onClick={reloadPlayback}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-800 text-white text-[14px] font-semibold hover:bg-green-700 transition-all">
                      <RefreshCw size={15} /> Get download link
                    </button>
                  )
                )}
              </div>
            ) : (
              /* Locked — show CTA */
              <div className="space-y-3">
                {content.priceKobo ? (
                  <>
                    <div className="text-[26px] font-bold text-green-900">
                      {fmtPrice(content.priceKobo)}
                    </div>
                    <p className="text-[11px] text-text-muted -mt-2">One-time · Lifetime access</p>
                    <GatewayPicker
                      gateways={gateways}
                      value={purchaseGateway}
                      onChange={setPurchaseGateway}
                      disabled={purchasing}
                    />
                    <button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-800 text-white text-[14px] font-semibold hover:bg-green-700 transition-all disabled:opacity-60">
                      <CreditCard size={15} /> {purchasing ? "Redirecting…" : "Buy Now"}
                    </button>
                  </>
                ) : tierCfg ? (
                  <>
                    <div
                      className="flex items-center gap-2 p-3 rounded-xl mb-1"
                      style={{ background: tierCfg.bg }}>
                      <TierIcon size={15} style={{ color: tierCfg.color }} />
                      <div>
                        <div className="text-[13px] font-semibold" style={{ color: tierCfg.color }}>
                          {tierCfg.label} Plan Required
                        </div>
                        <div className="text-[11px] text-text-muted">
                          Includes all {tierCfg.label} content
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/pricing"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-[14px] hover:opacity-90 transition-all"
                      style={{ background: tierCfg.color, color: "#fff" }}>
                      <TierIcon size={15} /> Upgrade to {tierCfg.label}
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/pricing"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-800 text-white text-[14px] font-semibold hover:bg-green-700 transition-all">
                    <Zap size={15} /> Subscribe to Unlock
                  </Link>
                )}

                <Link
                  href="/pricing"
                  className="block text-center text-[12px] text-green-700 hover:underline">
                  View all plans →
                </Link>

                {/* Preview note — prefers the real, server-generated preview
                    length once it's known; falls back to the admin-set/default
                    length as a placeholder while it's still generating. */}
                <p
                  className="text-center text-[11px] text-text-muted pt-1 border-t"
                  style={{ borderColor: "rgba(30,80,50,0.08)" }}>
                  {content.contentType === "VIDEO" || content.contentType === "AUDIO"
                    ? `Free preview: first ${fmtDuration(preview?.durationSeconds ?? content.previewSeconds ?? 90)}`
                    : (() => {
                        const pages = preview?.pages ?? content.previewPages ?? 2;
                        return `Free preview: first ${pages} page${pages > 1 ? "s" : ""}`;
                      })()}
                </p>
              </div>
            )}
          </div>

          {/* Bookmarks (if unlocked) */}
          {access?.hasAccess && record?.bookmarks && record.bookmarks.length > 0 && (
            <div
              className="rounded-2xl bg-white border p-5"
              style={{ borderColor: "rgba(30,80,50,0.08)" }}>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3">
                Bookmarks
              </h3>
              <ul className="space-y-2">
                {record.bookmarks.map((bm, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px]">
                    <Bookmark size={12} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-green-900">
                        {content.contentType === "VIDEO" || content.contentType === "AUDIO"
                          ? fmtDuration(bm.position)
                          : `Page ${bm.position}`}
                      </span>
                      {bm.note && <p className="text-text-muted text-[11px]">{bm.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick stats */}
          <div
            className="rounded-2xl bg-white border p-4"
            style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Views", value: content.totalViews.toLocaleString() },
                { label: "Downloads", value: content.totalDownloads.toLocaleString() },
                { label: "Rating", value: `${content.averageRating.toFixed(1)} / 5` },
                {
                  label: "Reviews",
                  value: (content.ratingCount ?? ratings.length).toLocaleString(),
                },
              ].map(({ label, value }) => (
                <div key={label} className="bg-cream rounded-xl p-2.5">
                  <div className="text-[14px] font-bold text-green-900">{value}</div>
                  <div className="text-[10px] text-text-muted">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
