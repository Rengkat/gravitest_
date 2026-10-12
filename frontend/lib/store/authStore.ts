import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type UserRole = "student" | "professional_student" | "admin" | "super_admin";

// ── Cookie mirror ────────────────────────────────────────────────────────
// The auth store is persisted to localStorage (see below), which the
// Next.js middleware — running at the edge, before any client JS runs —
// cannot read. To let middleware.ts gate routes server-side, we mirror a
// couple of lightweight, non-sensitive flags into plain cookies alongside
// the localStorage copy:
//   gt_auth — "1" whenever a session is active (existence check only)
//   gt_role — the user's role, for role-gating /admin routes
// The real access/refresh tokens stay in localStorage only and are never
// put in a cookie — this keeps the actual bearer credentials out of
// every outgoing HTTP request's Cookie header.
function setAuthCookies(role: UserRole, isOnboarded?: boolean) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 30; // 30 days — matches refresh token lifetime
  document.cookie = `gt_auth=1; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `gt_role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
  // Admins don't go through /complete-registration at all, so default to
  // "onboarded" for them unless told otherwise — only students/professional
  // students are ever actually gated on this cookie (see middleware.ts).
  document.cookie = `gt_onboarded=${isOnboarded === false ? "0" : "1"}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearAuthCookies() {
  if (typeof document === "undefined") return;
  document.cookie = "gt_auth=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "gt_role=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "gt_onboarded=; path=/; max-age=0; SameSite=Lax";
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  subscriptionTier?: "free" | "premium" | "pro" | "enterprise";
  avatarUrl?: string | null;
  // Whether the student has finished /complete-registration. Always true
  // for admin/super_admin (see AdminInviteService.acceptInvite on the
  // backend — invited admins are marked onboarded at account creation).
  isOnboarded?: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
}

// zustand + immer per the tech stack. Persisted to localStorage so a page
// refresh doesn't drop the session — access token is short-lived (15min
// per JWT_ACCESS_TOKEN_TTL) and silently refreshed by the axios
// interceptor in lib/api/client.ts, so this is safe to keep in storage.
export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) =>
        set((state) => {
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
          state.isAuthenticated = true;
          if (state.user) setAuthCookies(state.user.role, state.user.isOnboarded);
        }),

      setUser: (user) =>
        set((state) => {
          state.user = user;
          setAuthCookies(user.role, user.isOnboarded);
        }),

      login: (accessToken, refreshToken, user) =>
        set((state) => {
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
          state.user = user;
          state.isAuthenticated = true;
          setAuthCookies(user.role, user.isOnboarded);
        }),

      // Local-only, synchronous logout — clears store + cookies without an
      // API call. Used internally (e.g. when a refresh attempt fails) and
      // by the "logout everywhere" flow below, which calls the backend
      // first and then this. Prefer performLogout() in lib/api/auth.ts
      // from UI code so the server session is actually revoked too.
      logout: () =>
        set((state) => {
          state.accessToken = null;
          state.refreshToken = null;
          state.user = null;
          state.isAuthenticated = false;
          clearAuthCookies();
        }),
    })),
    {
      name: "gravitest-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
