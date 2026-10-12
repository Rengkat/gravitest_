"use client";

import { Archive, Trash2, Check } from "lucide-react";
import type { NotificationFilter, AdminNotificationType } from "../types";
import { FILTER_CONFIG, NOTIFICATION_TYPE_CONFIG } from "../constants";

interface Props {
  filter: NotificationFilter;
  typeFilter: string;
  unreadCount: number;
  readCount: number;
  archivedCount: number;
  onFilterChange: (f: NotificationFilter) => void;
  onTypeFilterChange: (t: string) => void;
  onMarkAllRead: () => void;
  onArchiveAllRead: () => void;
  onDeleteArchived: () => void;
}

export function FilterBar({
  filter,
  typeFilter,
  unreadCount,
  readCount,
  archivedCount,
  onFilterChange,
  onTypeFilterChange,
  onMarkAllRead,
  onArchiveAllRead,
  onDeleteArchived,
}: Props) {
  return (
    <div
      className="bg-white rounded-2xl border p-4 mb-6"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      {/* Filter chips + bulk actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_CONFIG.map(({ key, label, color }) => {
            const active = filter === key;
            const countMap: Partial<Record<NotificationFilter, number>> = {
              unread: unreadCount,
              read: readCount,
              archived: archivedCount,
            };
            const count = countMap[key];

            return (
              <button
                key={key}
                onClick={() => onFilterChange(key)}
                className={`px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                  active
                    ? "text-white shadow-sm"
                    : "bg-white text-text-muted border border-gray-200 hover:border-opacity-60"
                }`}
                style={active ? { background: color, borderColor: color } : {}}>
                {label}
                {count !== undefined && count > 0 && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      active ? "bg-white/25 text-white" : "bg-gray-100 text-gray-600"
                    }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bulk actions */}
        <div className="flex gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-green-700 hover:bg-green-50 transition-colors">
              <Check size={13} /> Mark all read
            </button>
          )}
          {readCount > 0 && (
            <button
              onClick={onArchiveAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
              <Archive size={13} /> Archive resolved
            </button>
          )}
          {archivedCount > 0 && filter === "archived" && (
            <button
              onClick={onDeleteArchived}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={13} /> Clear archived
            </button>
          )}
        </div>
      </div>

      {/* Type filter dropdown */}
      <div
        className="flex items-center gap-3 mt-4 pt-4 border-t"
        style={{ borderColor: "rgba(30,80,50,0.06)" }}>
        <span className="text-[12px] font-semibold text-text-muted shrink-0">Type:</span>
        <select
          title="filter"
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20">
          <option value="all">All Types</option>
          {(
            Object.entries(NOTIFICATION_TYPE_CONFIG) as [
              AdminNotificationType,
              (typeof NOTIFICATION_TYPE_CONFIG)[AdminNotificationType],
            ][]
          ).map(([type, cfg]) => (
            <option key={type} value={type}>
              {cfg.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
