import { apiClient } from "./client";

// ── Users ────────────────────────────────────────────────────────────────
// GET /users — admin-only list with pagination. Used here just for role
// counts (limit=1, read meta.totalItems) and a recent-signups feed.

export interface AdminUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "student" | "professional_student" | "admin" | "super_admin";
  createdAt: string;
}

export interface PaginatedMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export async function listUsers(params: {
  role?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  state?: string;
  gender?: string;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}): Promise<{ data: AdminUserSummary[]; meta: PaginatedMeta }> {
  const { data } = await apiClient.get("/users", { params });
  return data;
}

// ── Question bank ───────────────────────────────────────────────────────

export interface QuestionBankStats {
  total: number;
  active: number;
  inactive: number;
  byExamType: Record<string, number>;
  bySubject: Record<string, number>;
  byDifficulty: Record<string, number>;
  byType: Record<string, number>;
  byYear: Record<number, number>;
  withExplanations: number;
  withImages: number;
}

export async function getQuestionBankStats(): Promise<QuestionBankStats> {
  const { data } = await apiClient.get("/questions/stats");
  return data;
}

// Full question CRUD lives in lib/api/questions.ts, typed against the
// canonical types/questions.ts shapes (real 19 exam types, real 8
// question types) rather than loose strings.

// ── Subscriptions ────────────────────────────────────────────────────────

export interface SubscriptionStats {
  activeCount: number;
  cancelledCount: number;
  expiredCount: number;
  pastDueCount: number;
  estimatedMonthlyRecurringRevenueKobo: number;
}

export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const { data } = await apiClient.get("/subscriptions/stats");
  return data;
}

// ── Transactions ─────────────────────────────────────────────────────────

export interface TransactionStats {
  totalRevenueKobo: number;
  revenueThisMonthKobo: number;
  revenueLastMonthKobo: number;
  countByStatus: Record<string, number>;
  countByType: Record<string, number>;
}

export async function getTransactionStats(): Promise<TransactionStats> {
  const { data } = await apiClient.get("/transactions/stats");
  return data;
}

export interface AdminTransaction {
  id: string;
  reference: string;
  userId: string;
  type: string;
  description: string | null;
  amountKobo: number;
  currency: string;
  status: string;
  channel: string | null;
  /** Which payment gateway collected it ("paystack" / "opay" / …). */
  gateway?: string;
  createdAt: string;
  paidAt: string | null;
}

export async function listTransactions(params: {
  status?: string;
  type?: string;
  gateway?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}): Promise<{ data: AdminTransaction[]; meta: PaginatedMeta }> {
  const { data } = await apiClient.get("/transactions", { params });
  return data;
}

export async function getTransaction(id: string): Promise<AdminTransaction & {
  gatewayReference?: string | null;
  /** @deprecated Alias of gatewayReference (the API still sends it). */
  paystackReference: string | null;
  purpose: string | null;
  cardLast4: string | null;
  cardType: string | null;
  bank: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  gatewayMessage: string | null;
  currency: string;
}> {
  const { data } = await apiClient.get(`/transactions/${id}`);
  return data;
}

// Manual reconciliation — re-checks a stuck/pending transaction against
// Paystack directly. This is the only mutation the transactions module
// actually supports; there is no refund-initiation endpoint (refunds
// would need to be processed directly in the Paystack dashboard today).
export async function reverifyTransaction(id: string): Promise<AdminTransaction> {
  const { data } = await apiClient.post(`/transactions/${id}/verify`, {});
  return data;
}

// ── Subscriptions (admin) ───────────────────────────────────────────────

export interface AdminSubscription {
  id: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  tier: string;
  status: string;
  billingInterval: string | null;
  amountKobo: number;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
  autoRenew: boolean;
  paystackSubscriptionCode: string | null;
}

export async function listSubscriptions(params: {
  status?: string;
  tier?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: AdminSubscription[]; meta: PaginatedMeta }> {
  const { data } = await apiClient.get("/subscriptions", { params });
  return data;
}

// ── AI governance settings (platform-wide, singleton) ───────────────────
// The only real platform-config backend in the whole app — everything
// else the old admin Settings page showed (maintenance mode, feature
// flags, payment gateway keys, rate limits, backups) has no backend
// model at all; see the settings page components for what's honestly
// marked unavailable instead of faked.

export interface AiGovernanceSettings {
  id: string;
  autoFlagThreshold: number;
  notifyOnFlagged: boolean;
  monthlyBudgetLimitUsd: number | null;
  notifyOnBudgetAlert: boolean;
  notifyEmail: string | null;
  retentionDays: number | null;
  updatedAt: string;
}

export async function getAiGovernanceSettings(): Promise<AiGovernanceSettings> {
  const { data } = await apiClient.get("/ai/admin/settings");
  return data;
}

export async function updateAiGovernanceSettings(
  patch: Partial<
    Pick<
      AiGovernanceSettings,
      | "autoFlagThreshold"
      | "notifyOnFlagged"
      | "monthlyBudgetLimitUsd"
      | "notifyOnBudgetAlert"
      | "notifyEmail"
      | "retentionDays"
    >
  >,
): Promise<AiGovernanceSettings> {
  const { data } = await apiClient.patch("/ai/admin/settings", patch);
  return data;
}

// ── User management ─────────────────────────────────────────────────────
// GET /users?... : accessible to admin + super_admin
// Everything else below (detail, create, edit, deactivate, reactivate,
// reset password) is super_admin only on the backend — the UI hides
// these actions for plain "admin" viewers rather than showing controls
// that will 403.

export interface AdminUserDetail {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  authProvider: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  stateOfResidence?: string;
  lga?: string;
  bio?: string | null;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getUser(id: string): Promise<AdminUserDetail> {
  const { data } = await apiClient.get(`/users/${id}`);
  return data;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: "student" | "professional_student" | "admin" | "super_admin";
  phoneNumber?: string;
  password?: string; // omit to auto-generate + email a temp password
  skipEmailVerification?: boolean;
  sendWelcomeEmail?: boolean;
}

export interface CreateUserResponse {
  user: AdminUserDetail;
  temporaryPassword?: string; // only present if password was auto-generated
}

export async function createUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
  const { data } = await apiClient.post("/users", payload);
  return data;
}

export interface AdminUpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  gender?: string;
  stateOfResidence?: string;
}

