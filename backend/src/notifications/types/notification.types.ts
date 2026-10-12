import { NotificationChannel, NotificationType } from 'src/common/enums/enums';

// ─── Inbox summary (unread count per type) ────────────────────────────────────

export interface NotificationInboxSummary {
  totalUnread: number;
  byType: Partial<Record<NotificationType, number>>;
  byChannel: Partial<Record<NotificationChannel, number>>;
}

// ─── Dispatch result ──────────────────────────────────────────────────────────

export interface DispatchResult {
  notificationId: string;
  channel: NotificationChannel;
  delivered: boolean;
  reason?: string; // why it was skipped/failed
}

// ─── Broadcast result ─────────────────────────────────────────────────────────

export interface BroadcastResult {
  sent: number;
  skipped: number;
  failed: number;
  errors: { userId: string; reason: string }[];
}

// ─── Template context (for building titles + bodies) ─────────────────────────

export interface NotificationTemplate {
  title: string;
  body: string;
  actionUrl?: string;
}

export type NotificationTemplateMap = {
  [K in NotificationType]?: (ctx: Record<string, any>) => NotificationTemplate;
};

export interface NotificationEvent {
  userId: string;
  notificationId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
