"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle,
  Calendar,
  Flame,
  Video,
  CreditCard,
  Trophy,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import * as notificationsApi from "@/lib/api/notifications";
import type { Notification, NotificationType } from "../dashboard/notifications/types";
import { useNotificationStream } from "../dashboard/notifications/useNotificationStream";

const NOTIFICATION_ICONS: Record<NotificationType, { icon: any; color: string; bg: string }> = {
  exam_reminder: { icon: Calendar, color: "#f59e0b", bg: "#fed7aa" },
  streak_alert: { icon: Flame, color: "#f97316", bg: "#fed7aa" },
  new_message: { icon: CheckCircle, color: "#3b82f6", bg: "#dbeafe" },
  session_start: { icon: Video, color: "#10b981", bg: "#d1fae5" },
  session_complete: { icon: CheckCircle, color: "#10b981", bg: "#d1fae5" },
  payment_success: { icon: CreditCard, color: "#10b981", bg: "#d1fae5" },
  payment_failed: { icon: AlertTriangle, color: "#ef4444", bg: "#fee2e2" },
  subscription_expiring: { icon: AlertTriangle, color: "#f59e0b", bg: "#fed7aa" },
  result_published: { icon: Trophy, color: "#8b5cf6", bg: "#ede9fe" },
  new_content: { icon: BookOpen, color: "#2e8b57", bg: "#e8f5e9" },
  achievement_unlocked: { icon: Trophy, color: "#f5c842", bg: "#fef3c7" },
  leaderboard_update: { icon: TrendingUp, color: "#6366f1", bg: "#e0e7ff" },
  account_alert: { icon: AlertTriangle, color: "#ef4444", bg: "#fee2e2" },
  weekly_report: { icon: TrendingUp, color: "#2e8b57", bg: "#e8f5e9" },
  system: { icon: Bell, color: "#6b7280", bg: "#f3f4f6" },
};

type NotificationsProps = {
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
};

const Notifications = ({ notificationsOpen, setNotificationsOpen }: NotificationsProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Badge count needs to be right the moment the header mounts, not only
  // after the dropdown is first opened.
  useEffect(() => {
    notificationsApi
      .getInboxSummary()
      .then((s) => setUnreadCount(s.totalUnread))
      .catch(() => {});
  }, []);

  // Full recent list is only fetched lazily on first open — no point
  // paying for it on every page load when most visits never open the bell.
  useEffect(() => {
    if (!notificationsOpen || loaded) return;
    setLoading(true);
    notificationsApi
      .getInbox({ limit: 5, sortBy: "createdAt", sortOrder: "DESC" })
      .then((res) => {
        setNotifications(res.data);
        setLoaded(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [notificationsOpen, loaded]);

  // Live push — new notifications land in the dropdown and bump the badge
  // without needing a refresh or reopen.
  const handleStreamEvent = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 5));
    setUnreadCount((c) => c + 1);
  }, []);
  useNotificationStream(handleStreamEvent);

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  async function handleMarkAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && n.status === "unread" ? { ...n, status: "read" as const } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationsApi.markRead([id]);
    } catch {
      // Best-effort — worst case the badge is off by one until next open.
    }
  }

  async function handleMarkAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" as const })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllRead();
    } catch {
      // Best-effort, same as above.
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (notification.status === "unread") {
      handleMarkAsRead(notification.id);
    }
    setNotificationsOpen(false);
  }

  return (
    <div className="relative">
      <button
        title="notification"
        onClick={() => setNotificationsOpen(!notificationsOpen)}
        className="p-2 rounded-lg hover:bg-cream transition-colors relative">
        <Bell size={18} className="text-text-muted" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        )}
      </button>

      {notificationsOpen && (
        <div
          className="absolute right-[-6rem] md:right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border z-50 overflow-hidden"
          style={{ borderColor: "rgba(30,80,50,0.1)" }}>
          {/* Header */}
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-green-600" />
              <span className="text-[14px] font-semibold text-green-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-green-600 hover:text-green-700 font-medium">
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-green-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-[13px] text-text-muted">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
                {notifications.map((notification) => {
                  const IconConfig = NOTIFICATION_ICONS[notification.type];
                  const Icon = IconConfig?.icon || Bell;
                  const isUnread = notification.status === "unread";

                  return (
                    <Link
                      key={notification.id}
                      href={`/dashboard/notifications/${notification.id}`}
                      onClick={() => handleNotificationClick(notification)}
                      className={`block p-4 hover:bg-cream transition-colors ${isUnread ? "bg-green-50/30" : ""}`}>
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: IconConfig?.bg || "#f3f4f6" }}>
                          <Icon size={14} style={{ color: IconConfig?.color || "#6b7280" }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-[12px] font-semibold ${isUnread ? "text-green-900" : "text-gray-700"}`}>
                              {notification.title}
                            </p>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {getTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                            {notification.body}
                          </p>
                        </div>

                        {/* Unread indicator */}
                        {isUnread && (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-600 shrink-0 mt-1" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer - View All Link */}
          <div
            className="px-4 py-3 border-t bg-gray-50"
            style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <Link
              href="/dashboard/notifications"
              onClick={() => setNotificationsOpen(false)}
              className="flex items-center justify-center gap-1 text-[12px] font-semibold text-green-600 hover:text-green-700 transition-colors">
              View all notifications
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
