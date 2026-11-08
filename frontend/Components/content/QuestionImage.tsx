"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, RefreshCw } from "lucide-react";
import { analyzePixels, chooseBackdrop, mayHaveTransparency, type Backdrop } from "@/lib/content/imageAnalysis";

interface Props {
  src: string;
  alt: string;
  /**
   * "question" (default): fills the width of its container.
   * "option": a compact image inside an answer option — keeps its natural size, never upscaled.
   */
  size?: "question" | "option";
  /** "auto" inspects PNG/WebP for transparency; otherwise force one. */
  backdrop?: "auto" | Backdrop;
  className?: string;
}

const MAX_SAMPLE = 48; // analyse a tiny downscaled copy — cheap and enough to judge transparency/ink colour

/**
 * The one component every question, passage, option and explanation image goes through.
 *
 *  - No frame, border or padding: the figure IS the image, flush with the question, so nothing floats.
 *  - Full container width, natural aspect ratio (height:auto), never cropped (object-fit: contain) — labels,
 *    angles and symbols are always fully visible. A tall image is capped by viewport height and centred, never cut.
 *  - White "paper" backdrop, written as a literal colour. The theme layer remaps `bg-white` to the dark surface
 *    in dark mode, which is exactly what made white-paper diagrams look like they floated in a dark box.
 *  - Images that are transparent AND light-inked keep the app surface behind them instead.
 */
export default function QuestionImage({ src, alt, size = "question", backdrop = "auto", className = "" }: Props) {
  const [detected, setDetected] = useState<Backdrop>("paper");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // PNG/WebP are first requested with CORS so their pixels can be inspected. If the host doesn't send CORS
  // headers that request fails, so we transparently retry once without it (and skip the inspection).
  const wantsAnalysis = backdrop === "auto" && mayHaveTransparency(src);
  const [cors, setCors] = useState(wantsAnalysis);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setFailed(false);
    setDetected("paper");
    setCors(wantsAnalysis);
  }, [src, wantsAnalysis, attempt]);

  function inspect() {
    const img = imgRef.current;
    if (!img || !cors || !img.naturalWidth) return;
    try {
      const scale = Math.min(1, MAX_SAMPLE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      setDetected(chooseBackdrop(analyzePixels(ctx.getImageData(0, 0, w, h).data)));
    } catch {
      // Canvas tainted (no CORS) or unreadable: keep the safe default — white paper.
    }
  }

  function onError() {
    if (cors) setCors(false); // retry without CORS before declaring the image broken
    else setFailed(true);
  }

  const mode: Backdrop = backdrop === "auto" ? detected : backdrop;

  if (failed) {
    return (
      <div
        role="alert"
        className={`flex flex-wrap items-center justify-center gap-3 rounded-lg border border-dashed border-gray-400 px-4 py-6 text-[13px] text-gray-700 ${className}`}>
        <ImageOff size={18} aria-hidden="true" />
        <span>This image could not be loaded.</span>
        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-400 px-3 py-1.5 font-semibold hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700">
          <RefreshCw size={13} aria-hidden="true" /> Retry
        </button>
      </div>
    );
  }

  return (
    <figure
      data-testid="question-image"
      data-backdrop={mode}
      className={`m-0 overflow-hidden rounded-lg ${mode === "paper" ? "bg-[#ffffff]" : "bg-transparent"} ${className}`}>
      {/* A plain <img>: next/image needs fixed width/height up front, which is what forced diagrams into a 600×400 box. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`${src}:${cors ? "cors" : "plain"}:${attempt}`}
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        crossOrigin={cors ? "anonymous" : undefined}
        onLoad={inspect}
        onError={onError}
        className={
          size === "question"
            ? "mx-auto block h-auto w-full max-w-full object-contain max-h-[min(75vh,36rem)]"
            : "mx-auto block h-auto w-auto max-w-full object-contain max-h-48"
        }
      />
    </figure>
  );
}
