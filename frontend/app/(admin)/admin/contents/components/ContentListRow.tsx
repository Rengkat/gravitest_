"use client";

import Link from "next/link";
import { Eye, Edit, Trash2, Star, Download } from "lucide-react";
import type { ContentItem } from "@/types/admin-contents";
import { CONTENT_TYPES, ACCESS_LEVELS, STATUS_MAP } from "@/lib/constants/contents";
import { Badge } from "./SharedPrimitives";

interface Props {
  item: ContentItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ContentListRow({ item, isSelected, onToggleSelect, onDelete }: Props) {
  const typeConfig = CONTENT_TYPES[item.type];
  const accessConfig = ACCESS_LEVELS[item.accessLevel];
  const statusConfig = STATUS_MAP[item.status];
  const TypeIcon = typeConfig.icon;
  const AccessIcon = accessConfig.icon;

  return (
    <div
      className={`p-4 rounded-2xl bg-white border flex items-center gap-4 hover:bg-cream/30 transition-colors ${isSelected ? "ring-2 ring-green-800/20" : ""}`}
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      {/* Checkbox */}
      <input
        title="toggle"
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleSelect(item.id)}
        className="w-4 h-4 rounded border-gray-300 text-green-800 shrink-0"
      />

      {/* Type icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: typeConfig.bg }}>
        <TypeIcon size={22} style={{ color: typeConfig.color }} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-[14px] font-semibold text-green-900 truncate">{item.title}</h3>
          <Badge label={typeConfig.label} color={typeConfig.color} bg={typeConfig.bg} size="xs" />
          <Badge
            label={accessConfig.label}
            color={accessConfig.color}
            bg={accessConfig.bg}
            icon={AccessIcon}
            size="xs"
          />
          <Badge
            label={item.audience === "secondary" ? "Secondary" : "Professional"}
            color={item.audience === "secondary" ? "#0284c7" : "#7c3aed"}
            bg={item.audience === "secondary" ? "#0284c715" : "#7c3aed15"}
            size="xs"
          />
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ background: statusConfig.bg, color: statusConfig.text }}>
            {statusConfig.label}
          </span>
          {item.isFeatured && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-600">
              Featured
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-[12px] text-text-muted flex-wrap">
          <span>{item.author}</span>
          <span>•</span>
          <span className="text-green-700 font-medium">{item.examLabel}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye size={11} /> {item.views.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Download size={11} /> {item.downloads.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 text-yellow-500">
            <Star size={11} /> {item.rating}
          </span>
          <span>•</span>
          <span>{item.size}</span>
          {item.duration && <span>• {item.duration}</span>}
        </div>
      </div>

      {/* Price + revenue */}
      <div className="text-right shrink-0 hidden md:block">
        {item.isFree ? (
          <span className="text-[13px] font-bold text-green-600">FREE</span>
        ) : (
          <>
            <div className="text-[13px] font-bold text-green-900">
              ₦{item.price.toLocaleString()}
            </div>
            {item.discountPrice && (
              <div className="text-[11px] text-text-muted line-through">
                ₦{item.discountPrice.toLocaleString()}
              </div>
            )}
          </>
        )}
        {item.revenue > 0 && (
          <div className="text-[10px] text-text-muted mt-0.5">
            ₦{(item.revenue / 1000).toFixed(0)}K earned
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/admin/contents/${item.id}`}
          className="p-2 rounded-lg hover:bg-green-50 transition-colors">
          <Eye size={16} className="text-text-muted hover:text-green-600" />
        </Link>
        <button title="edit" className="p-2 rounded-lg hover:bg-blue-50 transition-colors">
          <Edit size={16} className="text-text-muted hover:text-blue-600" />
        </button>
        <button
          title="delete"
          onClick={() => onDelete(item.id)}
          className="p-2 rounded-lg hover:bg-red-50 transition-colors">
          <Trash2 size={16} className="text-text-muted hover:text-red-500" />
        </button>
      </div>
    </div>
  );
}
