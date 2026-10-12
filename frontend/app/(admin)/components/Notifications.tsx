"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Shield,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Server,
  DollarSign,
  ChevronRight,
  CheckCircle,
  Loader2,
  Megaphone,
  BookOpen,
  Trophy,
} from "lucide-react";
import * as notificationsApi from "@/lib/api/notifications";
import type { Notification, NotificationType } from "../../(student)/dashboard/notifications/types";
import { useNotificationStream } from "../../(student)/dashboard/notifications/useNotificationStream";

// Admin accounts receive notifications through the same generic inbox
// every user has (src/notifications on the backend has no separate
// admin-only notification feed/types yet) — so this uses the exact same
// endpoints as the student bell, just with an admin-flavored icon set for
// the types an admin is actually likely to see (system/account/payment
// events), rather than student-only ones like streaks or achievements.
const NOTIFICATION_ICONS: Partial<Record<NotificationType, { icon: any; color: string; bg: string }>> = {
  system: { icon: Server, color: "#6b7280", bg: "#f3f4f6" },
  account_alert: { icon: AlertTriangle, color: "#ef4444", bg: "#fee2e2" },
  payment_success: { icon: CreditCard, color: "#10b981", bg: "#d1fae5" },
  payment_failed: { icon: DollarSign, color: "#ef4444", bg: "#fee2e2" },
  subscription_expiring: { icon: AlertTriangle, color: "#f59e0b", bg: "#fed7aa" },
  new_content: { icon: BookOpen, color: "#2e8b57", bg: "#e8f5e9" },
  new_message: { icon: CheckCircle, color: "#3b82f6", bg: "#dbeafe" },
  weekly_report: { icon: TrendingUp, color: "#2e8b57", bg: "#e8f5e9" },
  result_published: { icon: Trophy, color: "#8b5cf6", bg: "#ede9fe" },
  achievement_unlocked: { icon: Trophy, color: "#f5c842", bg: "#fef3c7" },
  leaderboard_update: { icon: TrendingUp, color: "#6366f1", bg: "#e0e7ff" },
  streak_alert: { icon: Megaphone, color: "#f97316", bg: "#fed7aa" },
};

type NotificationsProps = {
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
};

const AdminNotifications = ({ notificationsOpen, setNotificationsOpen }: NotificationsProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    notificationsApi
      .getInboxSummary()
      .then((s) => setUnreadCount(s.totalUnread))
      .catch(() => {});
  }, []);

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
      // Best-effort.
    }
  }

  async function handleMarkAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" as const })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllRead();
    } catch {
      // Best-effort.
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (notification.status === "unread") handleMarkAsRead(notification.id);
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
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-600" />
              <span className="text-[14px] font-semibold text-green-900">Admin Notifications</span>
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
              <div className="divide-y" style={{ borderColor: "rgba(30,74,46,0.08)" }}>
                {notifications.map((notification) => {
                  const IconConfig = NOTIFICATION_ICONS[notification.type];
                  const Icon = IconConfig?.icon || Bell;
                  const isUnread = notification.status === "unread";

                  return (
                    <Link
                      key={notification.id}
                      href={`/admin/notifications/${notification.id}`}
                      onClick={() => handleNotificationClick(notification)}
                      className={`block p-4 hover:bg-cream transition-colors ${isUnread ? "bg-green-50/30" : ""}`}>
                      <div className="flex gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: IconConfig?.bg || "#f3f4f6" }}>
                          <Icon size={14} style={{ color: IconConfig?.color || "#6b7280" }} />
                        </div>
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

          <div
            className="px-4 py-3 border-t bg-gray-50"
            style={{ borderColor: "rgba(30,74,46,0.08)" }}>
            <Link
              href="/admin/notifications"
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

export default AdminNotifications;
