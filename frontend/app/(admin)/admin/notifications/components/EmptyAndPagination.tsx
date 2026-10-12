"use client";

import { Bell, CheckCircle, Archive, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import type { NotificationFilter } from "../types";

// ─── EMPTY STATE ─────────────────────────────────────────────
const EMPTY_COPY: Record<NotificationFilter, { icon: any; title: string; body: string }> = {
  all: {
    icon: Bell,
    title: "All caught up!",
    body: "No new admin notifications. Everything is running smoothly.",
  },
  unread: {
    icon: Bell,
    title: "No unread notifications",
    body: "All notifications have been reviewed.",
  },
  read: {
    icon: CheckCircle,
    title: "No resolved notifications",
    body: "Notifications you resolve will appear here.",
  },
  archived: {
    icon: Archive,
    title: "Archive is empty",
    body: "Notifications you archive will be stored here for reference.",
  },
  high: {
    icon: Bell,
    title: "No urgent notifications",
    body: "There are currently no high-priority alerts. Platform is healthy.",
  },
  medium: {
    icon: Bell,
    title: "No medium priority items",
    body: "No medium-priority notifications match the current filter.",
  },
  low: {
    icon: Bell,
    title: "No low priority items",
    body: "No low-priority notifications match the current filter.",
  },
};

export function EmptyState({
  filter,
  hasTypeFilter,
}: {
  filter: NotificationFilter;
  hasTypeFilter: boolean;
}) {
  const copy = EMPTY_COPY[filter];
  const Icon = copy.icon;

  return (
    <div
      className="text-center py-20 bg-white rounded-2xl border"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        {hasTypeFilter ? (
          <Filter size={28} className="text-gray-300" />
        ) : (
          <Icon size={28} className="text-gray-300" />
        )}
      </div>
      <h3 className="text-[17px] font-semibold text-gray-700 mb-1">
        {hasTypeFilter ? "No notifications for this type" : copy.title}
      </h3>
      <p className="text-[13px] text-gray-400 max-w-xs mx-auto">
        {hasTypeFilter
          ? "Try selecting a different notification type or clearing the type filter."
          : copy.body}
      </p>
    </div>
  );
}

// ─── PAGINATION ───────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalItems);

  const pages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => i + Math.max(1, Math.min(currentPage - 2, totalPages - 4)),
  );

  return (
    <div className="flex items-center justify-between mt-6">
      <span className="text-[13px] text-gray-500">
        Showing{" "}
        <span className="font-semibold text-green-900">
          {from}–{to}
        </span>{" "}
        of <span className="font-semibold text-green-900">{totalItems}</span>
      </span>

      <div className="flex items-center gap-2">
        <button
          title="previous page"
          onClick={() => onChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
          <ChevronLeft size={16} />
        </button>

        <div className="flex gap-1">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-all ${
                p === currentPage
                  ? "bg-green-800 text-white"
                  : "border border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}>
              {p}
            </button>
          ))}
        </div>

        <button
          title="next page"
          onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-40">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
