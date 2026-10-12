"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Download, Check, Settings, Send, Inbox, Loader2 } from "lucide-react";
import { StatsBar } from "./components/StatsBar";
import { FilterBar } from "./components/FilterBar";
import { AdminNotificationCard } from "./components/AdminNotificationCard";
import { EmptyState, Pagination } from "./components/EmptyAndPagination";
import { BroadcastComposer } from "./components/BroadcastComposer";
import { BroadcastHistory } from "./components/BroadcastHistory";
import { useAdminNotifications } from "./useAdminNotifications";
import { useBroadcasts } from "./useBroadcasts";

const ITEMS_PER_PAGE = 15;

type PageTab = "feed" | "broadcast";

export default function AdminNotificationsPage() {
  const [tab, setTab] = useState<PageTab>("feed");

  const {
    paginated,
    filtered,
    counts,
    filter,
    changeFilter,
    typeFilter,
    changeTypeFilter,
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
    exportLog,
  } = useAdminNotifications();

  const { broadcasts, isSending, lastError, sendBroadcast } = useBroadcasts();

  return (
    <div className="max-w-5xl mx-auto">
      {/* ─── HEADER ─── */}
      <div className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-3xl text-green-900 mb-1 flex items-center gap-3">
              <div className="relative">
                <Bell size={28} />
                {counts.unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {counts.unread > 99 ? "99+" : counts.unread}
                  </span>
                )}
              </div>
              Admin Notifications
            </h1>
            <p className="text-text-muted text-[14px]">
              System alerts, user activity, security events and platform updates.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {tab === "feed" && counts.unread > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-cream transition-all text-[14px] font-medium text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:ring-offset-2">
                <Check size={16} /> Mark all read
              </button>
            )}
            {tab === "feed" && (
              <button
                onClick={exportLog}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-cream transition-all text-[14px] font-medium text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:ring-offset-2">
                <Download size={16} /> Export Log
              </button>
            )}
            <Link
              href="/admin/settings/notifications"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-800 text-white hover:bg-green-700 transition-all text-[14px] font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:ring-offset-2">
              <Settings size={16} /> Settings
            </Link>
          </div>
        </div>
      </div>

      {/* ─── TAB TOGGLE ─── */}
      <div
        role="tablist"
        aria-label="Notifications view"
        className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          role="tab"
          id="tab-feed"
          aria-selected={tab === "feed"}
          aria-controls="panel-feed"
          tabIndex={tab === "feed" ? 0 : -1}
          onClick={() => setTab("feed")}
          className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium border-b-2 -mb-px transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:ring-offset-2 ${
            tab === "feed"
              ? "border-green-800 text-green-900"
              : "border-transparent text-text-muted hover:text-green-900"
          }`}>
          <Inbox size={16} /> Feed
          {counts.unread > 0 && (
            <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
              {counts.unread}
            </span>
          )}
        </button>
        <button
          role="tab"
          id="tab-broadcast"
          aria-selected={tab === "broadcast"}
          aria-controls="panel-broadcast"
          tabIndex={tab === "broadcast" ? 0 : -1}
          onClick={() => setTab("broadcast")}
          className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium border-b-2 -mb-px transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:ring-offset-2 ${
            tab === "broadcast"
              ? "border-green-800 text-green-900"
              : "border-transparent text-text-muted hover:text-green-900"
          }`}>
          <Send size={16} /> Broadcast
        </button>
      </div>

      {/* ─── FEED PANEL ─── */}
      {tab === "feed" && (
        <div id="panel-feed" role="tabpanel" aria-labelledby="tab-feed">
          {/* ─── STATS (clickable quick-filters) ─── */}
          <StatsBar counts={counts} activeFilter={filter} onFilterChange={changeFilter} />

          {/* ─── FILTER BAR ─── */}
          <FilterBar
            filter={filter}
            typeFilter={typeFilter}
            unreadCount={counts.unread}
            readCount={counts.resolved}
            archivedCount={counts.archived}
            onFilterChange={changeFilter}
            onTypeFilterChange={changeTypeFilter}
            onMarkAllRead={markAllAsRead}
            onArchiveAllRead={archiveAllRead}
            onDeleteArchived={deleteArchived}
          />

          {/* ─── NOTIFICATION LIST ─── */}
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
          ) : paginated.length === 0 ? (
            <EmptyState filter={filter} hasTypeFilter={typeFilter !== "all"} />
          ) : (
            <div className="space-y-3">
              {paginated.map((notification) => (
                <AdminNotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onArchive={archive}
                />
              ))}
            </div>
          )}

          {/* ─── PAGINATION ─── */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onChange={setCurrentPage}
          />
        </div>
      )}

      {/* ─── BROADCAST PANEL ─── */}
      {tab === "broadcast" && (
        <div id="panel-broadcast" role="tabpanel" aria-labelledby="tab-broadcast">
          <div className="mb-8">
            <h2 className="font-serif text-xl text-green-900 mb-4">Compose a broadcast</h2>
            <BroadcastComposer isSending={isSending} lastError={lastError} onSend={sendBroadcast} />
          </div>

          <div>
            <h2 className="font-serif text-xl text-green-900 mb-4">Sent history</h2>
            <BroadcastHistory broadcasts={broadcasts} />
          </div>
        </div>
      )}
    </div>
  );
}
