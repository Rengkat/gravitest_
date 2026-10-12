import { apiClient, API_BASE_URL } from "./client";
import { useAuthStore, type AuthUser, type UserRole } from "@/lib/store/authStore";

export interface AuthResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
}

// ── Registration ──────────────────────────────────────────────────────────

// Backend role enum is "student" | "professional_student" | "admin" |
// "super_admin" — registration only ever creates the first two.
export type RegisterRole = Extract<UserRole, "student" | "professional_student">;

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: RegisterRole;
  phoneNumber?: string; // must be +234XXXXXXXXXX if present
}

export interface RegisterResponse {
  message: string;
  userId?: string;
  email?: string;
  devOtp?: string; // present only in non-production backend environments
}

// POST /auth/register — creates the account and emails a 6-digit OTP.
// Does NOT return tokens: the account can't log in until the email is
// verified (see verifyEmail below).
export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
}

export async function verifyEmail(email: string, code: string): Promise<{ message: string; verified: boolean }> {
  const { data } = await apiClient.post("/auth/verify-email", { email, code });
  return data;
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post("/auth/resend-verification", { email });
  return data;
}

// ── Forgot / reset password ─────────────────────────────────────────────
// OTP-based (not a magic link): forgotPassword emails a 6-digit code,
// resetPassword redeems it together with the new password.

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ message: string }> {
  const { data } = await apiClient.post("/auth/reset-password", { email, code, newPassword });
  return data;
}

// ── Session / logout ────────────────────────────────────────────────────

export async function logout(): Promise<{ message: string }> {
  const { data } = await apiClient.post("/auth/logout");
  return data;
}

export async function logoutAll(): Promise<{ message: string }> {
  const { data } = await apiClient.post("/auth/logout-all");
  return data;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get("/auth/me");
  return data;
}

// Call this from UI logout buttons (nav dropdowns, sidebars) instead of
// calling useAuthStore.getState().logout() directly — this revokes the
// session server-side first (invalidating the access token's JTI and the
// refresh token) so a copied/leaked token can't keep working after the
// user thinks they've signed out. Local state is cleared either way, even
// if the network call fails (e.g. offline), so the user is never stuck.
export async function performLogout(): Promise<void> {
  try {
    await logout();
  } catch {
    // Already logged out server-side, network down, or token already
    // expired — none of these should block clearing the local session.
  } finally {
    useAuthStore.getState().logout();
  }
}

export interface AvailableProviders {
  google: boolean;
  facebook: boolean;
}

// GET /auth/providers — tells us which OAuth providers are actually
// configured server-side, so we can disable/hide buttons for ones that
// aren't rather than letting the user hit a dead redirect.
export async function getAvailableProviders(): Promise<AvailableProviders> {
  const { data } = await apiClient.get("/auth/providers");
  return data;
}

// These aren't API calls — they're the actual redirect targets. The
// browser navigates the whole page to these URLs (not an axios request),
// which is why they're plain string builders rather than functions that
// call apiClient.
export function getGoogleLoginUrl(): string {
  return `${API_BASE_URL}/auth/google`;
}
export function getFacebookLoginUrl(): string {
  return `${API_BASE_URL}/auth/facebook`;
}

// POST /auth/social/exchange — trades the one-time code from the OAuth
// callback redirect for real tokens. See AuthController.completeSocialLogin
// on the backend for why tokens aren't just put directly in the redirect URL.
export async function exchangeSocialCode(code: string): Promise<AuthResponse> {
  const { data } = await apiClient.post("/auth/social/exchange", { code });
  return data;
}
