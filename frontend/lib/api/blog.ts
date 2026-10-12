import { apiClient } from "./client";
import type { Post, CategoryId, Author } from "@/app/(public)/blog/blogData";

// Deterministic category → gradient mapping, replacing the old
// per-post hardcoded gradientCls (Tailwind can't scan dynamically built
// class names, so this stays a fixed lookup table, not computed).
const CATEGORY_GRADIENTS: Record<CategoryId, string> = {
  all: "from-green-800 to-green-600",
  jamb: "from-green-900 to-green-700",
  waec: "from-green-800 to-green-600",
  "ai-learning": "from-green-700 to-teal-700",
  "study-tips": "from-green-800 to-green-700",
  "success-stories": "from-gold-dark to-green-700",
};

export interface BackendPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: CategoryId;
  tag: string;
  authorName: string;
  authorRole: string | null;
  authorInitials: string | null;
  coverImageUrl: string | null;
  readTimeMinutes: number;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
}

// Maps the real backend shape onto the existing frontend `Post` type
// (app/(public)/blog/blogData.ts) so BlogGrid, PostCard, FeaturedPost,
// CategoryFilter etc. need zero changes — only the data source moves.
export function toFrontendPost(p: BackendPost): Post {
  const author: Author = {
    initials: p.authorInitials ?? p.authorName.slice(0, 2).toUpperCase(),
    name: p.authorName,
    role: p.authorRole ?? "",
  };
  return {
    slug: p.slug,
    category: p.category,
    tag: p.tag,
    title: p.title,
    excerpt: p.excerpt,
    author,
    date: new Date(p.publishedAt ?? p.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    readTime: `${p.readTimeMinutes} min read`,
    featured: p.isFeatured,
    gradientCls: CATEGORY_GRADIENTS[p.category] ?? CATEGORY_GRADIENTS.all,
  };
}

interface PaginatedPosts {
  data: BackendPost[];
  meta: { totalItems: number; totalPages: number; currentPage: number };
}

export async function listPublishedPosts(params?: {
  category?: CategoryId;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedPosts> {
  const { data } = await apiClient.get("/blog/posts", {
    params: { ...params, category: params?.category === "all" ? undefined : params?.category },
  });
  return data;
}

export async function getFeaturedPost(): Promise<BackendPost | null> {
  const { data } = await apiClient.get("/blog/posts/featured");
  return data;
}

export async function getPostBySlug(
  slug: string,
): Promise<{ post: BackendPost; related: BackendPost[] }> {
  const { data } = await apiClient.get(`/blog/posts/${slug}`);
  return data;
}
