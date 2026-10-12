// ─── Related ──────────────────────────────────────────────────────────────────

import { Star } from "lucide-react";
import { CONTENT_CFG, fmtDuration, fmtPrice, SUBJECT_CFG } from "../config";
import { RelatedItem } from "../types";
import Link from "next/link";

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={
            s <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          }
        />
      ))}
    </span>
  );
}

export function RelatedTab({ items }: { items: RelatedItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const cfg = CONTENT_CFG[item.contentType];
        const Icon = cfg.icon;
        const sub = item.subject ? SUBJECT_CFG[item.subject] : null;

        const accessLabel = item.isFree
          ? { text: "Free", color: "#10b981" }
          : item.requiredTier
            ? { text: item.requiredTier, color: "#8b5cf6" }
            : { text: fmtPrice(item.priceKobo!), color: "#f59e0b" };

        const meta = item.durationSeconds
          ? fmtDuration(item.durationSeconds)
          : item.totalPages
            ? `${item.totalPages} pages`
            : "";

        return (
          <Link
            key={item.id}
            href={`/dashboard/library/${item.id}`}
            className="flex gap-3 p-3 rounded-2xl bg-white border hover:border-green-300 hover:shadow-sm transition-all"
            style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            {/* Thumb */}
            <div
              className="w-20 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{ background: cfg.bg }}>
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon size={22} style={{ color: cfg.color }} />
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <Icon size={11} style={{ color: cfg.color }} />
                <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                {sub && <span className="text-[10px] text-text-muted">· {sub.label}</span>}
              </div>
              <p className="text-[13px] font-semibold text-green-900 leading-snug line-clamp-2">
                {item.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Stars rating={item.averageRating} size={10} />
                <span className="text-[10px] text-text-muted">{item.averageRating.toFixed(1)}</span>
                {meta && <span className="text-[10px] text-text-muted">· {meta}</span>}
                <span
                  className="ml-auto text-[11px] font-semibold"
                  style={{ color: accessLabel.color }}>
                  {accessLabel.text}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
