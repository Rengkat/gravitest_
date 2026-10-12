import { apiClient } from "./client";
import type { PaymentGatewayCode } from "./billing";

// ── Types matching src/library/entities + DTOs on the backend ──
export type BackendContentType =
  | "ebook" | "video" | "image" | "document" | "audio" | "quiz" | "past_question" | "practice_set";
// Must match the backend's SubscriptionTier enum exactly (src/common/
// enums/enums.ts) — "pro" here was never a real backend value (dead/
// phantom tier), and "basic"/"standard" were missing despite being real,
// purchasable plans (see billing.ts's BackendSubscriptionTier). Content
// gated at either of those tiers would report/compare against a type
// that didn't even list them as possible values.
export type SubscriptionTier = "free" | "basic" | "standard" | "premium" | "enterprise";

export interface LibraryContentDto {
  id: string;
  title: string;
  description: string | null;
  contentType: BackendContentType;
  subject: string | null;
  topic: string | null;
  fileUrl: string; // public URL (free) or R2 key (gated) — never render directly, use getPlaybackUrl
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  totalPages: number | null;
  fileSizeBytes: number | null;
  examTypes: string[];
  classLevels: string[];
  isFree: boolean;
  requiredTier: SubscriptionTier | null;
  priceKobo: number | null;
  totalViews: number;
  totalDownloads: number;
  averageRating: number;
  totalRatings: number;
  isActive: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  uploaderId: string | null;
  author: string | null;
  tags: string[];
  isDownloadable: boolean;
  drmProtected: boolean;
  createdAt: string;
  updatedAt: string;
  // Present on GET /library (per item) and GET /library/:id — what THIS student can open.
  hasAccess?: boolean;
  accessReason?: string;
  accessModel?: "free" | "subscription" | "purchase";
}

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

export interface LibraryQueryParams {
  contentType?: BackendContentType;
  subject?: string;
  examType?: string;
  classLevel?: string;
  isFree?: boolean;
  isPublished?: boolean;
  isActive?: boolean;
  search?: string;
  sortBy?: "createdAt" | "totalViews" | "totalDownloads" | "averageRating" | "priceKobo";
  sortOrder?: "ASC" | "DESC";
  page?: number;
  limit?: number;
}

export interface CreateLibraryContentPayload {
  title: string;
  description?: string;
  contentType: BackendContentType;
  subject?: string;
  topic?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  totalPages?: number;
  fileSizeBytes?: number;
  examTypes?: string[];
  classLevels?: string[];
  isFree?: boolean;
  requiredTier?: SubscriptionTier | null;
  priceKobo?: number | null;
  author?: string;
  tags?: string[];
  isDownloadable?: boolean;
  drmProtected?: boolean;
}

// ── Student-facing ──────────────────────────────────────────
export async function browseLibrary(params: LibraryQueryParams = {}) {
  const { data } = await apiClient.get<PaginatedResult<LibraryContentDto>>("/library", { params });
  return data;
}

export async function getLibraryContent(id: string) {
  const { data } = await apiClient.get<LibraryContentDto>(`/library/${id}`);
  return data;
}

export async function getPlaybackUrl(id: string) {
  const { data } = await apiClient.get<{ url: string; expiresInSeconds: number | null }>(
    `/library/${id}/play`,
  );
  return data;
}

export type PreviewStatus = "pending" | "ready" | "failed" | "not_applicable";

export interface ContentPreview {
  status: PreviewStatus;
  url?: string;
  expiresInSeconds?: number;
  /** Real, server-verified length of the generated clip/excerpt — not the requested/default length. */
  durationSeconds?: number | null;
  pages?: number | null;
  message?: string;
}

// For content the caller does NOT have access to. Returns a signed URL to a
// short, genuinely clipped server-generated preview — never the full file.
// The first call after upload/change typically comes back "pending" while
// it generates in the background; poll again after a couple of seconds.
export async function getContentPreview(id: string) {
  const { data } = await apiClient.get<ContentPreview>(`/library/${id}/preview`);
  return data;
}

export async function getMyLibrary() {
  const { data } = await apiClient.get("/library/me/library");
  return data;
}

export async function recordLibraryAccess(payload: {
  contentId: string;
  contentType: BackendContentType;
  progressPercent?: number;
}) {
  const { data } = await apiClient.post("/library/access/record", payload);
  return data;
}

export async function getMyAccessRecord(id: string) {
  const { data } = await apiClient.get(`/library/${id}/my-access`);
  return data;
}

export async function addLibraryBookmark(id: string, position: number, note?: string) {
  const { data } = await apiClient.post(`/library/${id}/bookmarks`, { position, note });
  return data;
}

