import { apiClient } from "./client";
import type { AuthResponse } from "./auth";

export type AdminInviteRole = "admin" | "super_admin";
export type AdminInviteStatus = "pending" | "accepted" | "revoked" | "expired";

export interface AdminInvite {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  designation?: string | null;
  role: AdminInviteRole;
  status: AdminInviteStatus;
  invitedByName?: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface CreateAdminInvitePayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string; // must be +234XXXXXXXXXX if present
  role: AdminInviteRole;
  designation?: string;
}

// POST /admin/invites — super admin only. Emails a one-time link; the
// invitee sets their own password via acceptAdminInvite below.
export async function createAdminInvite(payload: CreateAdminInvitePayload): Promise<AdminInvite> {
  const { data } = await apiClient.post("/admin/invites", payload);
  return data;
}

export async function listAdminInvites(): Promise<AdminInvite[]> {
  const { data } = await apiClient.get("/admin/invites");
  return data;
}

export async function revokeAdminInvite(id: string): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/admin/invites/${id}`);
  return data;
}

export interface ValidateAdminInviteResponse {
  email: string;
  firstName: string;
  lastName: string;
  role: AdminInviteRole;
  expiresAt: string;
}

// GET /admin/invites/validate?token=... — public. Called on page load of
// the onboarding screen to prefill the form and check the link is still good.
export async function validateAdminInvite(token: string): Promise<ValidateAdminInviteResponse> {
  const { data } = await apiClient.get("/admin/invites/validate", { params: { token } });
  return data;
}

// POST /admin/invites/accept — public. Creates the account and returns the
// same { user, tokens } shape as a normal login, so the caller can log the
// new admin straight in.
export async function acceptAdminInvite(token: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post("/admin/invites/accept", { token, password });
  return data;
}
