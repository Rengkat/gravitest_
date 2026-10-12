import {
  BookOpen,
  Video,
  ImageIcon,
  FileText,
  Library as LibraryIcon,
  Star,
  Crown,
  Lock,
} from "lucide-react";
import { ContentType } from "@/types/library";

export function TypeIcon({ type, size = 14 }: { type: ContentType; size?: number }) {
  switch (type) {
    case "ebooks":   return <BookOpen size={size} />;
    case "videos":   return <Video size={size} />;
    case "images":   return <ImageIcon size={size} />;
    case "documents":return <FileText size={size} />;
    default:         return <LibraryIcon size={size} />;
  }
}

export function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={
            i <= Math.floor(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200"
          }
        />
      ))}
      <span className="text-[11px] font-semibold text-gray-500 ml-0.5">{rating}</span>
      {count && (
        <span className="text-[10px] text-gray-400">({count.toLocaleString()})</span>
      )}
    </div>
  );
}

export function PremiumBadge({ price }: { price?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
      <Crown size={9} />
      {price ? `₦${price.toLocaleString()}` : "PRO"}
    </span>
  );
}

export function FreeBadge() {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-600 text-white">
      FREE
    </span>
  );
}

export function PreviewBadge() {
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
      Preview Available
    </span>
  );
}

export function LockedOverlay() {
  return (
    <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-t-2xl">
      <div className="bg-white/90 rounded-full p-2.5 shadow-lg">
        <Lock size={20} className="text-amber-600" />
      </div>
    </div>
  );
}
