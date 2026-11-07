"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { uploadDiscussionImage } from "@/lib/api/discussions";
import { extractErrorMessage } from "@/lib/api/client";
import { newClientToken } from "@/lib/discussion/token";

const MAX_CHARS = 2000;
const MAX_IMAGES = 3;
const MAX_BYTES = 3 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export interface ComposerValue { content: string; imageUrls: string[]; clientToken: string }

interface Props {
  /** Accessible name of the field, e.g. "Your contribution" or "Reply to Ada O.". */
  label: string;
  placeholder?: string;
  submitLabel: string;
  initialContent?: string;
  initialImages?: string[];
  /** Image attachments are optional where the page doesn't want them. */
  allowImages?: boolean;
  autoFocus?: boolean;
  onSubmit: (value: ComposerValue) => Promise<void>;
  onCancel?: () => void;
  compact?: boolean;
}

/** Text + optional images + submit. Used for new contributions, replies and edits. */
export default function Composer({
  label, placeholder, submitLabel, initialContent = "", initialImages = [], allowImages = true,
  autoFocus, onSubmit, onCancel, compact,
}: Props) {
  const id = useId();
  const [content, setContent] = useState(initialContent);
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(0);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  // One token per draft: a retried/double-clicked submit of THIS draft can never create two contributions.
  const token = useRef(newClientToken());

  const empty = !content.trim() && images.length === 0;
  const left = MAX_CHARS - content.length;

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_IMAGES - images.length;
    const chosen = Array.from(files).slice(0, room);
    if (files.length > room) toast.error(`You can attach at most ${MAX_IMAGES} images.`);
    for (const file of chosen) {
      if (!ACCEPT.split(",").includes(file.type)) { toast.error(`${file.name}: only JPEG, PNG or WebP images.`); continue; }
      if (file.size > MAX_BYTES) { toast.error(`${file.name} is larger than 3 MB.`); continue; }
      setUploading((n) => n + 1);
      try {
        const url = await uploadDiscussionImage(file);
        setImages((prev) => [...prev, url]);
      } catch (e) {
        toast.error(extractErrorMessage(e));
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit() {
    if (empty || busy || uploading > 0 || left < 0) return;
    setBusy(true);
    try {
      await onSubmit({ content: content.trim(), imageUrls: images, clientToken: token.current });
      setContent("");
      setImages([]);
      token.current = newClientToken();
      textRef.current?.focus();
    } catch {
      // The caller has already announced the error; the draft (and its token) are kept for a safe retry.
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void submit(); }}
      className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-text`} className="sr-only">{label}</label>
          <textarea
            id={`${id}-text`}
            ref={textRef}
            value={content}
            autoFocus={autoFocus}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void submit(); } }}
            rows={compact ? 3 : 5}
            maxLength={MAX_CHARS + 200}
            placeholder={placeholder ?? "Type your contribution here"}
            aria-describedby={`${id}-hint`}
            aria-invalid={left < 0}
            className="w-full resize-y rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-600 focus:border-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          />
        </div>
        {allowImages && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="sr-only"
              id={`${id}-file`}
              tabIndex={-1}
              onChange={(e) => void pick(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={images.length >= MAX_IMAGES || busy}
              aria-label={`Attach an image (${images.length} of ${MAX_IMAGES} attached)`}
              title="Attach an image or diagram"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-green-800 hover:bg-green-50 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-green-600">
              <ImagePlus size={20} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <p id={`${id}-hint`} className="text-[12px] text-gray-700">
        Press Ctrl+Enter to post.{" "}
        <span className={left < 0 ? "font-bold text-red-700" : left < 200 ? "font-semibold text-amber-800" : ""}>
          {left < 200 ? `${left} characters left.` : ""}
        </span>
      </p>

      {(images.length > 0 || uploading > 0) && (
        <ul className="flex flex-wrap gap-2" aria-label="Attached images">
          {images.map((url, i) => (
            <li key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Attached image ${i + 1}`} className="h-20 w-20 rounded-lg border border-gray-200 object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                aria-label={`Remove attached image ${i + 1}`}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white focus-visible:ring-2 focus-visible:ring-green-600">
                <X size={13} aria-hidden="true" />
              </button>
            </li>
          ))}
          {uploading > 0 && (
            <li role="status" className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-700">
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              <span className="sr-only">Uploading image…</span>
            </li>
          )}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={empty || busy || uploading > 0 || left < 0}
          className="inline-flex items-center gap-2 rounded-full bg-green-800 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">
          {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {busy ? "Posting…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-full px-4 py-2.5 text-[13px] font-semibold text-gray-800 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-green-600">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
