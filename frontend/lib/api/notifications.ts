import { apiClient } from "./client";
import type {
  Notification,
  NotificationChannel,
  NotificationCounts,
  NotificationStatus,
  NotificationType,
} from "@/app/(student)/dashboard/notifications/types";

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export interface InboxFilters {
  status?: NotificationStatus;
  type?: NotificationType;
  channel?: NotificationChannel;
  from?: string;
  to?: string;
  sortBy?: "createdAt" | "readAt" | "type";
  sortOrder?: "ASC" | "DESC";
  page?: number;
  limit?: number;
}

export interface InboxSummary {
  totalUnread: number;
  byType: Partial<Record<NotificationType, number>>;
  byChannel: Partial<Record<NotificationChannel, number>>;
}

// GET /notifications/inbox
export async function getInbox(filters: InboxFilters = {}): Promise<PaginatedResult<Notification>> {
  const { data } = await apiClient.get<PaginatedResult<Notification>>("/notifications/inbox", {
    params: filters,
  });
  return data;
}

// GET /notifications/inbox/summary — feeds the navbar bell badge
export async function getInboxSummary(): Promise<InboxSummary> {
  const { data } = await apiClient.get<InboxSummary>("/notifications/inbox/summary");
  return data;
}

// GET /notifications/inbox/:id
export async function getNotification(id: string): Promise<Notification> {
  const { data } = await apiClient.get<Notification>(`/notifications/inbox/${id}`);
  return data;
}

// PATCH /notifications/inbox/mark-read — omit ids to mark ALL unread
export async function markRead(ids?: string[]): Promise<{ updated: number }> {
  const { data } = await apiClient.patch("/notifications/inbox/mark-read", { ids });
  return data;
}

// PATCH /notifications/inbox/mark-all-read
export async function markAllRead(): Promise<{ updated: number }> {
  const { data } = await apiClient.patch("/notifications/inbox/mark-all-read");
  return data;
}

// PATCH /notifications/inbox/:id/archive
export async function archiveNotification(id: string): Promise<Notification> {
  const { data } = await apiClient.patch<Notification>(`/notifications/inbox/${id}/archive`);
  return data;
}

// DELETE /notifications/inbox/:id
export async function deleteNotification(id: string): Promise<{ deleted: boolean }> {
  const { data } = await apiClient.delete(`/notifications/inbox/${id}`);
  return data;
}

// DELETE /notifications/inbox/clear — clears all read + archived
export async function clearNotifications(): Promise<{ deleted: number }> {
  const { data } = await apiClient.delete("/notifications/inbox/clear");
  return data;
}

// GET /notifications/preferences
export async function getPreferences() {
  const { data } = await apiClient.get("/notifications/preferences");
  return data;
}

// PATCH /notifications/preferences
export async function updatePreferences(payload: Record<string, unknown>) {
  const { data } = await apiClient.patch("/notifications/preferences", payload);
  return data;
}

// ── Admin: broadcast composer ───────────────────────────────────────────
// Maps to CreateAdminBroadcastDto on the backend
// (src/notifications/dto/admin-broadcast.dto.ts).

export interface CreateBroadcastCampaignPayload {
  title: string;
  body: string;
  emailSubject?: string;
  channels: NotificationChannel[];
  // Backend enum (src/common/enums/enums.ts NotificationType) is a subset
  // of the local frontend NotificationType union — kept as string here so
  // this payload type doesn't reject the backend-valid subset.
  notificationType: string;
  audienceType: "all" | "segment" | "specific";
  tier?: string;
  examType?: string;
  userIds?: string[];
  scheduledFor?: string | null;
}

export interface BroadcastCampaignDto {
  id: string;
  title: string;
  body: string;
  emailSubject: string | null;
  channels: NotificationChannel[];
  notificationType: NotificationType;
  audienceType: "all" | "segment" | "specific";
  audienceTier: string | null;
  audienceExamType: string | null;
  audienceUserIds: string[] | null;
  recipientCount: number;
  status: "draft" | "queued" | "sending" | "sent" | "failed";
  scheduledFor: string | null;
  sentAt: string | null;
  createdBy: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

// POST /notifications/admin/broadcast/campaign
export async function createBroadcastCampaign(
  payload: CreateBroadcastCampaignPayload,
): Promise<BroadcastCampaignDto> {
  const { data } = await apiClient.post("/notifications/admin/broadcast/campaign", payload);
  return data;
}

// GET /notifications/admin/broadcast/campaign
export async function listBroadcastCampaigns(
  filters: { status?: string; page?: number; limit?: number } = {},
): Promise<PaginatedResult<BroadcastCampaignDto>> {
  const { data } = await apiClient.get("/notifications/admin/broadcast/campaign", { params: filters });
  return data;
}

// GET /notifications/admin/broadcast/campaign/:id
export async function getBroadcastCampaign(id: string): Promise<BroadcastCampaignDto> {
  const { data } = await apiClient.get(`/notifications/admin/broadcast/campaign/${id}`);
  return data;
}

export type { Notification, NotificationCounts };