export async function removeLibraryBookmark(id: string, position: number) {
  const { data } = await apiClient.delete(`/library/${id}/bookmarks/${position}`);
  return data;
}

export async function checkLibraryAccess(id: string) {
  const { data } = await apiClient.get(`/library/${id}/access`);
  return data;
}

// ── Admin ────────────────────────────────────────────────────
export async function listAdminLibrary(params: LibraryQueryParams = {}) {
  const { data } = await apiClient.get<PaginatedResult<LibraryContentDto>>("/library/admin/all", {
    params,
  });
  return data;
}

export async function getLibraryStats() {
  const { data } = await apiClient.get("/library/admin/stats");
  return data;
}

export async function createLibraryContent(payload: CreateLibraryContentPayload) {
  const { data } = await apiClient.post<LibraryContentDto>("/library", payload);
  return data;
}

export async function updateLibraryContent(
  id: string,
  payload: Partial<CreateLibraryContentPayload> & {
    isActive?: boolean;
    isPublished?: boolean;
    isFeatured?: boolean;
  },
) {
  const { data } = await apiClient.patch<LibraryContentDto>(`/library/${id}`, payload);
  return data;
}

export async function publishLibraryContent(id: string) {
  const { data } = await apiClient.patch<LibraryContentDto>(`/library/${id}/publish`, {});
  return data;
}

export async function unpublishLibraryContent(id: string) {
  const { data } = await apiClient.patch<LibraryContentDto>(`/library/${id}/unpublish`, {});
  return data;
}

export async function deleteLibraryContent(id: string) {
  const { data } = await apiClient.delete(`/library/${id}`);
  return data;
}

// ── Ratings ──────────────────────────────────────────────────
export interface LibraryRatingDto {
  id: string;
  libraryContentId: string;
  userId: string;
  userDisplayName: string;
  rating: number;
  review: string | null;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function rateLibraryContent(id: string, payload: { rating: number; review?: string }) {
  const { data } = await apiClient.post<LibraryRatingDto>(`/library/${id}/ratings`, payload);
  return data;
}

export async function listLibraryRatings(id: string, page = 1, limit = 20) {
  const { data } = await apiClient.get<PaginatedResult<LibraryRatingDto>>(`/library/${id}/ratings`, {
    params: { page, limit },
  });
  return data;
}

export async function getMyLibraryRating(id: string) {
  const { data } = await apiClient.get<LibraryRatingDto | null>(`/library/${id}/ratings/me`);
  return data;
}

export async function deleteMyLibraryRating(id: string) {
  const { data } = await apiClient.delete(`/library/${id}/ratings`);
  return data;
}

export async function markRatingHelpful(ratingId: string) {
  const { data } = await apiClient.post<LibraryRatingDto>(`/library/ratings/${ratingId}/helpful`, {});
  return data;
}

/**
 * Starts a one-time purchase and returns the hosted checkout URL to send the
 * customer to. `gateway` picks the payment method (see getPaymentGateways());
 * omit it for the admin's default.
 */
export async function purchaseContent(
  contentId: string,
  gateway?: PaymentGatewayCode,
): Promise<{ authorizationUrl: string; reference: string; gateway?: PaymentGatewayCode }> {
  const { data } = await apiClient.post(`/library/${contentId}/purchase`, gateway ? { gateway } : {});
  return data;
}

// ── Admin: content access management ────────────────────────────────────

export interface ContentAccessRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  grantedAt: string;
  expiresAt: string | null;
  isExpired: boolean;
  paymentId: string | null;
  viewCount: number;
  lastAccessedAt: string | null;
}

export async function listContentAccess(contentId: string): Promise<ContentAccessRecord[]> {
  const { data } = await apiClient.get(`/library/${contentId}/admin/access`);
  return data;
}

export async function grantContentAccess(
  contentId: string,
  payload: { userId: string; paymentId?: string; expiresAt?: string },
) {
  const { data } = await apiClient.post(`/library/${contentId}/grant-access`, payload);
  return data;
}

export async function revokeContentAccess(contentId: string, userId: string): Promise<{ revoked: boolean }> {
  const { data } = await apiClient.delete(`/library/${contentId}/admin/access/${userId}`);
  return data;
}

// ── Admin: content audit log ────────────────────────────────────────────

export type ContentAuditAction =
  | "uploaded"
  | "edited"
  | "published"
  | "unpublished"
  | "deleted"
  | "access_granted"
  | "access_revoked"
  | "price_changed";

export interface ContentAuditLogEntry {
  id: string;
  action: ContentAuditAction;
  description: string;
  performedBy: string | null;
  performedByName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export async function listContentActivity(contentId: string): Promise<ContentAuditLogEntry[]> {
  const { data } = await apiClient.get(`/library/${contentId}/admin/activity`);
  return data;
}
