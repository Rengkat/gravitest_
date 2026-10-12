"use client";

import { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  SkipBack,
  SkipForward,
  Lock,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Crown,
  CreditCard,
  Zap,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import type { LibraryContent, AccessCheckResult, LibraryAccess } from "../types";
import { fmtDuration, fmtPrice, TIER_CFG, PREVIEW } from "../config";
import type { ContentPreview } from "@/lib/api/library";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Starts playback without ever leaving an unhandled promise rejection behind.
//
// HTMLMediaElement.play() returns a promise. If pause() (or a new src/load())
// lands before it settles — a quick double-click, unmounting — the browser
// rejects it with AbortError, and an un-awaited play() turns that into
// "unhandledRejection: The play() request was interrupted by a call to
// pause()". AbortError and NotAllowedError (autoplay blocked) are normal
// control flow, not failures; anything else (e.g. NotSupportedError for a
// dead source) is reported through onFail.
async function playSafely(el: HTMLMediaElement, onFail: () => void) {
  try {
    await el.play();
  } catch (err) {
    if (err instanceof DOMException && (err.name === "AbortError" || err.name === "NotAllowedError")) {
      return;
    }
    onFail();
  }
}

// Shown INSTEAD of a player when there is no file URL to give it. The server
// deliberately sends an empty fileUrl to anyone without access to paid
// content, and rendering <video src=""> / <iframe src="#page=1"> makes the
// browser re-request the current page ("An empty string was passed to the src
// attribute"). So no URL means no media element at all.
function Unavailable({
  content,
  access,
  onPurchase,
  purchasing,
  onRetry,
}: {
  content: LibraryContent;
  access: AccessCheckResult;
  onPurchase: () => void;
  purchasing: boolean;
  onRetry?: () => void;
}) {
  if (!access.hasAccess) {
    return <Paywall content={content} reason={access.reason} variant="locked" onPurchase={onPurchase} purchasing={purchasing} />;
  }
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6"
      style={{ background: "rgba(10,20,15,0.92)" }}>
      <h3 className="text-white text-[16px] font-bold mb-1">This file couldn&apos;t be loaded</h3>
      <p className="text-gray-400 text-[13px] mb-5 max-w-[280px] leading-relaxed">
        The link may have expired or your connection dropped.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 text-white font-semibold text-[13px] hover:bg-green-600 transition-all">
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}

// Shown while the server is still generating the free preview clip/excerpt
// (LibraryPreviewProcessor) — usually a few seconds. The hook driving
// `preview` polls in the background, so this just disappears on its own
// once generation finishes; nothing for the user to do here.
function PreparingPreview() {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6"
      style={{ background: "rgba(10,20,15,0.92)" }}>
      <div className="w-9 h-9 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
      <h3 className="text-white text-[15px] font-bold mb-1">Preparing your free preview</h3>
      <p className="text-gray-400 text-[12px] max-w-[240px] leading-relaxed">This only takes a few seconds.</p>
    </div>
  );
}

// ─── Paywall ──────────────────────────────────────────────────────────────────

