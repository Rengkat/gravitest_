"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type {
  AdminNotification,
  AdminNotificationCounts,
  NotificationFilter,
  NotificationStatus,
} from "./types";
import * as adminAlertsApi from "@/lib/api/admin-alerts";
import { extractErrorMessage } from "@/lib/api/client";

const ITEMS_PER_PAGE = 15;

// Backend rejects limit > 100 ("Limit cannot exceed 100"), so the full list
// is fetched page by page. MAX_PAGES caps it at 500 alerts.
const FETCH_PAGE_SIZE = 100;
const MAX_PAGES = 5;

async function fetchAllAlerts(): Promise<AdminNotification[]> {
  const all: AdminNotification[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await adminAlertsApi.getAdminAlerts({
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

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchAllAlerts();
      setNotifications(items);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ─── COUNTS ──────────────────────────────────────────────
  const counts: AdminNotificationCounts = useMemo(
    () => ({
      total: notifications.length,
      unread: notifications.filter((n) => n.status === "unread").length,
      highPriority: notifications.filter((n) => n.priority === "high" && n.status === "unread")
        .length,
      resolved: notifications.filter((n) => n.status === "read").length,
      archived: notifications.filter((n) => n.status === "archived").length,
    }),
    [notifications],
  );

  // ─── FILTERED LIST ────────────────────────────────────────
  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      // Status / priority filter
      if (filter === "unread" && n.status !== "unread") return false;
      if (filter === "read" && n.status !== "read") return false;
      if (filter === "archived" && n.status !== "archived") return false;
      if (filter === "high" && n.priority !== "high") return false;
      if (filter === "medium" && n.priority !== "medium") return false;
      if (filter === "low" && n.priority !== "low") return false;
      // Hide archived from "all" view
      if (filter === "all" && n.status === "archived") return false;

      // Type filter
      if (typeFilter !== "all" && n.type !== typeFilter) return false;

      return true;
    });
  }, [notifications, filter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // ─── HANDLERS ────────────────────────────────────────────
  const changeFilter = (f: NotificationFilter) => {
    setFilter(f);
    setCurrentPage(1);
  };

  const changeTypeFilter = (t: string) => {
    setTypeFilter(t);
    setCurrentPage(1);
  };

  // "Mark read" on an admin alert means "I've acknowledged/resolved this" —
  // wired to PATCH /admin/alerts/:id/resolve (sets resolvedAt + resolvedBy),
  // not the plainer /:id/read, since the card's button literally reads
  // "Mark resolved".
  const markAsRead = useCallback((id: string) => {
    const prevState = notifications;
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id && n.status === "unread" ? { ...n, status: "read" as NotificationStatus } : n,
      ),
    );
    adminAlertsApi.resolveAlert(id).catch(() => setNotifications(prevState));
  }, [notifications]);

  const markAllAsRead = useCallback(() => {
    const prevState = notifications;
    setNotifications((prev) =>
      prev.map((n) => (n.status === "unread" ? { ...n, status: "read" as NotificationStatus } : n)),
    );
    adminAlertsApi.markAllAlertsRead().catch(() => setNotifications(prevState));
  }, [notifications]);

  const archive = useCallback((id: string) => {
    const prevState = notifications;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "archived" as NotificationStatus } : n)),
    );
    adminAlertsApi.archiveAlert(id).catch(() => setNotifications(prevState));
  }, [notifications]);

  const archiveAllRead = useCallback(() => {
    const prevState = notifications;
    const readIds = notifications.filter((n) => n.status === "read").map((n) => n.id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.status === "read" ? { ...n, status: "archived" as NotificationStatus } : n,
      ),
    );
    Promise.all(readIds.map((id) => adminAlertsApi.archiveAlert(id))).catch(() =>
      setNotifications(prevState),
    );
  }, [notifications]);

  const deleteArchived = useCallback(() => {
    const prevState = notifications;
    const archivedIds = notifications.filter((n) => n.status === "archived").map((n) => n.id);
    setNotifications((prev) => prev.filter((n) => n.status !== "archived"));
    Promise.all(archivedIds.map((id) => adminAlertsApi.deleteAlert(id))).catch(() =>
      setNotifications(prevState),
    );
  }, [notifications]);

  const exportLog = useCallback(() => {
    const headers = ["ID", "Type", "Title", "Priority", "Status", "Created At", "Action URL"];
    const rows = notifications.map((n) => [
      n.id,
      n.type,
      `"${n.title}"`,
      n.priority,
      n.status,
      n.createdAt,
      n.actionUrl ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin_notifications_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [notifications]);

  return {
    notifications,
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
    reload: load,
    markAsRead,
    markAllAsRead,
    archive,
    archiveAllRead,
    deleteArchived,
    exportLog,
  };
}
