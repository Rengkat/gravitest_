// Single source of truth for the site's canonical URL and identity —
// every SEO surface (root metadata, robots.ts, sitemap.ts, JSON-LD)
// reads from here instead of hardcoding the domain in multiple places,
// which is how metadataBase and canonical tags drift out of sync.
//
// Set NEXT_PUBLIC_SITE_URL in production (e.g. https://gravitest.ng).
// Falls back to the known production domain so nothing breaks if it's
// ever left unset, but a preview/staging deploy should set this to its
// own URL or its canonical tags will incorrectly point at production.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gravitest.ng").replace(/\/+$/, "");

export const SITE_NAME = "Gravitest";

export const SITE_DESCRIPTION =
  "Gravitest is Nigeria's AI-powered exam preparation platform. Practice JAMB, WAEC, NECO, " +
  "Post-UTME and professional exams with realistic CBT simulation, instant AI explanations in " +
  "Pidgin or English, and real-time performance analytics — even on 2G networks.";

export const TWITTER_HANDLE = "@Gravitestng";

export const DEFAULT_OG_IMAGE = {
  url: "/og/default.png",
  width: 1200,
  height: 630,
  alt: "Gravitest — Nigeria's AI-Powered Exam Prep Platform",
};

export function absoluteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}
