import { apiClient } from "./client";
import type { Post, CategoryId, Author } from "@/app/(public)/blog/blogData";

// Cover style -> Tailwind gradient. Tailwind can't scan dynamically built class
// names, so these stay complete literals; admins pick the style per category.
export const GRADIENT_CLASSES: Record<string, string> = {
  green: "from-green-800 to-green-600",
  "deep-green": "from-green-900 to-green-700",
  teal: "from-green-700 to-teal-700",
  gold: "from-gold-dark to-green-700",
};
const DEFAULT_GRADIENT = GRADIENT_CLASSES.green;

export interface BackendPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
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
export function toFrontendPost(p: BackendPost, gradient?: string): Post {
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
    coverImageUrl: p.coverImageUrl ?? undefined,
    gradientCls: (gradient && GRADIENT_CLASSES[gradient]) || DEFAULT_GRADIENT,
  };
}

export interface PaginatedPosts {
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

export async function getPopularPosts(): Promise<BackendPost[]> {
  const { data } = await apiClient.get("/blog/posts/popular");
  return data;
}

export async function getPostBySlug(
  slug: string,
): Promise<{ post: BackendPost; related: BackendPost[] }> {
  const { data } = await apiClient.get(`/blog/posts/${slug}`);
  return data;
}

/* ─── Admin (JWT + ADMIN/SUPER_ADMIN) ─────────────────────────────────────── */

export interface AdminPostInput {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  category: string;
  tag: string;
  authorName: string;
  authorRole?: string;
  authorInitials?: string;
  coverImageUrl?: string;
  readTimeMinutes?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
}

export async function adminListPosts(params?: { page?: number; limit?: number; search?: string; isPublished?: boolean; category?: string }): Promise<PaginatedPosts> {
  return (await apiClient.get("/blog/admin/posts", { params })).data;
}
export async function adminGetPost(id: string): Promise<BackendPost> {
  return (await apiClient.get(`/blog/admin/posts/${id}`)).data;
}
export async function adminCreatePost(input: AdminPostInput): Promise<BackendPost> {
  return (await apiClient.post("/blog/admin/posts", input)).data;
}
export async function adminUpdatePost(id: string, input: Partial<AdminPostInput>): Promise<BackendPost> {
  return (await apiClient.patch(`/blog/admin/posts/${id}`, input)).data;
}
export async function adminSetPostPublished(id: string, published: boolean): Promise<BackendPost> {
  return (await apiClient.patch(`/blog/admin/posts/${id}/${published ? "publish" : "unpublish"}`)).data;
}
export async function adminDeletePost(id: string): Promise<void> {
  await apiClient.delete(`/blog/admin/posts/${id}`);
}
