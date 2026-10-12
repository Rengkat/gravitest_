/**
 * Backend-provided `actionUrl` values are not guaranteed to be valid in-app
 * routes. Common ways they cause 404s:
 *   1. No leading slash ("dashboard/practice") — Next resolves that relative
 *      to the CURRENT page.
 *   2. The backend links to a path the frontend never built
 *      (e.g. /results/<id> instead of /dashboard/practice/session/<id>/results,
 *      or /dashboard/leaderboard instead of /dashboard/performance/leaderboard).
 *
 * `resolveActionTarget` returns a URL that is safe to navigate to, or null
 * when the notification has no valid destination (callers then fall back to
 * the notification's own detail page).
 */

type Audience = "student" | "admin";

interface Targetable {
  type?: string;
  actionUrl: string | null | undefined;
  metadata?: Record<string, unknown> | null;
}

// Generated from the app/ page tree. Dynamic segments ([id]) match one path
// segment. If you add a new page that notifications should deep-link to,
// add its pattern here.
const STUDENT_ROUTES: RegExp[] = [
  "^/$",  // /
  "^/admin-onboarding$",  // /admin-onboarding
  "^/ai-tutor$",  // /ai-tutor
  "^/auth/callback$",  // /auth/callback
  "^/blog$",  // /blog
  "^/blog/[^/]+$",  // /blog/[slug]
  "^/cbt/mcq/[^/]+$",  // /cbt/mcq/[id]
  "^/cbt/theory/[^/]+$",  // /cbt/theory/[id]
  "^/community$",  // /community
  "^/complete-registration$",  // /complete-registration
  "^/dashboard$",  // /dashboard
  "^/dashboard/billing$",  // /dashboard/billing
  "^/dashboard/games$",  // /dashboard/games
  "^/dashboard/games/algebra-heist$",  // /dashboard/games/algebra-heist
  "^/dashboard/games/madam-karmen$",  // /dashboard/games/madam-karmen
  "^/dashboard/games/madam-karmen/leaderboard$",  // /dashboard/games/madam-karmen/leaderboard
  "^/dashboard/games/madam-karmen/play$",  // /dashboard/games/madam-karmen/play
  "^/dashboard/games/nigerian-trail$",  // /dashboard/games/nigerian-trail
  "^/dashboard/games/who-wants-tobe-a-scholar$",  // /dashboard/games/who-wants-tobe-a-scholar
  "^/dashboard/games/who-wants-tobe-a-scholar/leaderboard$",  // /dashboard/games/who-wants-tobe-a-scholar/leaderboard
  "^/dashboard/games/who-wants-tobe-a-scholar/play$",  // /dashboard/games/who-wants-tobe-a-scholar/play
  "^/dashboard/games/word-connect$",  // /dashboard/games/word-connect
  "^/dashboard/games/word-connect/leaderboard$",  // /dashboard/games/word-connect/leaderboard
  "^/dashboard/games/word-connect/play$",  // /dashboard/games/word-connect/play
  "^/dashboard/library$",  // /dashboard/library
  "^/dashboard/library/[^/]+$",  // /dashboard/library/[id]
  "^/dashboard/notifications$",  // /dashboard/notifications
  "^/dashboard/notifications/[^/]+$",  // /dashboard/notifications/[id]
  "^/dashboard/performance$",  // /dashboard/performance
  "^/dashboard/performance/exams$",  // /dashboard/performance/exams
  "^/dashboard/performance/insights$",  // /dashboard/performance/insights
  "^/dashboard/performance/leaderboard$",  // /dashboard/performance/leaderboard
  "^/dashboard/performance/overview$",  // /dashboard/performance/overview
  "^/dashboard/performance/subjects$",  // /dashboard/performance/subjects
  "^/dashboard/performance/topics$",  // /dashboard/performance/topics
  "^/dashboard/practice$",  // /dashboard/practice
  "^/dashboard/practice/session/[^/]+/results$",  // /dashboard/practice/session/[id]/results
  "^/dashboard/profile$",  // /dashboard/profile
  "^/dashboard/settings$",  // /dashboard/settings
  "^/forgot-password$",  // /forgot-password
  "^/help-centre$",  // /help-centre
  "^/login$",  // /login
  "^/onboarding$",  // /onboarding
  "^/pricing$",  // /pricing
  "^/register$",  // /register
  "^/video-tutorials$",  // /video-tutorials
].map((p) => new RegExp(p));

