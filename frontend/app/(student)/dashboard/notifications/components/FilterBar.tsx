"use client";

import { Check, Archive, Trash2 } from "lucide-react";
import type { NotificationFilter, NotificationChannel } from "../types";
import { CHANNEL_CONFIG } from "../constants";

interface Props {
  filter: NotificationFilter;
  channelFilter: NotificationChannel | "all";
  unreadCount: number;
  readCount: number;
  onFilterChange: (f: NotificationFilter) => void;
  onChannelChange: (c: NotificationChannel | "all") => void;
  onMarkAllRead: () => void;
  onArchiveAllRead: () => void;
  onDeleteArchived: () => void;
  archivedCount: number;
}

export function FilterBar({
  filter,
  channelFilter,
  unreadCount,
  readCount,
  archivedCount,
  onFilterChange,
  onChannelChange,
  onMarkAllRead,
  onArchiveAllRead,
  onDeleteArchived,
}: Props) {
  return (
    <div
      className="bg-white rounded-2xl border p-4 mb-6"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      {/* Status tabs + bulk actions row */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        {/* Status filter chips */}
        <div className="flex gap-2 flex-wrap">
          {(
            [
              { key: "all", label: "All" },
              { key: "unread", label: "Unread", count: unreadCount },
              { key: "read", label: "Read", count: readCount },
              { key: "archived", label: "Archived", count: archivedCount },
            ] as { key: NotificationFilter; label: string; count?: number }[]
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                filter === key
                  ? "bg-green-800 text-white shadow-sm"
                  : "bg-white text-text-muted border border-gray-200 hover:border-green-400 hover:text-green-800"
              }`}>
              {label}
              {count !== undefined && count > 0 && (
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    filter === key ? "bg-white/25 text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bulk actions */}
        <div className="flex gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-green-700 hover:bg-green-50 transition-colors">
              <Check size={14} /> Mark all read
            </button>
          )}
          {readCount > 0 && (
            <button
              onClick={onArchiveAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
              <Archive size={14} /> Archive all read
            </button>
          )}
          {archivedCount > 0 && filter === "archived" && (
            <button
              onClick={onDeleteArchived}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={14} /> Clear archived
            </button>
          )}
        </div>
      </div>

      {/* Channel filter row */}
      <div
        className="flex items-center gap-2 mt-4 pt-4 border-t flex-wrap"
        style={{ borderColor: "rgba(30,80,50,0.06)" }}>
        <span className="text-[11px] text-gray-400 font-medium mr-1">Channel:</span>

        <button
          onClick={() => onChannelChange("all")}
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
            channelFilter === "all"
              ? "bg-green-800 text-white"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          }`}>
          All
        </button>

        {(Object.keys(CHANNEL_CONFIG) as NotificationChannel[]).map((ch) => {
          const cfg = CHANNEL_CONFIG[ch];
          const Icon = cfg.icon;
          const active = channelFilter === ch;
          return (
            <button
              key={ch}
              onClick={() => onChannelChange(ch)}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                active ? "text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
              style={active ? { background: cfg.color } : {}}>
              <Icon size={11} />
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
