"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type {
  Notification, NotificationFilter, NotificationChannel,
  NotificationCounts, NotificationStatus,
} from "./types";
import * as notificationsApi from "@/lib/api/notifications";
import { extractErrorMessage } from "@/lib/api/client";
import { useNotificationStream } from "./useNotificationStream";

const ITEMS_PER_PAGE = 10;

// Backend rejects limit > 100 ("Limit cannot exceed 100"), so the full list
// is fetched page by page. MAX_PAGES caps it at 500 notifications.
const FETCH_PAGE_SIZE = 100;
const MAX_PAGES = 5;

async function fetchAllInbox(): Promise<Notification[]> {
  const all: Notification[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await notificationsApi.getInbox({
      limit: FETCH_PAGE_SIZE,
      page,
      sortBy: "createdAt",
      sortOrder: "DESC",
    });
    all.push(...(res.data ?? []));
    if (!res.meta?.hasNextPage) break;
  }
  return all;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter]               = useState<NotificationFilter>("all");
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | "all">("all");
  const [currentPage, setCurrentPage]     = useState(1);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  const knownIds = useRef<Set<string>>(new Set());

  // ─── LOAD FROM API ───────────────────────────────────────
  // Filters/pagination could be pushed server-side, but the existing UI
  // (FilterBar, Pagination components) was built around client-side
  // filtering of a full list — keeping that contract so those components
  // don't need to change. We fetch a generous page size and paginate
  // client-side, same as the mock data did.
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchAllInbox();
      setNotifications(items);
      knownIds.current = new Set(items.map((n) => n.id));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ─── LIVE PUSH (SSE) ─────────────────────────────────────
  useNotificationStream((incoming) => {
    setNotifications((prev) => {
      if (knownIds.current.has(incoming.id)) {
        return prev.map((n) => (n.id === incoming.id ? incoming : n));
      }
      knownIds.current.add(incoming.id);
      return [incoming, ...prev];
    });
  });

  // ─── COUNTS ──────────────────────────────────────────────
  const counts: NotificationCounts = useMemo(() => ({
    unread:   notifications.filter((n) => n.status === "unread").length,
    read:     notifications.filter((n) => n.status === "read").length,
    archived: notifications.filter((n) => n.status === "archived").length,
    total:    notifications.length,
  }), [notifications]);

  // ─── FILTERED SET ────────────────────────────────────────
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Status filter
      if (filter === "unread"   && n.status !== "unread")   return false;
      if (filter === "read"     && n.status !== "read")     return false;
      if (filter === "archived" && n.status !== "archived") return false;
      // Hide archived from "all" tab
      if (filter === "all" && n.status === "archived") return false;

      // Channel filter
      if (channelFilter !== "all" && n.channel !== channelFilter) return false;

      return true;
    });
  }, [notifications, filter, channelFilter]);

  const totalPages          = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const paginatedItems      = filteredNotifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // ─── HANDLERS ────────────────────────────────────────────
  const changeFilter = (f: NotificationFilter) => {
    setFilter(f);
    setCurrentPage(1);
  };

  const changeChannel = (c: NotificationChannel | "all") => {
    setChannelFilter(c);
    setCurrentPage(1);
  };

  // Optimistic update + API call; rolls back on failure.
  const markAsRead = (id: string) => {
    const prevState = notifications;
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id && n.status === "unread"
          ? { ...n, status: "read" as NotificationStatus, readAt: new Date().toISOString() }
          : n,
      ),
    );
    notificationsApi.markRead([id]).catch(() => setNotifications(prevState));
  };

  const markAllAsRead = () => {
    const prevState = notifications;
    setNotifications((prev) =>
      prev.map((n) =>
        n.status === "unread"
          ? { ...n, status: "read" as NotificationStatus, readAt: new Date().toISOString() }
          : n,
      ),
    );
    notificationsApi.markAllRead().catch(() => setNotifications(prevState));
  };

  const archive = (id: string) => {
    const prevState = notifications;
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, status: "archived" as NotificationStatus } : n,
      ),
    );
    notificationsApi.archiveNotification(id).catch(() => setNotifications(prevState));
  };

  const archiveAllRead = () => {
    const prevState = notifications;
    const readIds = notifications.filter((n) => n.status === "read").map((n) => n.id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.status === "read" ? { ...n, status: "archived" as NotificationStatus } : n,
      ),
    );
    Promise.all(readIds.map((id) => notificationsApi.archiveNotification(id))).catch(() =>
      setNotifications(prevState),
    );
  };

  const deleteArchived = () => {
    const prevState = notifications;
    setNotifications((prev) => prev.filter((n) => n.status !== "archived"));
    notificationsApi.clearNotifications().catch(() => setNotifications(prevState));
  };

  // No dedicated "unarchive" endpoint on the backend — closest equivalent
  // is marking it read again, which is what the mock version did too.
  const unarchive = (id: string) => {
    const prevState = notifications;
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, status: "read" as NotificationStatus } : n,
      ),
    );
    notificationsApi.markRead([id]).catch(() => setNotifications(prevState));
  };

  return {
    notifications,
    paginatedItems,
    filteredNotifications,
    counts,
    filter, changeFilter,
    channelFilter, changeChannel,
    currentPage, setCurrentPage,
    totalPages,
    isLoading,
    error,
    reload: load,
    markAsRead, markAllAsRead,
    archive, archiveAllRead,
    deleteArchived, unarchive,
  };
}
