import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";
import * as blogApi from "@/lib/api/blog";

// Served at /sitemap.xml automatically by Next.js. Blog posts are fetched
// live from the backend so a newly published post shows up here without
// a redeploy — but if the API is unreachable at build/request time, we
// fall back to just the static routes rather than failing the whole
// sitemap (a sitemap missing blog posts is far better than no sitemap).
async function getBlogPostEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  try {
    let page = 1;
    const limit = 100;
    // Bounded to 20 pages (2,000 posts) as a sanity ceiling — a content
    // library well past that size should switch to a sitemap index file
    // instead of one flat sitemap, which Google also supports natively.
    for (; page <= 20; page++) {
      const { data, meta } = await blogApi.listPublishedPosts({ page, limit });
      for (const post of data) {
        entries.push({
          url: `${SITE_URL}/blog/${post.slug}`,
          lastModified: post.publishedAt ?? post.createdAt,
          changeFrequency: "monthly",
          priority: post.isFeatured ? 0.8 : 0.6,
        });
      }
      if (page >= meta.totalPages) break;
    }
  } catch {
    // Backend unreachable at build time — ship the sitemap without blog
    // entries rather than failing the build.
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/pricing`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/community`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/help-centre`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/video-tutorials`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/register`, changeFrequency: "yearly", priority: 0.5 },
  ];

  const blogEntries = await getBlogPostEntries();

  return [...staticRoutes, ...blogEntries];
}