export async function updateUser(
  id: string,
  payload: AdminUpdateUserPayload,
): Promise<AdminUserDetail> {
  const { data } = await apiClient.patch(`/users/${id}`, payload);
  return data;
}

export async function resetUserPassword(
  id: string,
  params: { newPassword?: string; notifyUser?: boolean } = {},
): Promise<{ message: string; temporaryPassword?: string }> {
  const { data } = await apiClient.post(`/users/${id}/reset-password`, params);
  return data;
}

export async function deactivateUser(
  id: string,
  params: { type?: string; reason?: string } = {},
): Promise<{ message: string }> {
  const { data } = await apiClient.patch(`/users/${id}/deactivate`, params);
  return data;
}

export async function reactivateUser(id: string): Promise<AdminUserDetail> {
  const { data } = await apiClient.patch(`/users/${id}/reactivate`, {});
  return data;
}

// Resolves a student's profile.id from their email — the students
// module's detail routes (:id/overview, :id/sessions) take a *student
// profile* UUID, not the user account id, and there's no direct
// user-id-to-profile-id lookup endpoint. Email is unique, so searching
// the (super_admin-only) student list by it reliably finds the one
// matching profile without needing a new backend route.
export async function findStudentProfileIdByEmail(email: string): Promise<string | null> {
  const { data } = await apiClient.get("/students", { params: { search: email, limit: 5 } });
  const match = (data.data as { id: string; user?: { email?: string } }[]).find(
    (p) => p.user?.email?.toLowerCase() === email.toLowerCase(),
  );
  return match?.id ?? null;
}
// These call the /students/:id/* routes, which are ADMIN + SUPER_ADMIN
// (unlike the base user endpoints above, which are super_admin only) —
// see students.controller.ts. Only meaningful for role=student or
// professional_student; calling for an admin/super_admin user 404s since
// they have no student profile.

export interface StudentOverview {
  profile: {
    id: string;
    currentSchool: string | null;
    currentClass: string | null;
    examTargets: string[];
    examDate: string | null;
    targetScore: number | null;
    totalXp: number;
    level: number;
    levelTitle: string;
    currentStreak: number;
    longestStreak: number;
    averageScore: number;
    totalExamsTaken: number;
  };
  stats: {
    totalXp: number;
    level: number;
    levelTitle: string;
    currentStreak: number;
    longestStreak: number;
    averageScore: number;
    totalExamsTaken: number;
    accuracyRate: number;
    leaderboardRank: number | null;
  };
  daysUntilExam: number | null;
}

export async function getStudentOverviewById(profileId: string): Promise<StudentOverview> {
  const { data } = await apiClient.get(`/students/${profileId}/overview`);
  return data;
}

export interface StudentSessionSummary {
  id: string;
  examType: string | null;
  subjects: string[];
  status: string;
  questionsCorrect: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  startedAt: string;
  completedAt: string | null;
}

export async function getStudentSessionsById(
  profileId: string,
  params?: { limit?: number; page?: number },
): Promise<{ data: StudentSessionSummary[]; meta: PaginatedMeta }> {
  const { data } = await apiClient.get(`/students/${profileId}/sessions`, { params });
  return data;
}

// ─── One student's plan + access per service + purchases + payments ──────────
export interface UserBillingSubscription {
  id: string;
  tier: string;
  status: string;
  interval: string | null;
  amountKobo: number;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
  autoRenew: boolean;
  planCode: string | null;
  gateway: string | null;
}

export interface UserBillingService {
  feature: string;
  label: string;
  allowed: boolean;
  reason: "free" | "promo" | "tier" | "free_quota" | "upgrade_required" | "quota_exhausted" | "disabled";
  requiredTier: string | null;
  quota: { limit: number; used: number; remaining: number; period: "daily" | "monthly"; resetsAt: string } | null;
  freeUntil: string | null;
}

export interface UserBillingPurchase {
  contentId: string;
  title: string;
  contentType: string;
  purchasedAt: string;
  expiresAt: string | null;
  expired: boolean;
  priceKobo: number | null;
}

export interface UserBilling {
  tier: string;
  subscription: UserBillingSubscription | null;
  history: UserBillingSubscription[];
  services: UserBillingService[];
  purchases: UserBillingPurchase[];
  transactions: AdminTransaction[];
}

export async function getUserBilling(userId: string): Promise<UserBilling> {
  const { data } = await apiClient.get(`/admin/user-billing/${userId}`);
  return data;
}
