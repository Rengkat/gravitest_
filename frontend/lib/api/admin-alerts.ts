import { apiClient } from "./client";
import type { AdminNotification, NotificationPriority, NotificationStatus } from "@/app/(admin)/admin/notifications/types";
import type { PaginatedResult } from "./notifications";

export interface AdminAlertFilters {
  status?: NotificationStatus;
  type?: string;
  priority?: NotificationPriority;
  sortBy?: "createdAt" | "resolvedAt" | "priority";
  sortOrder?: "ASC" | "DESC";
  page?: number;
  limit?: number;
}

export interface AdminAlertStats {
  total: number;
  unread: number;
  highPriority: number;
  resolved: number;
  archived: number;
}

// GET /admin/alerts
export async function getAdminAlerts(filters: AdminAlertFilters = {}): Promise<PaginatedResult<AdminNotification>> {
  const { data } = await apiClient.get<PaginatedResult<AdminNotification>>("/admin/alerts", { params: filters });
  return data;
}

// GET /admin/alerts/stats
export async function getAdminAlertStats(): Promise<AdminAlertStats> {
  const { data } = await apiClient.get<AdminAlertStats>("/admin/alerts/stats");
  return data;
}

// PATCH /admin/alerts/:id/read
export async function markAlertRead(id: string): Promise<AdminNotification> {
  const { data } = await apiClient.patch<AdminNotification>(`/admin/alerts/${id}/read`);
  return data;
}

// PATCH /admin/alerts/mark-all-read
export async function markAllAlertsRead(): Promise<{ updated: number }> {
  const { data } = await apiClient.patch("/admin/alerts/mark-all-read");
  return data;
}

// PATCH /admin/alerts/:id/resolve
export async function resolveAlert(id: string): Promise<AdminNotification> {
  const { data } = await apiClient.patch<AdminNotification>(`/admin/alerts/${id}/resolve`);
  return data;
}

// PATCH /admin/alerts/:id/archive
export async function archiveAlert(id: string): Promise<AdminNotification> {
  const { data } = await apiClient.patch<AdminNotification>(`/admin/alerts/${id}/archive`);
  return data;
}

// DELETE /admin/alerts/:id
export async function deleteAlert(id: string): Promise<{ deleted: boolean }> {
  const { data } = await apiClient.delete(`/admin/alerts/${id}`);
  return data;
}
