"use client";

import { useRouter } from "next/navigation";
import {
  Heart,
  Share2,
  Download,
  Play,
  Eye,
  BookOpen,
  Clock,
  Flame,
  Lock,
  Crown,
} from "lucide-react";
import { LibraryItem } from "@/types/library";
import { htmlToPlainText } from "@/Components/rich-text/RichTextRenderer";
import {
  typeColor,
  typeLabel,
  formatNumber,
  formatPrice,
  accessLabel,
  isItemLocked,
} from "@/lib/constants/helpers";
import { SUBJECT_GRADIENTS } from "@/lib/constants/library";
import { TypeIcon, StarRating } from "./ui";

interface LibraryCardProps {
  item: LibraryItem;
  liked: boolean;
  bookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onAccess: () => void;
}

export default function LibraryCard({
  item,
  liked,
  bookmarked,
  onLike,
  onBookmark,
  onShare,
  onAccess,
}: LibraryCardProps) {
  const router = useRouter();
  const colors = typeColor(item.type);
  const locked = isItemLocked(item);

  const handleCardClick = () => {
    router.push(`library/${item.id}?preview=${locked}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer">
      {/* Illustration / thumbnail area */}
      <div
        className={`relative h-40 bg-gradient-to-br ${SUBJECT_GRADIENTS[item.subject] ?? SUBJECT_GRADIENTS.all} flex items-center justify-center overflow-hidden`}>
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            {/* Watermark icon */}
            <div className="opacity-10 absolute inset-0 flex items-center justify-center">
              <TypeIcon type={item.type} size={100} />
            </div>

            {/* Centre icon */}
            <div
              className={`relative w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center shadow-sm`}>
              <TypeIcon type={item.type} size={26} />
            </div>
          </>
        )}

        {/* Video play button hover */}
        {item.type === "videos" && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play size={20} className="text-red-600 ml-1" />
            </div>
          </div>
        )}

        {/* Premium lock overlay */}
        {locked && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
              <Lock size={14} className="text-amber-600" />
              <span className="text-[12px] font-bold text-amber-700">
                {item.price ? formatPrice(item.price) : "Premium"}
              </span>
            </div>
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {item.isNew && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-600 text-white">
              New
            </span>
          )}
          {item.isTrending && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white flex items-center gap-0.5">
              <Flame size={9} /> Hot
            </span>
          )}
          {locked && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-0.5">
              <Crown size={9} /> {item.price ? formatPrice(item.price) : "Pro"}
            </span>
          )}
          {item.isPremium && !locked && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-600/90 text-white flex items-center gap-0.5">
              <Crown size={9} /> Unlocked
            </span>
          )}
          {!item.isPremium && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-600/90 text-white">
              Free
            </span>
          )}
        </div>

        {/* Top-right: type pill */}
        <div
          className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.bg} ${colors.text}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          {typeLabel(item.type)}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[13px] font-bold text-gray-900 leading-snug mb-1.5 line-clamp-2 group-hover:text-green-800 transition-colors">
          {item.title}
        </h3>
        <p className="text-[12px] text-gray-500 leading-relaxed mb-3 line-clamp-2 flex-1">
          {htmlToPlainText(item.description)}
        </p>

        {/* Preview badge */}
        {locked && item.previewAvailable && (
          <div className="mb-2">
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              Preview Available
            </span>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-3">
          {item.pages && (
            <span className="flex items-center gap-1">
              <BookOpen size={11} />
              {item.pages}p
            </span>
          )}
          {item.duration && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {item.duration}
            </span>
          )}
          {item.size && (
            <span className="flex items-center gap-1">
              <Download size={11} />
              {item.size}
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Eye size={11} />
            {formatNumber(item.views)}
          </span>
        </div>

        <StarRating rating={item.rating} count={item.ratingCount} />

        {/* Footer actions */}
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className={`p-1.5 rounded-lg transition-all ${liked ? "text-red-500 bg-red-50" : "text-gray-400 hover:text-red-400 hover:bg-red-50"}`}
              aria-label="Like">
              <Heart size={14} fill={liked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookmark();
              }}
              className={`p-1.5 rounded-lg transition-all ${bookmarked ? "text-blue-500 bg-blue-50" : "text-gray-400 hover:text-blue-400 hover:bg-blue-50"}`}
              aria-label="Bookmark">
              {/* Bookmark icon inline to avoid import issues */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={bookmarked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"
              aria-label="Share">
              <Share2 size={14} />
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAccess();
            }}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
              locked
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}>
            {locked && <Lock size={11} />}
            {accessLabel(item)}
          </button>
        </div>
      </div>
    </div>
  );
}
