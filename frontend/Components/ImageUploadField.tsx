"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import {
  uploadLibraryFile,
  deleteStorageObject,
  type LibraryStorageFolder,
} from "@/lib/api/storage";
import { extractErrorMessage } from "@/lib/api/client";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024; // matches the backend's question-images cap

export interface ImageUploadValue {
  url: string;
  key?: string; // present when we uploaded it ourselves this session — lets Remove clean up R2
}

interface ImageUploadFieldProps {
  label: string;
  value: ImageUploadValue | null;
  onChange: (value: ImageUploadValue | null) => void;
  folder?: LibraryStorageFolder;
  /** Compact mode for tight spaces like per-option image slots. */
  compact?: boolean;
}

// Direct-upload picker for question images, option images, explanation
// images, and passage images — replaces the old "paste an image URL"
// fields so the admin never has to host images somewhere else first.
// Falls over gracefully with a clear error until Cloudflare R2
// credentials (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY /
// R2_BUCKET) are set on the backend — everything else here is already
// wired to the real /storage/upload endpoint, so there's nothing left to
// build once those env vars are in place.
export default function ImageUploadField({
  label,
  value,
  onChange,
  folder = "question-images",
  compact = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG, or WEBP images are supported.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Image is ${(file.size / 1024 / 1024).toFixed(1)}MB — max is 5MB.`);
      return;
    }

    setUploading(true);
    setPercent(0);
    try {
      const result = await uploadLibraryFile(file, folder, (p) => setPercent(p.percent));
      onChange({ url: result.url, key: result.key });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    const key = value?.key;
    onChange(null);
    setError(null);
    if (key) {
      deleteStorageObject(key).catch(() => {});
    }
  }

  const boxSize = compact ? "h-20 w-20" : "h-32 w-full";

  return (
    <div>
      {label && (
        <label className="block text-[12px] font-semibold text-green-900 mb-1.5">{label}</label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {value?.url ? (
        <div
          className={`relative ${boxSize} rounded-xl overflow-hidden border border-gray-200 group`}>
          <Image
            src={value.url}
            alt={label}
            fill
            className="object-contain bg-gray-50"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              title="Replace image"
              className="p-1.5 rounded-lg bg-white/90 hover:bg-white transition-all">
              <RefreshCw size={14} className="text-gray-700" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              title="Remove image"
              className="p-1.5 rounded-lg bg-white/90 hover:bg-white transition-all">
              <X size={14} className="text-red-600" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`${boxSize} rounded-xl border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50/40 transition-all flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-green-700 disabled:opacity-60`}>
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[11px]">{percent}%</span>
            </>
          ) : (
            <>
              <Upload size={16} />
              {!compact && <span className="text-[11px] font-medium">Upload image</span>}
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-1.5 text-[11px] text-red-600 flex items-center gap-1">
          <AlertTriangle size={11} /> {error}
        </p>
      )}
    </div>
  );
}