function Paywall({
  content,
  reason,
  variant = "ended",
  preview,
  onPurchase,
  purchasing,
}: {
  content: LibraryContent;
  reason?: string;
  /** "ended": the free preview ran out. "locked": there is no preview to play. */
  variant?: "ended" | "locked";
  /** The real, server-generated preview that just finished, if any — used for an accurate "N free preview" label instead of the requested/default length. */
  preview?: ContentPreview | null;
  onPurchase: () => void;
  purchasing: boolean;
}) {
  const tierCfg = content.requiredTier ? TIER_CFG[content.requiredTier] : null;
  const TierIcon = tierCfg?.icon ?? Crown;
  const isExpired = reason === "expired";

  const mediaPreview = content.contentType === "VIDEO" || content.contentType === "AUDIO";
  const previewNote = mediaPreview
    ? `${fmtDuration(preview?.durationSeconds ?? content.previewSeconds ?? PREVIEW.VIDEO_SECONDS)} free preview`
    : `${preview?.pages ?? content.previewPages ?? PREVIEW.PAGES} pages free preview`;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6"
      style={{ background: "rgba(10,20,15,0.92)", backdropFilter: "blur(10px)" }}>
      <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4">
        <Lock size={24} className="text-white" />
      </div>

      <h3 className="text-white text-[18px] font-bold mb-1">
        {isExpired ? "Access expired" : variant === "locked" ? "Premium content" : "Preview ended"}
      </h3>
      <p className="text-gray-400 text-[13px] mb-6 max-w-[280px] leading-relaxed">
        {isExpired
          ? "Renew your access to continue."
          : variant === "locked" && !tierCfg && !content.priceKobo
            ? "Subscribe to unlock this content."
            : tierCfg
            ? `This content requires a ${tierCfg.label} plan.`
            : "Purchase once for lifetime access."}
      </p>

      <div className="flex flex-col gap-2 w-full max-w-[260px]">
        {content.priceKobo && (
          <button
            onClick={onPurchase}
            disabled={purchasing}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-700 text-white font-semibold text-[14px] hover:bg-green-600 transition-all disabled:opacity-60">
            <CreditCard size={15} /> {purchasing ? "Redirecting…" : `Buy — ${fmtPrice(content.priceKobo)}`}
          </button>
        )}
        {tierCfg && (
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] hover:opacity-90 transition-all"
            style={{ background: tierCfg.color, color: "#fff" }}>
            <TierIcon size={15} /> Upgrade to {tierCfg.label}
          </Link>
        )}
        {!content.priceKobo && !tierCfg && (
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-700 text-white font-semibold text-[14px]">
            <Zap size={15} /> Subscribe to Unlock
          </Link>
        )}
        <Link
          href="/pricing"
          className="flex items-center justify-center gap-1.5 py-2 text-[12px] text-gray-400 hover:text-white transition-colors">
          View plans <ArrowRight size={12} />
        </Link>
      </div>

      {variant === "ended" && <p className="text-gray-600 text-[10px] mt-4">{previewNote}</p>}
    </div>
  );
}

// ─── Video ────────────────────────────────────────────────────────────────────

