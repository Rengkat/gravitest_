"use client";

import Link from "next/link";
import { Bell, Archive, Check, ExternalLink } from "lucide-react";
import type { AdminNotification } from "../types";
import { NOTIFICATION_TYPE_CONFIG, PRIORITY_CONFIG } from "../constants";
import { resolveActionTarget, isExternalUrl } from "@/lib/notifications/href";

interface Props {
  notification: AdminNotification;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

/** Render a few key metadata values as inline pills */
function MetadataPills({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata) return null;

  const interesting = Object.entries(metadata)
    .filter(([, v]) => typeof v !== "object" && v !== null && v !== undefined)
    .slice(0, 3);

  if (interesting.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {interesting.map(([k, v]) => (
        <span
          key={k}
          className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-mono text-gray-600">
          {k}: <span className="font-semibold">{String(v)}</span>
        </span>
      ))}
    </div>
  );
}

export function AdminNotificationCard({ notification, onMarkRead, onArchive }: Props) {
  const typeCfg = NOTIFICATION_TYPE_CONFIG[notification.type];
  const priorityCfg = PRIORITY_CONFIG[notification.priority];
  const Icon = typeCfg?.icon ?? Bell;
  const isUnread = notification.status === "unread";
  const isArchived = notification.status === "archived";

  return (
    <div
      className={`relative p-4 rounded-2xl border transition-all duration-200 hover:shadow-md group ${
        isUnread
          ? "bg-green-50/50 border-green-200"
          : isArchived
            ? "bg-gray-50/70 border-gray-100 opacity-75"
            : "bg-white border-gray-100 hover:border-gray-200"
      } ${notification.priority === "high" && isUnread ? "border-l-4 border-l-red-400" : ""}`}
      style={{ borderColor: isUnread ? "#86efac" : "rgba(30,80,50,0.08)" }}>
      {/* Priority left accent */}
      {notification.priority === "high" && isUnread && (
        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-red-500" />
      )}

      <div className="flex items-start gap-4 pl-1">
        {/* Type icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: typeCfg?.bg ?? "#f3f4f6" }}>
          <Icon size={20} style={{ color: typeCfg?.color ?? "#6b7280" }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2 flex-wrap mb-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`text-[14px] font-semibold leading-snug ${
                  isUnread ? "text-green-900" : "text-gray-800"
                }`}>
                {notification.title}
              </h4>

              {/* Priority badge */}
              {notification.priority === "high" && (
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse"
                  style={{ background: priorityCfg.bg, color: priorityCfg.color }}>
                  URGENT
                </span>
              )}
              {notification.priority === "medium" && (
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ background: priorityCfg.bg, color: priorityCfg.color }}>
                  MEDIUM
                </span>
              )}
            </div>

            {/* Time + type + status row */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: typeCfg?.bg, color: typeCfg?.color }}>
                {typeCfg?.label}
              </span>
              <span className="text-[11px] text-gray-400">{timeAgo(notification.createdAt)}</span>
              {!isUnread && !isArchived && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[9px] font-semibold">
                  Resolved
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <p className="text-[13px] text-gray-600 leading-relaxed">{notification.body}</p>

          {/* Metadata pills */}
          <MetadataPills metadata={notification.metadata} />

          {/* Action row */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {(() => {
              const targetUrl = resolveActionTarget(notification, "admin");
              if (!targetUrl) return null;
              return isExternalUrl(targetUrl) ? (
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => isUnread && onMarkRead(notification.id)}
                  className="flex items-center gap-1 text-[12px] font-semibold text-green-700 hover:text-green-800 transition-colors">
                  View Details <ExternalLink size={11} />
                </a>
              ) : (
                <Link
                  href={targetUrl}
                  onClick={() => isUnread && onMarkRead(notification.id)}
                  className="flex items-center gap-1 text-[12px] font-semibold text-green-700 hover:text-green-800 transition-colors">
                  View Details <ExternalLink size={11} />
                </Link>
              );
            })()}
            {isUnread && (
              <button
                onClick={() => onMarkRead(notification.id)}
                className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-green-700 transition-colors">
                <Check size={12} /> Mark resolved
              </button>
            )}
            {!isArchived && (
              <button
                onClick={() => onArchive(notification.id)}
                className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors ml-auto">
                <Archive size={12} /> Archive
              </button>
            )}
          </div>
        </div>

        {/* Unread indicator dot */}
        {isUnread && (
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 mt-2"
            style={{ background: notification.priority === "high" ? "#ef4444" : "#3b82f6" }}
          />
        )}
      </div>
    </div>
  );
}
