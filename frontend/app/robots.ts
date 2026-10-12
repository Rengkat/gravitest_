import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

// Served at /robots.txt automatically by Next.js. Keep this in sync with
// the noindex routes below AND with each private page's own `robots:
// { index: false }` metadata — the two mechanisms cover different things:
// this file tells crawlers not to *fetch* these paths at all (saves
// crawl budget), while per-page noindex meta tells them not to *index*
// a page they were still able to reach via some link. Both matter.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Authenticated app areas — nothing behind login should be
          // crawled; it's either private student data or a dead end for
          // an unauthenticated crawler anyway (middleware just bounces
          // it to /login).
          "/dashboard",
          "/admin",
          "/cbt",
          "/ai-tutor",
          // Auth flows that are only ever meaningful with a live token/
          // session in the URL or cookies — indexing these would just
          // put dead "verify your email" pages in search results.
          "/complete-registration",
          "/admin-onboarding",
          "/auth/callback",
          "/onboarding",
          // Utility/API-ish routes with no content of their own.
          "/api",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