const ADMIN_ROUTES: RegExp[] = [
  "^/$",  // /
  "^/admin$",  // /admin
  "^/admin-onboarding$",  // /admin-onboarding
  "^/admin/ai-logs$",  // /admin/ai-logs
  "^/admin/ai-logs/conversations$",  // /admin/ai-logs/conversations
  "^/admin/ai-logs/conversations/[^/]+$",  // /admin/ai-logs/conversations/[id]
  "^/admin/ai-logs/cost$",  // /admin/ai-logs/cost
  "^/admin/ai-logs/flagged$",  // /admin/ai-logs/flagged
  "^/admin/ai-logs/limits$",  // /admin/ai-logs/limits
  "^/admin/ai-logs/models$",  // /admin/ai-logs/models
  "^/admin/ai-logs/performance$",  // /admin/ai-logs/performance
  "^/admin/ai-logs/prompts$",  // /admin/ai-logs/prompts
  "^/admin/ai-logs/scoring$",  // /admin/ai-logs/scoring
  "^/admin/ai-logs/scoring/practice$",  // /admin/ai-logs/scoring/practice
  "^/admin/ai-logs/scoring/practice/[^/]+$",  // /admin/ai-logs/scoring/practice/[id]
  "^/admin/ai-logs/settings$",  // /admin/ai-logs/settings
  "^/admin/contents$",  // /admin/contents
  "^/admin/contents/[^/]+$",  // /admin/contents/[id]
  "^/admin/games$",  // /admin/games
  "^/admin/leaderboard$",  // /admin/leaderboard
  "^/admin/notifications$",  // /admin/notifications
  "^/admin/notifications/[^/]+$",  // /admin/notifications/[id]
  "^/admin/questions$",  // /admin/questions
  "^/admin/questions/[^/]+$",  // /admin/questions/[examType]
  "^/admin/questions/[^/]+/[^/]+$",  // /admin/questions/[examType]/[year]
  "^/admin/questions/[^/]+/[^/]+/[^/]+$",  // /admin/questions/[examType]/[year]/[subject]
  "^/admin/questions/bulk-import$",  // /admin/questions/bulk-import
  "^/admin/questions/create$",  // /admin/questions/create
  "^/admin/settings$",  // /admin/settings
  "^/admin/transactions$",  // /admin/transactions
  "^/admin/transactions/[^/]+$",  // /admin/transactions/[id]
  "^/admin/users$",  // /admin/users
  "^/admin/users/[^/]+$",  // /admin/users/[id]
  "^/ai-tutor$",  // /ai-tutor
  "^/auth/callback$",  // /auth/callback
  "^/blog$",  // /blog
  "^/blog/[^/]+$",  // /blog/[slug]
  "^/cbt/mcq/[^/]+$",  // /cbt/mcq/[id]
  "^/cbt/theory/[^/]+$",  // /cbt/theory/[id]
  "^/community$",  // /community
  "^/complete-registration$",  // /complete-registration
  "^/dashboard$",  // /dashboard
  "^/dashboard/billing$",  // /dashboard/billing
  "^/dashboard/games$",  // /dashboard/games
  "^/dashboard/games/algebra-heist$",  // /dashboard/games/algebra-heist
  "^/dashboard/games/madam-karmen$",  // /dashboard/games/madam-karmen
  "^/dashboard/games/madam-karmen/leaderboard$",  // /dashboard/games/madam-karmen/leaderboard
  "^/dashboard/games/madam-karmen/play$",  // /dashboard/games/madam-karmen/play
  "^/dashboard/games/nigerian-trail$",  // /dashboard/games/nigerian-trail
  "^/dashboard/games/who-wants-tobe-a-scholar$",  // /dashboard/games/who-wants-tobe-a-scholar
  "^/dashboard/games/who-wants-tobe-a-scholar/leaderboard$",  // /dashboard/games/who-wants-tobe-a-scholar/leaderboard
  "^/dashboard/games/who-wants-tobe-a-scholar/play$",  // /dashboard/games/who-wants-tobe-a-scholar/play
  "^/dashboard/games/word-connect$",  // /dashboard/games/word-connect
  "^/dashboard/games/word-connect/leaderboard$",  // /dashboard/games/word-connect/leaderboard
  "^/dashboard/games/word-connect/play$",  // /dashboard/games/word-connect/play
  "^/dashboard/library$",  // /dashboard/library
  "^/dashboard/library/[^/]+$",  // /dashboard/library/[id]
  "^/dashboard/notifications$",  // /dashboard/notifications
  "^/dashboard/notifications/[^/]+$",  // /dashboard/notifications/[id]
  "^/dashboard/performance$",  // /dashboard/performance
  "^/dashboard/performance/exams$",  // /dashboard/performance/exams
  "^/dashboard/performance/insights$",  // /dashboard/performance/insights
  "^/dashboard/performance/leaderboard$",  // /dashboard/performance/leaderboard
  "^/dashboard/performance/overview$",  // /dashboard/performance/overview
  "^/dashboard/performance/subjects$",  // /dashboard/performance/subjects
  "^/dashboard/performance/topics$",  // /dashboard/performance/topics
  "^/dashboard/practice$",  // /dashboard/practice
  "^/dashboard/practice/session/[^/]+/results$",  // /dashboard/practice/session/[id]/results
  "^/dashboard/profile$",  // /dashboard/profile
  "^/dashboard/settings$",  // /dashboard/settings
  "^/forgot-password$",  // /forgot-password
  "^/help-centre$",  // /help-centre
  "^/login$",  // /login
  "^/onboarding$",  // /onboarding
  "^/pricing$",  // /pricing
  "^/register$",  // /register
  "^/video-tutorials$",  // /video-tutorials
].map((p) => new RegExp(p));

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const SESSION_ID_KEYS = ["sessionId", "examSessionId", "session_id", "exam_session_id"];

