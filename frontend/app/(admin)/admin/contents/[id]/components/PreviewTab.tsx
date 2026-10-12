"use client";

import { useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import type { ContentItem } from "@/types/admin-contents";
import { CONTENT_TYPES } from "@/lib/constants/contents";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtSec(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Video ────────────────────────────────────────────────────────────────────

function VideoPreview({ item }: { item: ContentItem }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dur, setDur] = useState(0);

  const toggle = () => {
    if (!ref.current) return;
    if (playing) {
      ref.current.pause();
      setPlaying(false);
    } else {
      ref.current.play();
      setPlaying(true);
    }
  };

  const skip = (d: number) => {
    if (ref.current) ref.current.currentTime = Math.max(0, Math.min(dur, current + d));
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (ref.current) ref.current.currentTime = t;
    setCurrent(t);
  };

  const pct = dur > 0 ? (current / dur) * 100 : 0;

  // Use a working sample URL since fileUrl from mock is a placeholder
  const src = item?.fileUrl?.startsWith("http")
    ? item.fileUrl
    : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  return (
    <div className="rounded-2xl overflow-hidden bg-black">
      <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
        <video
          ref={ref}
          src={src}
          className="w-full h-full object-contain"
          onTimeUpdate={() => {
            if (ref.current) setCurrent(ref.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (ref.current) setDur(ref.current.duration);
          }}
          muted={muted}
          preload="metadata"
          onClick={toggle}
        />
        {/* Admin badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-green-800/90 text-white text-[10px] font-bold">
          ADMIN PREVIEW · Full Access
        </div>
        {!playing && (
          <button
            onClick={toggle}
            className="absolute inset-0 flex items-center justify-center"
            aria-label="Play">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all">
              <Play size={26} className="text-white ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 px-4 py-3">
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
            step={0.5}
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
            {fmtSec(current)} / {fmtSec(dur)}
          </span>
          <div className="flex-1" />
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
    </div>
  );
}

// ─── Audio ────────────────────────────────────────────────────────────────────

function AudioPreview({ item }: { item: ContentItem }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dur, setDur] = useState(0);

  const toggle = () => {
    if (!ref.current) return;
    if (playing) {
      ref.current.pause();
      setPlaying(false);
    } else {
      ref.current.play();
      setPlaying(true);
    }
  };

  const src = item?.fileUrl?.startsWith("http")
    ? item?.fileUrl
    : "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

  return (
    <div className="rounded-2xl bg-white border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <audio
        ref={ref}
        src={src}
        onTimeUpdate={() => {
          if (ref.current) setCurrent(ref.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (ref.current) setDur(ref.current.duration);
        }}
        preload="metadata"
      />

      <div className="flex items-center justify-center gap-0.5 mb-4" style={{ height: 80 }}>
        {Array.from({ length: 60 }, (_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: 3,
              height: 8 + Math.abs(Math.sin(i * 0.5) * 40),
              background: i / 60 <= (dur > 0 ? current / dur : 0) ? "#2e8b57" : "#d1d5db",
            }}
          />
        ))}
      </div>

      <div className="px-2">
        <input
          type="range"
          min={0}
          max={dur || 1}
          step={0.5}
          value={current}
          onChange={(e) => {
            const t = parseFloat(e.target.value);
            if (ref.current) ref.current.currentTime = t;
            setCurrent(t);
          }}
          className="w-full mb-1 cursor-pointer accent-green-700"
          aria-label="Seek audio"
        />
        <div className="flex justify-between text-[11px] text-text-muted mb-4">
          <span>{fmtSec(current)}</span>
          <span>{fmtSec(dur)}</span>
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
    </div>
  );
}

// ─── Document / Ebook / PDF ───────────────────────────────────────────────────

function DocPreview({ item }: { item: ContentItem }) {
  const total = item.pages ?? 10;
  const [page, setPage] = useState(1);

  const src = item?.fileUrl?.startsWith("http")
    ? item?.fileUrl
    : "https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF2.pdf";

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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors"
            aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          <span className="text-[12px] font-semibold text-green-900 min-w-[80px] text-center">
            Page {page} of {total}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(total, p + 1))}
            disabled={page >= total}
            className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors"
            aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold">
          ADMIN · Full Document
        </div>
      </div>

      <iframe
        src={`${src}#page=${page}&toolbar=0&navpanes=0`}
        className="w-full border-0"
        style={{ height: "72vh" }}
        title={`${item.title} page ${page}`}
      />
    </div>
  );
}

// ─── Infographic (image) ──────────────────────────────────────────────────────

function ImagePreview({ item }: { item: ContentItem }) {
  const src = item?.thumbnailUrl ?? item?.fileUrl;
  return (
    <div
      className="rounded-2xl bg-white border overflow-hidden"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      {src ? (
        <img src={src} alt={item.title} className="w-full object-contain max-h-[70vh]" />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-text-muted gap-2">
          <AlertCircle size={32} className="opacity-30" />
          <p className="text-[13px]">No preview available</p>
        </div>
      )}
    </div>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function PreviewTab({ item }: { item: ContentItem }) {
  const typeCfg = CONTENT_TYPES[item.type];

  return (
    <div className="space-y-4">
      {/* Admin notice */}
      <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-2.5 flex items-center gap-2 text-[12px] text-green-700 font-medium">
        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
        Admin preview — you are viewing this content with full access. Students see a limited
        preview if the content is locked.
      </div>

      {item?.type === "video" && <VideoPreview item={item} />}
      {item?.type === "audio" && <AudioPreview item={item} />}
      {item?.type === "infographic" && <ImagePreview item={item} />}
      {(item?.type === "ebook" ||
        item?.type === "document" ||
        item?.type === "past_question" ||
        item?.type === "lesson_note") && <DocPreview item={item} />}
    </div>
  );
}
