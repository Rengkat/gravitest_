export type NotificationChannel = "in_app" | "email" | "sms" | "push" | "whatsapp";

export type NotificationType =
  | "exam_reminder"
  | "streak_alert"
  | "new_message"
  | "session_start"
  | "session_complete"
  | "payment_success"
  | "payment_failed"
  | "subscription_expiring"
  | "result_published"
  | "new_content"
  | "achievement_unlocked"
  | "leaderboard_update"
  | "account_alert"
  | "weekly_report"
  | "system";

export type NotificationStatus = "unread" | "read" | "archived";
export type NotificationFilter = "all" | "unread" | "read" | "archived";

export interface Notification {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  body: string;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
}

export interface NotificationCounts {
  unread: number;
  read: number;
  archived: number;
  total: number;
}
