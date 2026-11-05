"use client";

import { useEffect, useRef } from "react";
import { ExternalLink, X } from "lucide-react";
import { resolveVideoSource } from "@/lib/site-content/video";

interface Props {
  title: string;
  videoUrl: string;
  onClose: () => void;
}

/** Native <dialog>: focus is trapped, Esc closes, and focus returns to the opener. */
export default function VideoPlayerModal({ title, videoUrl, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const source = resolveVideoSource(videoUrl);

  useEffect(() => {
    const dlg = ref.current;
    if (dlg && !dlg.open) dlg.showModal();
    return () => dlg?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className="m-auto w-[min(960px,94vw)] rounded-2xl bg-black p-0 text-white backdrop:bg-black/70">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close video" className="rounded-lg p-1.5 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {source.kind === "iframe" && (
        <div className="aspect-video w-full">
          <iframe
            src={source.src}
            title={title}
            className="h-full w-full"
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
      {source.kind === "file" && (
        <video src={source.src} controls autoPlay playsInline className="aspect-video w-full bg-black">
          Your browser can&apos;t play this video.
        </video>
      )}
      {source.kind === "link" && (
        <div className="px-6 py-14 text-center">
          <p className="mb-4 text-sm text-white/70">This video opens on its own page.</p>
          <a
            href={source.src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-bold text-green-900 no-underline">
            Watch video <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      )}
    </dialog>
  );
}
