"use client";

import { Sparkles, Crown, Lock, Play, ChevronRight } from "lucide-react";
import { LibraryItem } from "@/types/library";
import { SUBJECT_GRADIENTS } from "@/lib/constants/library";
import { TypeIcon } from "./ui";
import { formatPrice, isItemLocked, typeColor } from "@/lib/constants/helpers";

interface FeaturedBannerProps {
  items: LibraryItem[];
  onAccess: (item: LibraryItem) => void;
}

export default function FeaturedBanner({ items, onAccess }: FeaturedBannerProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-amber-500" />
        <h2 className="text-[14px] font-bold text-gray-800">Featured Resources</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => {
          const colors = typeColor(item.type);
          return (
            <div
              key={item.id}
              className={`shrink-0 w-72 rounded-2xl bg-gradient-to-br ${SUBJECT_GRADIENTS[item.subject] ?? SUBJECT_GRADIENTS.all} border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer`}
              onClick={() => onAccess(item)}
            >
              <div className="p-4 flex items-start gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                  <TypeIcon type={item.type} size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {isItemLocked(item) ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-0.5">
                        <Crown size={8} /> {item.price ? formatPrice(item.price) : "PRO"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-600 text-white">FREE</span>
                    )}
                    {item.isTrending && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">HOT</span>
                    )}
                  </div>
                  <h3 className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-snug mb-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">⭐ {item.rating}</span>
                    <span className={`text-[11px] font-semibold flex items-center gap-1 ${isItemLocked(item) ? "text-amber-700" : "text-green-700"} group-hover:underline`}>
                      {item.type === "videos" ? (
                        <><Play size={11} /> Watch</>
                      ) : isItemLocked(item) ? (
                        <><Lock size={11} /> Unlock</>
                      ) : (
                        <>Access <ChevronRight size={11} /></>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
