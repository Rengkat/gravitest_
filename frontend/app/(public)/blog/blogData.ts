/**
 * Blog view-model types. All blog content (posts, categories) lives in the
 * database and is managed from Admin → Website Content; nothing is hardcoded here.
 */

/** "all" or the slug of an admin-managed blog category. */
export type CategoryId = string;

export type Author = {
  initials: string;
  name: string;
  role: string;
};

export type Post = {
  slug: string;
  category: CategoryId;
  tag: string;
  title: string;
  excerpt: string;
  author: Author;
  date: string;
  readTime: string;
  featured?: boolean;
  coverImageUrl?: string;
  gradientCls: string; // a complete static literal from GRADIENT_CLASSES (Tailwind can't scan built strings)
};