function VideoViewer({
  content,
  access,
  record,
  preview,
  onProgress,
  onBookmark,
  onPurchase,
  purchasing,
  onRetry,
}: {
  content: LibraryContent;
  access: AccessCheckResult;
  record: LibraryAccess | null;
  /** Server-generated preview clip info for callers without access — see useContentDetail. */
  preview?: ContentPreview | null;
  onProgress: (p: number) => void;
  onBookmark: (pos: number) => void;
  onPurchase: () => void;
  purchasing: boolean;
  onRetry?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  // No access → play the short, genuinely-clipped preview file (if the
  // server has finished generating one), never the full fileUrl. There is
  // no client-side "stop at N seconds" logic any more: the clip itself is
  // only ever as long as LibraryPreviewProcessor made it, so playing it to
  // the end IS the whole preview, safely.
  const previewMode = !access.hasAccess;
  const previewReady = previewMode && preview?.status === "ready" && !!preview.url;
  const previewPending = previewMode && (!preview || preview.status === "pending");
  const src = previewMode ? (previewReady ? (preview!.url as string) : null) : content.fileUrl || null;

  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dur, setDur] = useState(previewMode ? 0 : (content.durationSeconds ?? 0));
  const [walled, setWalled] = useState(false);

  // A fresh URL (after "Try again", or once the preview finishes generating)
  // deserves a fresh chance to play.
  useEffect(() => {
    setFailed(false);
    setWalled(false);
  }, [src]);

  // Resume from saved progress on mount (full access only — a preview clip
  // always starts from 0, it has no relationship to the real file's timeline).
  useEffect(() => {
    if (ref.current && access.hasAccess && record?.progressPercent && dur > 0) {
      ref.current.currentTime = (record.progressPercent / 100) * dur;
    }
  }, [dur]);

  const onTimeUpdate = () => {
    if (!ref.current) return;
    const t = ref.current.currentTime;
    const d = ref.current.duration || dur;
    setCurrent(t);
    if (!previewMode) onProgress(Math.round((t / d) * 100));
  };

  // `playing` follows the element's real onPlay / onPause events (below), not a
  // guess made at click time — so a play() that gets interrupted can't leave
  // the button showing "pause" for a video that isn't playing.
  const toggle = () => {
    const el = ref.current;
    if (!el || walled || !src) return;
    if (el.paused) void playSafely(el, () => setFailed(true));
    else el.pause();
  };

  const skip = (d: number) => {
    if (!ref.current) return;
    const next = Math.max(0, Math.min(dur, current + d));
    ref.current.currentTime = next;
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (ref.current) ref.current.currentTime = t;
    setCurrent(t);
  };

  const pct = dur > 0 ? (current / dur) * 100 : 0;

  if (!src || failed) {
    return (
      <div className="rounded-2xl overflow-hidden bg-black">
        <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
          {previewPending ? (
            <PreparingPreview />
          ) : (
            <Unavailable
              content={content}
              access={access}
              onPurchase={onPurchase}
              purchasing={purchasing}
              onRetry={onRetry}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-black">
      {/* Video area */}
      <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
        <video
          ref={ref}
          src={src}
          className="w-full h-full object-contain"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={() => {
            if (ref.current) setDur(ref.current.duration);
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            if (previewMode) setWalled(true);
          }}
          onError={() => setFailed(true)}
          muted={muted}
          preload="metadata"
          onClick={toggle}
        />

        {/* Preview timer badge */}
        {previewMode && !walled && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-semibold">
            <Lock size={10} /> {fmtDuration(Math.max(0, Math.ceil(dur - current)))} left
          </div>
        )}

        {/* Big play button when paused */}
        {!playing && !walled && (
          <button
            onClick={toggle}
            className="absolute inset-0 flex items-center justify-center"
            aria-label="Play">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all">
              <Play size={26} className="text-white ml-1" />
            </div>
          </button>
        )}

        {/* Paywall */}
        {walled && (
          <Paywall content={content} reason={access.reason} preview={preview} onPurchase={onPurchase} purchasing={purchasing} />
        )}
      </div>

      {/* Controls */}
      {!walled && (
        <div className="bg-gray-900 px-4 py-3">
          {/* Seek bar */}
          <div className="relative mb-2.5">
            <div
              className="absolute inset-0 h-1.5 rounded-full overflow-hidden pointer-events-none"
              style={{ top: "50%", transform: "translateY(-50%)" }}>
              <div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
            </div>
            <input
              type="range"
              min={0}
              max={dur || 1}
              step={1}
              value={current}
              onChange={seek}
              className="relative w-full h-1.5 opacity-0 cursor-pointer"
              aria-label="Seek"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => skip(-10)}
              className="text-gray-400 hover:text-white p-1"
              aria-label="Back 10s">
              <SkipBack size={15} />
            </button>
            <button
              onClick={toggle}
              className="text-white hover:text-green-400 p-1"
              aria-label={playing ? "Pause" : "Play"}>
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              onClick={() => skip(10)}
              className="text-gray-400 hover:text-white p-1"
              aria-label="Forward 10s">
              <SkipForward size={15} />
            </button>

            <span className="text-[11px] text-gray-400 ml-1 tabular-nums">
              {fmtDuration(Math.floor(current))} / {fmtDuration(Math.floor(dur))}
            </span>

            <div className="flex-1" />

            {access.hasAccess && (
              <button
                onClick={() => onBookmark(Math.floor(current))}
                className="text-gray-400 hover:text-amber-400 p-1 transition-colors"
                aria-label="Bookmark this moment">
                <Bookmark size={14} />
              </button>
            )}

            <button
              onClick={() => setMuted(!muted)}
              className="text-gray-400 hover:text-white p-1"
              aria-label={muted ? "Unmute" : "Mute"}>
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <button
              onClick={() => ref.current?.requestFullscreen()}
              className="text-gray-400 hover:text-white p-1"
              aria-label="Fullscreen">
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audio ────────────────────────────────────────────────────────────────────

function AudioViewer({
  content,
  access,
  preview,
  onProgress,
  onPurchase,
  purchasing,
  onRetry,
}: {
  content: LibraryContent;
  access: AccessCheckResult;
  preview?: ContentPreview | null;
  onProgress: (p: number) => void;
  onPurchase: () => void;
  purchasing: boolean;
  onRetry?: () => void;
}) {
  const ref = useRef<HTMLAudioElement>(null);

  const previewMode = !access.hasAccess;
  const previewReady = previewMode && preview?.status === "ready" && !!preview.url;
  const previewPending = previewMode && (!preview || preview.status === "pending");
  const src = previewMode ? (previewReady ? (preview!.url as string) : null) : content.fileUrl || null;

  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dur, setDur] = useState(previewMode ? 0 : (content.durationSeconds ?? 0));
  const [walled, setWalled] = useState(false);
  const [tick, setTick] = useState(0); // for waveform animation

  useEffect(() => {
    setFailed(false);
    setWalled(false);
  }, [src]);

  useEffect(() => {
    let id: any;
    if (playing) id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [playing]);

  const onTimeUpdate = () => {
    if (!ref.current) return;
    const t = ref.current.currentTime;
    const d = ref.current.duration || dur;
    setCurrent(t);
    if (!previewMode) onProgress(Math.round((t / d) * 100));
  };

  const toggle = () => {
    const el = ref.current;
    if (!el || walled || !src) return;
    if (el.paused) void playSafely(el, () => setFailed(true));
    else el.pause();
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (ref.current) ref.current.currentTime = t;
    setCurrent(t);
  };

  if (!src || failed) {
    return (
      <div
        className="rounded-2xl bg-white border overflow-hidden"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="relative bg-green-900" style={{ height: 220 }}>
          {previewPending ? (
            <PreparingPreview />
          ) : (
            <Unavailable
              content={content}
              access={access}
              onPurchase={onPurchase}
              purchasing={purchasing}
              onRetry={onRetry}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl bg-white border overflow-hidden"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <audio
        ref={ref}
        src={src}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={() => {
          if (ref.current) setDur(ref.current.duration);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          if (previewMode) setWalled(true);
        }}
        onError={() => setFailed(true)}
        preload="metadata"
      />

      {/* Thumbnail + waveform area */}
      <div
        className="relative bg-green-900 flex items-center justify-center overflow-hidden"
        style={{ height: 160 }}>
        {content.thumbnailUrl && (
          <img
            src={content.thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        )}
        {walled ? (
          <div className="relative z-10 w-full h-full">
            <Paywall content={content} reason={access.reason} preview={preview} onPurchase={onPurchase} purchasing={purchasing} />
          </div>
        ) : (
          <div className="relative z-10 flex items-end gap-0.5 px-6">
            {Array.from({ length: 50 }, (_, i) => {
              const playedFraction = dur > 0 ? current / dur : 0;
              const barFraction = i / 50;
              const played = barFraction <= playedFraction;
              const height = 12 + Math.abs(Math.sin((i + tick * 0.3) * 0.5) * 40);
              return (
                <div
                  key={i}
                  className="rounded-full transition-none"
                  style={{
                    width: 3,
                    height: playing ? height : 12 + Math.abs(Math.sin(i * 0.5) * 30),
                    background: played ? "#4ade80" : "rgba(255,255,255,0.25)",
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Preview badge */}
        {previewMode && !walled && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 text-white text-[11px] font-semibold">
            <Lock size={10} /> {fmtDuration(Math.max(0, Math.ceil(dur - current)))} left
          </div>
        )}
      </div>

      {!walled && (
        <div className="px-5 py-4">
          {/* Seek */}
          <input
            type="range"
            min={0}
            max={dur || 1}
            step={0.5}
            value={current}
            onChange={seek}
            className="w-full mb-1 cursor-pointer accent-green-700"
            aria-label="Seek audio"
          />
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-4">
            <span className="tabular-nums">{fmtDuration(Math.floor(current))}</span>
            {previewMode && (
              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                <Lock size={9} /> {fmtDuration(Math.floor(dur))} preview
              </span>
            )}
            <span className="tabular-nums">{fmtDuration(Math.floor(dur))}</span>
          </div>

          <div className="flex justify-center">
            <button
              onClick={toggle}
              className="w-12 h-12 rounded-full bg-green-800 text-white flex items-center justify-center hover:bg-green-700 transition-all shadow-md"
              aria-label={playing ? "Pause" : "Play"}>
              {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Document / Ebook / Lesson Note / Past Question ──────────────────────────

function DocViewer({
  content,
  access,
  preview,
  onBookmark,
  onPurchase,
  purchasing,
  onRetry,
}: {
  content: LibraryContent;
  access: AccessCheckResult;
  preview?: ContentPreview | null;
  onBookmark: (page: number) => void;
  onPurchase: () => void;
  purchasing: boolean;
  onRetry?: () => void;
}) {
  const previewMode = !access.hasAccess;
  const previewReady = previewMode && preview?.status === "ready" && !!preview.url;
  const previewPending = previewMode && (!preview || preview.status === "pending");
  const src = previewMode ? (previewReady ? (preview!.url as string) : null) : content.fileUrl || null;

  // The real total page count for display only ("6 more pages — unlock to
  // read"); admin-entered metadata, not trusted for enforcement. Enforcement
  // is that the preview FILE itself only contains `preview.pages` pages —
  // there is nothing to navigate past.
  const displayTotal = content.totalPages ?? 10;
  // How many pages are actually reachable in whichever file is loaded.
  const total = previewMode ? (preview?.pages ?? 0) : displayTotal;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [src]);

  const go = (d: number) => {
    const next = page + d;
    if (next < 1 || next > total) return;
    setPage(next);
  };

  const hitWall = previewMode && total > 0 && page >= total;

  if (!src) {
    return (
      <div
        className="rounded-2xl bg-white border overflow-hidden"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="relative" style={{ height: "48vh", minHeight: 300 }}>
          {previewPending ? (
            <PreparingPreview />
          ) : (
            <Unavailable
              content={content}
              access={access}
              onPurchase={onPurchase}
              purchasing={purchasing}
              onRetry={onRetry}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl bg-white border overflow-hidden"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b bg-gray-50"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => go(-1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors"
            aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          <span className="text-[12px] font-semibold text-green-900 min-w-[100px] text-center">
            Page {page} of {previewMode ? `${total} (preview)` : total}
          </span>
          <button
            onClick={() => go(1)}
            disabled={page >= total}
            className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors"
            aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </div>

        {access.hasAccess && (
          <button
            onClick={() => onBookmark(page)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-medium hover:bg-amber-100 transition-all">
            <Bookmark size={12} /> Bookmark p.{page}
          </button>
        )}
      </div>

      {/* PDF frame */}
      <div className="relative">
        <iframe
          src={`${src}#page=${page}&toolbar=0&navpanes=0`}
          className="w-full border-0"
          style={{ height: "72vh" }}
          title={`${content.title} page ${page}`}
        />

        {/* Fade + lock on last preview page */}
        {hitWall && (
          <div className="absolute inset-0 flex flex-col">
            <div
              className="flex-1"
              style={{ backgroundImage: "linear-gradient(to bottom, transparent, var(--gt-surface))" }}
            />
            <div className="bg-white flex items-center justify-center py-8 px-6">
              <Paywall content={content} reason={access.reason} preview={preview} onPurchase={onPurchase} purchasing={purchasing} />
            </div>
          </div>
        )}

        {/* Soft fade + "X more pages" hint on second-to-last preview page */}
        {previewMode && !hitWall && page === total - 1 && total > 1 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-20 flex items-end justify-center pb-3 pointer-events-none"
            style={{ backgroundImage: "linear-gradient(to top, var(--gt-surface), transparent)" }}>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border shadow-sm text-[11px] text-text-muted font-semibold">
              <Lock size={10} className="text-amber-500" />
              {Math.max(0, displayTotal - total)} more page{displayTotal - total !== 1 ? "s" : ""} — unlock to read
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function Player({
  content,
  access,
  record,
  preview,
  onProgress,
  onBookmark,
  onPurchase,
  purchasing,
  onRetry,
}: {
  content: LibraryContent;
  access: AccessCheckResult;
  record: LibraryAccess | null;
  /** Server-generated free preview for content the caller doesn't have access to — see useContentDetail. Ignored once access.hasAccess is true. */
  preview?: ContentPreview | null;
  onProgress: (p: number) => void;
  onBookmark: (position: number) => void;
  onPurchase: () => void;
  purchasing: boolean;
  /** Re-request the playback URL (used when it expired or failed to load). */
  onRetry?: () => void;
}) {
  if (content.contentType === "VIDEO") {
    return (
      <VideoViewer
        content={content}
        access={access}
        record={record}
        preview={preview}
        onProgress={onProgress}
        onBookmark={onBookmark}
        onPurchase={onPurchase}
        purchasing={purchasing}
        onRetry={onRetry}
      />
    );
  }
  if (content.contentType === "AUDIO") {
    return (
      <AudioViewer
        content={content}
        access={access}
        preview={preview}
        onProgress={onProgress}
        onPurchase={onPurchase}
        purchasing={purchasing}
        onRetry={onRetry}
      />
    );
  }
  return (
    <DocViewer
      content={content}
      access={access}
      preview={preview}
      onBookmark={onBookmark}
      onPurchase={onPurchase}
      purchasing={purchasing}
      onRetry={onRetry}
    />
  );
}
