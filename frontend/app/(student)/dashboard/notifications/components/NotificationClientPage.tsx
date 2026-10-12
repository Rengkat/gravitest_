"use client";

import Link from "next/link";
import { Bell, Settings, Loader2 } from "lucide-react";
import { useNotifications } from "../useNotifications";
import { NotificationStatsBar } from "./NotificationStatsBar";
import { FilterBar } from "./FilterBar";
import { NotificationCard } from "./NotificationCard";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";

const ITEMS_PER_PAGE = 10;

export default function NotificationsPage() {
  const {
    paginatedItems,
    filteredNotifications,
    counts,
    filter,
    changeFilter,
    channelFilter,
    changeChannel,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    error,
    reload,
    markAsRead,
    markAllAsRead,
    archive,
    archiveAllRead,
    deleteArchived,
    unarchive,
  } = useNotifications();

  return (
    <div className="max-w-3xl mx-auto">
      {/* ─── HEADER ─── */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-3xl text-green-900 mb-1 flex items-center gap-3">
              <div className="relative">
                <Bell size={28} />
                {counts.unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {counts.unread > 9 ? "9+" : counts.unread}
                  </span>
                )}
              </div>
              Notifications
            </h1>
            <p className="text-text-muted text-[14px]">
              Stay updated with your activity and platform announcements.
            </p>
          </div>

          <Link
            href="/dashboard/profile?section=notifications"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-cream transition-all text-[14px] font-medium text-text-muted">
            <Settings size={16} />
            Notification Settings
          </Link>
        </div>
      </div>

      {/* ─── STATS (clickable to filter) ─── */}
      <NotificationStatsBar counts={counts} activeFilter={filter} onFilterChange={changeFilter} />

      {/* ─── FILTER BAR ─── */}
      <FilterBar
        filter={filter}
        channelFilter={channelFilter}
        unreadCount={counts.unread}
        readCount={counts.read}
        archivedCount={counts.archived}
        onFilterChange={changeFilter}
        onChannelChange={changeChannel}
        onMarkAllRead={markAllAsRead}
        onArchiveAllRead={archiveAllRead}
        onDeleteArchived={deleteArchived}
      />

      {/* ─── CONTENT ─── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-green-600" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <p className="text-[14px] text-red-600">{error}</p>
          <button
            onClick={reload}
            className="px-4 py-2 rounded-xl bg-green-700 text-white text-[13px] font-medium hover:bg-green-800 transition-all"
          >
            Try again
          </button>
        </div>
      ) : paginatedItems.length === 0 ? (
        <EmptyState filter={filter} hasChannelFilter={channelFilter !== "all"} />
      ) : (
        <>
          <div className="space-y-3">
            {paginatedItems.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={markAsRead}
                onArchive={archive}
                onUnarchive={filter === "archived" ? unarchive : undefined}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredNotifications.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
