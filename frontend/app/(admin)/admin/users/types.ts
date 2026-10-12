// This used to model a much richer user shape (device tracking, referral
// codes, per-list-item XP/streak, churn rate, tags, notes...) with no
// backend behind any of it — this is trimmed to fields the backend's
// UserResponseDto and GET /users filters actually provide. Richer
// per-student stats (XP, streak, sessions) are fetched separately on the
// detail page via the already-secured /students/:id/overview, not
// dragged into the list view (that would mean an extra query per row).

export type UserRole = "student" | "professional_student" | "admin" | "super_admin";
export type SortField = "name" | "joinDate" | "email";

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  authProvider: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  avatarUrl?: string;
  gender?: string;
  stateOfResidence?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── AGGREGATE STATS ────────────────────────────────────────
// Composed from real GET /users?limit=1 count queries (see
// lib/api/admin-dashboard.ts) — not a single backend aggregate endpoint.
export interface UserStats {
  total: number;
  students: number;
  professionals: number;
  admins: number;
  active: number;
  inactive: number;
  emailVerified: number;
}

// ─── FILTERS ────────────────────────────────────────────────
// Matches UserFilterDto on the backend exactly — anything not listed
// there (subscription tier, session counts, exam targets) isn't
// filterable server-side and was removed rather than silently doing
// nothing (subscriptionTier filtering was also removed backend-side —
// it referenced a column that doesn't exist on the users table and
// threw a 500; see user.service.ts).
export interface UserFilters {
  role: UserRole | "";
  isActive: "" | "true" | "false";
  emailVerified: "" | "true" | "false";
  state: string;
  gender: string;
  createdFrom: string;
  createdTo: string;
}
