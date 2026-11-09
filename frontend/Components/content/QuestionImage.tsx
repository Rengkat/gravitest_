"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, RefreshCw, X } from "lucide-react";
import { analyzePixels, chooseBackdrop, mayHaveTransparency, type Backdrop } from "@/lib/content/imageAnalysis";

type Size = "question" | "compact" | "option";

interface Props {
  src: string;
  alt: string;
  /**
   * "question" (default): a tidy, modest figure — capped well below the viewport so a diagram never takes over the page.
   * "compact": a small thumbnail (e.g. inside the Sabi dialog).
   * "option": a small image inside an answer option.
   * Every size can be opened full-size with a click or Enter, so labels stay readable.
   */
  size?: Size;
  /** "auto" inspects PNG/WebP for transparency; otherwise force one. */
  backdrop?: "auto" | Backdrop;
  /** Allow opening the image full-size. On by default. */
  enlargeable?: boolean;
  className?: string;
}

const MAX_SAMPLE = 48; // analyse a tiny downscaled copy — cheap and enough to judge transparency/ink colour

// Height caps. The width follows the image's own aspect ratio (w-auto), so the white "paper" box hugs the
// diagram instead of stretching across the whole page with empty white sides.
const IMG_CLASS: Record<Size, string> = {
  question: "max-h-[min(36vh,17rem)]",
  compact: "max-h-36",
  option: "max-h-32",
};

/**
 * The one component every question, passage, option and explanation image goes through.
 *
 *  - No frame, border or padding: the figure IS the image, so nothing floats. It is as wide as the image
 *    needs (never wider than its container) and modest in height.
 *  - Natural aspect ratio (height:auto), never cropped (object-fit: contain) — labels, angles and symbols
 *    are always fully visible, and one click opens the original size.
 *  - White "paper" backdrop, written as a literal colour. The theme layer remaps `bg-white` to the dark
 *    surface in dark mode, which made white-paper diagrams look like they floated in a dark box.
 *  - Images that are transparent AND light-inked keep the app surface behind them instead.
 */
export default function QuestionImage({
  src,
  alt,
  size = "question",
  backdrop = "auto",
  enlargeable = true,
  className = "",
}: Props) {
  const [detected, setDetected] = useState<Backdrop>("paper");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
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
  const bg = mode === "paper" ? "bg-[#ffffff]" : "bg-transparent";

  if (failed) {
    return (
      <div
        role="alert"
        className={`flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-gray-400 px-4 py-4 text-[13px] text-gray-700 ${className}`}>
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

  const img = (
    // A plain <img>: next/image needs fixed width/height up front, which is what forced diagrams into a 600×400 box.
    // eslint-disable-next-line @next/next/no-img-element
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
      className={`block h-auto w-auto max-w-full object-contain ${IMG_CLASS[size]}`}
    />
  );

  return (
    <>
      <figure
        data-testid="question-image"
        data-backdrop={mode}
        className={`m-0 w-fit max-w-full overflow-hidden rounded-lg ${bg} ${className}`}>
        {enlargeable ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`View larger: ${alt}`}
            title="Click to view larger"
            className="block cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">
            {img}
          </button>
        ) : (
          img
        )}
      </figure>
      {open && <Lightbox src={src} alt={alt} paper={mode === "paper"} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Full-size view. A native modal <dialog>: focus is trapped, Esc closes, focus returns to the thumbnail. */
function Lightbox({ src, alt, paper, onClose }: { src: string; alt: string; paper: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  // Captured during the FIRST RENDER, i.e. before the Close button's autoFocus moves focus into the dialog.
  // Keyboard users land back exactly where they were — browsers restore this for showModal() natively, but
  // not consistently once the dialog is removed from the DOM.
  const opener = useRef<HTMLElement | null>(typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    const back = opener.current;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
    return () => {
      if (typeof dlg.close === "function" && dlg.open) dlg.close();
      back?.focus?.();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={alt}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      // This dialog can open on top of ANOTHER dialog (the Sabi explanation). Keys here must not reach it:
      // otherwise Esc would close both, and the parent's focus trap would fight this one.
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") onClose();
      }}
      className="m-auto max-h-[92vh] max-w-[94vw] overflow-auto rounded-xl border-0 bg-transparent p-0 backdrop:bg-black/80">
      <div className="relative">
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Close enlarged image"
          className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-2 text-white hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
          <X size={18} aria-hidden="true" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`block h-auto max-h-[92vh] w-auto max-w-[94vw] rounded-xl object-contain ${paper ? "bg-[#ffffff]" : ""}`}
        />
      </div>
    </dialog>
  );
}