export function normalizeActionUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return null; // protocol-relative — not an in-app route
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function findSessionId(n: Targetable, normalized: string | null): string | null {
  for (const key of SESSION_ID_KEYS) {
    const v = n.metadata?.[key];
    if (typeof v === "string" && v) return v;
  }
  return normalized?.match(UUID_RE)?.[0] ?? null;
}

export function resolveActionTarget(n: Targetable, audience: Audience): string | null {
  const normalized = normalizeActionUrl(n.actionUrl);
  if (normalized && isExternalUrl(normalized)) return normalized;

  // Result notifications: the real results page lives under practice/session.
  if (audience === "student" && n.type === "result_published") {
    const sessionId = findSessionId(n, normalized);
    if (sessionId) return `/dashboard/practice/session/${sessionId}/results`;
  }

  // Leaderboard notifications: the backend's actionUrl points at
  // /dashboard/leaderboard, which doesn't exist — the real page is
  // /dashboard/performance/leaderboard (student) or /admin/leaderboard (admin).
  if (n.type === "leaderboard_update") {
    return audience === "admin" ? "/admin/leaderboard" : "/dashboard/performance/leaderboard";
  }

  if (!normalized) return null;
  const path = normalized.split(/[?#]/)[0].replace(/(.)\/+$/, "$1");
  const routes = audience === "admin" ? ADMIN_ROUTES : STUDENT_ROUTES;
  return routes.some((r) => r.test(path)) ? normalized : null;
}
