import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route protection.
//
// IMPORTANT: this file must live at the project root (next to /app), not
// inside /app — Next.js only recognizes the middleware convention at the
// root. A middleware.ts placed inside /app/ is silently ignored, which is
// why routes weren't being protected before this file existed.
//
// This checks lightweight cookies mirrored by lib/store/authStore.ts on
// every login/logout (gt_auth, gt_role) — the real access/refresh tokens
// live in localStorage only and are never sent here. That means this is a
// UX-level redirect (keeps signed-out users off dashboard shells, keeps
// signed-in users off the login page, keeps non-admins out of /admin),
// not the security boundary — every actual protected API call is still
// authorized independently by the NestJS JwtAuthGuard on the backend,
// which is the real enforcement point.

const AUTH_PAGES = ["/login", "/register", "/forgot-password"];
const PROTECTED_PREFIXES = ["/dashboard", "/ai-tutor", "/cbt"];
const ADMIN_PREFIXES = ["/admin"];
const ADMIN_ROLES = new Set(["admin", "super_admin"]);
const STUDENT_ROLES = new Set(["student", "professional_student"]);
const ONBOARDING_PAGE = "/complete-registration";

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isAuthed = req.cookies.get("gt_auth")?.value === "1";
  const role = req.cookies.get("gt_role")?.value;
  // Defaults to onboarded ("1") when absent so accounts created before this
  // cookie existed (or admins, who never get it explicitly set to "0")
  // aren't accidentally forced through the wizard.
  const isOnboarded = req.cookies.get("gt_onboarded")?.value !== "0";

  // Signed-in users shouldn't see the login/register/forgot-password
  // screens — bounce them to the right dashboard instead.
  if (AUTH_PAGES.includes(pathname) && isAuthed) {
    const dest = role && ADMIN_ROLES.has(role) ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // The onboarding wizard itself: must be signed in, and there's no point
  // revisiting it once already done.
  if (pathname === ONBOARDING_PAGE) {
    if (!isAuthed) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
    if (isOnboarded) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Admin area: must be signed in AND have an admin role.
  if (matchesPrefix(pathname, ADMIN_PREFIXES)) {
    if (!isAuthed) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
    if (!role || !ADMIN_ROLES.has(role)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Student/professional protected areas: must be signed in, and — for
  // student roles specifically — must have finished /complete-registration
  // first. A student who closes the tab mid-wizard and logs back in later
  // lands here instead of a half-set-up dashboard.
  if (matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    if (!isAuthed) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
    if (role && STUDENT_ROLES.has(role) && !isOnboarded) {
      return NextResponse.redirect(new URL(ONBOARDING_PAGE, req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except static assets, images, and Next internals —
  // cheap to evaluate and keeps the matcher list (above) as the single
  // source of truth for which routes actually get gated.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|offline.html).*)"],
};
