"use client";

import Link from "next/link";
import {
  ChevronRight,
  Eye,
  Download,
  Star,
  Clock,
  FileText,
  User,
  Calendar,
  Tag,
  Shield,
  Flame,
  CheckCircle2,
  Globe,
  Lock,
} from "lucide-react";
import type { ContentItem } from "@/types/admin-contents";
import { CONTENT_TYPES, ACCESS_LEVELS, STATUS_MAP, SUBJECTS } from "@/lib/constants/contents";
import { Badge } from "../../../contents/components/SharedPrimitives";

interface Props {
  item: ContentItem;
}

export function ContentDetailHeader({ item }: Props) {
  const typeCfg = CONTENT_TYPES[item.type];
  const accessCfg = ACCESS_LEVELS[item.accessLevel];
  const statusCfg = STATUS_MAP[item.status];
  const TypeIcon = typeCfg.icon;
  const subjectCfg = SUBJECTS[item.subject as keyof typeof SUBJECTS];

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 text-[12px] text-text-muted mb-5"
        aria-label="Breadcrumb">
        <Link href="/admin/content" className="hover:text-green-700 transition-colors">
          Library
        </Link>
        <ChevronRight size={12} />
        <Link
          href={`/admin/contents?type=${item.type}`}
          className="hover:text-green-700 transition-colors">
          {typeCfg.label}
        </Link>
        <ChevronRight size={12} />
        <span className="text-green-900 font-medium truncate max-w-[200px]">{item.title}</span>
      </nav>

      {/* Header card */}
      <div
        className="rounded-2xl bg-white border overflow-hidden"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        {/* Thumbnail strip */}
        <div className="relative h-48 bg-cream flex items-center justify-center overflow-hidden">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <TypeIcon size={72} className="opacity-10 text-green-900" />
          )}
          {/* gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm"
              style={{ background: `${typeCfg.color}dd`, color: "#fff" }}>
              <TypeIcon size={10} /> {typeCfg.label}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm"
              style={{ background: statusCfg.bg, color: statusCfg.text }}>
              {statusCfg.label}
            </span>
          </div>

          {/* Top-right flags */}
          <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
            {item.isFeatured && (
              <Badge label="Featured" color="#9333ea" bg="#9333ea20" icon={Star} size="xs" />
            )}
            {item.isTrending && (
              <Badge label="Trending" color="#ef4444" bg="#ef444420" icon={Flame} size="xs" />
            )}
            {item.isVerified && (
              <Badge
                label="Verified"
                color="#10b981"
                bg="#10b98120"
                icon={CheckCircle2}
                size="xs"
              />
            )}
          </div>

          {/* Duration badge */}
          {item.duration && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 text-white text-[10px] font-medium">
              <Clock size={9} /> {item.duration}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5">
          {/* Chip row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <Badge label={item.examLabel} color="#2e8b57" bg="#2e8b5715" size="xs" />
            <Badge
              label={item.audience === "secondary" ? "Secondary" : "Professional"}
              color={item.audience === "secondary" ? "#0284c7" : "#7c3aed"}
              bg={item.audience === "secondary" ? "#0284c715" : "#7c3aed15"}
              size="xs"
            />
            <Badge
              label={item.isFree ? "Free" : `₦${item.price.toLocaleString()}`}
              color={item.isFree ? "#10b981" : "#f59e0b"}
              bg={item.isFree ? "#10b98115" : "#f59e0b15"}
              icon={item.isFree ? Globe : Lock}
              size="xs"
            />
            {item.drmProtected && (
              <Badge label="DRM" color="#6b7280" bg="#6b728015" icon={Shield} size="xs" />
            )}
          </div>

          <h1 className="font-serif text-[22px] text-green-900 leading-snug mb-2">{item.title}</h1>

          {/* One-line meta */}
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-text-muted mb-3">
            <span className="flex items-center gap-1">
              <User size={11} /> {item.author}
            </span>
            {item.pages && (
              <span className="flex items-center gap-1">
                <FileText size={11} /> {item.pages} pages
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye size={11} /> {item.views.toLocaleString()} views
            </span>
            <span className="flex items-center gap-1">
              <Download size={11} /> {item.downloads.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-amber-500">
              <Star size={11} /> {item.rating} ({item.ratingCount})
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={11} /> {item.dateAdded}
            </span>
            <span className="ml-auto text-[11px] font-semibold text-green-700">
              {item.revenue > 0 ? `₦${(item.revenue / 1000).toFixed(0)}K revenue` : "—"}
            </span>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              <Tag size={11} className="text-text-muted mt-0.5 shrink-0" />
              {item.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full bg-gray-100 text-text-muted text-[10px] font-medium">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
