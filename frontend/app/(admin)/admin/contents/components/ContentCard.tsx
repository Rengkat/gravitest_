"use client";

import Link from "next/link";
import { Eye, Edit, Trash2, Star, Download, Play, Flame } from "lucide-react";
import type { ContentItem } from "@/types/admin-contents";
import { CONTENT_TYPES, ACCESS_LEVELS, STATUS_MAP } from "@/lib/constants/contents";
import { Badge } from "./SharedPrimitives";
import { htmlToPlainText } from "@/Components/rich-text/RichTextRenderer";

interface Props {
  item: ContentItem;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string) => void;
}

export function ContentCard({ item, onDelete, onToggleFeatured }: Props) {
  const typeConfig = CONTENT_TYPES[item.type];
  const accessConfig = ACCESS_LEVELS[item.accessLevel];
  const statusConfig = STATUS_MAP[item.status];
  const TypeIcon = typeConfig.icon;
  const AccessIcon = accessConfig.icon;

  return (
    <div
      className="rounded-2xl bg-white border overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg group"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      {/* Thumbnail */}
      <div className="relative h-40 bg-cream flex items-center justify-center overflow-hidden">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <TypeIcon size={48} className="opacity-20 text-green-900" />
        )}

        {/* Left badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Badge
            label={typeConfig.label}
            color={typeConfig.color}
            bg={typeConfig.bg}
            icon={TypeIcon}
            size="xs"
          />
          {item.isFree ? (
            <Badge label="FREE" color="#10b981" bg="#10b98120" size="xs" />
          ) : (
            <Badge
              label={`₦${item.price.toLocaleString()}`}
              color="#d97706"
              bg="#f59e0b20"
              size="xs"
            />
          )}
        </div>

        {/* Right badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {item.isFeatured && (
            <Badge label="Featured" color="#9333ea" bg="#9333ea20" icon={Star} size="xs" />
          )}
          {item.isTrending && (
            <Badge label="Trending" color="#ef4444" bg="#ef444420" icon={Flame} size="xs" />
          )}
          {item.isNew && <Badge label="New" color="#3b82f6" bg="#3b82f620" size="xs" />}
        </div>

        {/* Duration for video / audio */}
        {item.duration && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 text-white text-[10px] font-medium">
            <Play size={8} /> {item.duration}
          </div>
        )}

        {/* Status */}
        <div
          className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-semibold"
          style={{ background: statusConfig.bg, color: statusConfig.text }}>
          {statusConfig.label}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Exam + audience pill */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <Badge label={item.examLabel} color="#2e8b57" bg="#2e8b5715" size="xs" />
          <Badge
            label={item.audience === "secondary" ? "Secondary" : "Professional"}
            color={item.audience === "secondary" ? "#0284c7" : "#7c3aed"}
            bg={item.audience === "secondary" ? "#0284c715" : "#7c3aed15"}
            size="xs"
          />
          <Badge
            label={accessConfig.label}
            color={accessConfig.color}
            bg={accessConfig.bg}
            icon={AccessIcon}
            size="xs"
          />
        </div>

        <h3 className="text-[14px] font-semibold text-green-900 mb-1 line-clamp-2 leading-tight">
          {item.title}
        </h3>
        <p className="text-[11px] text-text-muted mb-3 line-clamp-2">{htmlToPlainText(item.description)}</p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px] text-text-muted mb-2">
          <span className="flex items-center gap-0.5">
            <Eye size={11} /> {item.views.toLocaleString()}
          </span>
          <span className="flex items-center gap-0.5">
            <Download size={11} /> {item.downloads.toLocaleString()}
          </span>
          <span className="flex items-center gap-0.5 text-yellow-500">
            <Star size={11} /> {item.rating}
          </span>
          <span className="ml-auto text-green-700 font-semibold text-[10px]">
            {item.revenue > 0 ? `₦${(item.revenue / 1000).toFixed(0)}K` : "—"}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-text-muted mb-3">
          <span>{item.size}</span>
          {item.pages && <span>{item.pages} pages</span>}
          <span>
            by{" "}
            <span className="text-green-900 font-medium">
              {item.author.split(" ").slice(-1)[0]}
            </span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/contents/${item.id}`}
            className="flex-1 py-2 rounded-lg bg-green-800 text-white text-[12px] font-semibold text-center hover:bg-green-700 transition-all flex items-center justify-center gap-1">
            <Eye size={12} /> View
          </Link>
          <button className="p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Edit">
            <Edit size={14} className="text-text-muted hover:text-blue-600" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete">
            <Trash2 size={14} className="text-text-muted hover:text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
