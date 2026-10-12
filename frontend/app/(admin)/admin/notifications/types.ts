// ─── ENUMS ──────────────────────────────────────────────────
export type AdminNotificationType =
  | "user_signup"
  | "user_report"
  | "payment_dispute"
  | "system_alert"
  | "backup_completed"
  | "high_usage_alert"
  | "fraud_alert"
  | "subscription_expiring"
  | "server_status"
  | "database_backup"
  | "new_feature"
  | "admin_action";

export type NotificationPriority = "high" | "medium" | "low";

export type NotificationStatus = "unread" | "read" | "archived";

/**
 * Filter modes — status-based OR priority-based.
 * The FilterBar handles the dual-mode UI.
 */
export type NotificationFilter = "all" | "unread" | "read" | "archived" | "high" | "medium" | "low";

// ─── ENTITY ──────────────────────────────────────────────────
export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  body: string;
  createdAt: string;
  status: NotificationStatus; // upgraded from boolean `read`
  priority: NotificationPriority;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  resolvedAt?: string; // when an admin resolved/acted on it
  resolvedBy?: string;
}

// ─── COUNTS ──────────────────────────────────────────────────
export interface AdminNotificationCounts {
  total: number;
  unread: number;
  highPriority: number; // unread high-priority
  resolved: number; // read
  archived: number;
}

// ─── BROADCAST (outbound: admin -> users) ─────────────────────
// Separate from AdminNotification above. AdminNotification is the
// inbound feed of system events *for admins*. A Broadcast is a
// message admins compose and send *to users* — in-app, email, or both.

export type BroadcastChannel = "in_app" | "email" | "both";

export type BroadcastAudienceType = "all" | "segment" | "specific";

export type SubscriptionTierFilter = "free" | "pro";

export interface BroadcastAudience {
  type: BroadcastAudienceType;
  // used when type === "segment"
  tier?: SubscriptionTierFilter;
  examType?: string;
  // used when type === "specific"
  userIds?: string[];
}

export type BroadcastStatus = "draft" | "queued" | "sending" | "sent" | "failed";

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  emailSubject?: string; // only relevant when channel includes email
  channel: BroadcastChannel;
  audience: BroadcastAudience;
  recipientCount: number;
  status: BroadcastStatus;
  scheduledFor: string | null; // null = sent immediately
  createdAt: string;
  createdBy: string; // admin name/email
  openRate?: number; // email only, 0-1
}

export interface CreateBroadcastInput {
  title: string;
  body: string;
  emailSubject?: string;
  channel: BroadcastChannel;
  audience: BroadcastAudience;
  scheduledFor: string | null;
}
