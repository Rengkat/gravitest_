"use client";

import Link from "next/link";
import { Bell, RotateCcw } from "lucide-react";
import type { Notification } from "../types";
import { NOTIFICATION_TYPE_CONFIG, CHANNEL_CONFIG } from "../constants";
import { resolveActionTarget, isExternalUrl } from "@/lib/notifications/href";

interface Props {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive?: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export function NotificationCard({ notification, onMarkRead, onArchive, onUnarchive }: Props) {
  const typeCfg = NOTIFICATION_TYPE_CONFIG[notification.type];
  const channelCfg = CHANNEL_CONFIG[notification.channel];
  const Icon = typeCfg?.icon ?? Bell;
  const ChanIcon = channelCfg?.icon ?? Bell;
  const isUnread = notification.status === "unread";
  const isArchived = notification.status === "archived";
  const targetUrl = resolveActionTarget(notification, "student");

  return (
    <div
      className={`relative p-4 rounded-2xl border transition-all duration-200 hover:shadow-md group ${
        isUnread
          ? "bg-green-50/60 border-green-200"
          : isArchived
            ? "bg-gray-50 border-gray-100 opacity-75"
            : "bg-white border-gray-100 hover:border-gray-200"
      }`}>
      {/* Unread left accent */}
      {isUnread && (
        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-green-600" />
      )}

      <div className="flex items-start gap-3 pl-1">
        {/* Type icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: typeCfg?.bg ?? "#f3f4f6" }}>
          <Icon size={18} style={{ color: typeCfg?.color ?? "#6b7280" }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title + meta row */}
          <div className="flex items-start justify-between gap-2 mb-0.5 flex-wrap">
            <h4
              className={`text-[14px] font-semibold leading-snug ${isUnread ? "text-green-900" : "text-gray-800"}`}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2 shrink-0">
              {/* Channel badge */}
              <span
                className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: `${channelCfg?.color}15`, color: channelCfg?.color }}>
                <ChanIcon size={9} />
                {channelCfg?.label}
              </span>
              <span className="text-[11px] text-gray-400">{timeAgo(notification.createdAt)}</span>
            </div>
          </div>

          {/* Type label */}
          <span
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: typeCfg?.color }}>
            {typeCfg?.label}
          </span>

          {/* Body */}
          <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">{notification.body}</p>

          {/* Action row */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {targetUrl &&
              (isExternalUrl(targetUrl) ? (
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => isUnread && onMarkRead(notification.id)}
                  className="text-[12px] font-semibold text-green-700 hover:text-green-800 transition-colors">
                  View Details →
                </a>
              ) : (
                <Link
                  href={targetUrl}
                  onClick={() => isUnread && onMarkRead(notification.id)}
                  className="text-[12px] font-semibold text-green-700 hover:text-green-800 transition-colors">
                  View Details →
                </Link>
              ))}
            {isUnread && (
              <button
                onClick={() => onMarkRead(notification.id)}
                className="text-[12px] text-gray-500 hover:text-green-700 transition-colors">
                Mark as read
              </button>
            )}
            {!isArchived ? (
              <button
                onClick={() => onArchive(notification.id)}
                className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors ml-auto">
                Archive
              </button>
            ) : onUnarchive ? (
              <button
                onClick={() => onUnarchive(notification.id)}
                className="text-[12px] text-gray-400 hover:text-green-700 transition-colors ml-auto flex items-center gap-1">
                <RotateCcw size={11} /> Restore
              </button>
            ) : null}
          </div>
        </div>

        {/* Unread dot */}
        {isUnread && <div className="w-2.5 h-2.5 rounded-full bg-green-600 shrink-0 mt-1.5" />}
      </div>
    </div>
  );
}
