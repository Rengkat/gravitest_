"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import BlogHero from "./BlogHero";
import CategoryFilter from "./CategoryFilter";
import FeaturedPost from "./FeaturedPost";
import BlogGrid from "./BlogGrid";
import BlogSidebar from "./BlogSidebar";
import BlogCTA from "./BlogCTA";
import type { CategoryId, Post } from "./blogData";
import * as blogApi from "@/lib/api/blog";
import { useBlock, useCollection } from "@/lib/hooks/useSiteContent";

export default function BlogPageClient() {
  const [category, setCategory] = useState<CategoryId>("all");
  const [search, setSearch] = useState("");

  const [featured, setFeatured] = useState<Post | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const { block } = useBlock("blog.page");
  const { data: categoriesData } = useCollection("blog-categories");
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);
  const content = block ?? {};

  const gradientFor = useMemo(() => {
    const map = new Map(categories.map((c) => [c.slug, c.gradient ?? ""]));
    return (slug: string) => map.get(slug);
  }, [categories]);

  // Featured post is fetched once — it doesn't change with filters.
  useEffect(() => {
    blogApi
      .getFeaturedPost()
      .then((p) => setFeatured(p ? blogApi.toFrontendPost(p, gradientFor(p.category)) : null))
      .catch(() => {});
  }, [gradientFor]);

  // Debounced search + category-filtered fetch.
  useEffect(() => {
    const id = setTimeout(() => {
      setLoading(true);
      setFailed(false);
      blogApi
        .listPublishedPosts({ category, search: search || undefined, limit: 50 })
        .then((res) => {
          const mapped = res.data.map((p) => blogApi.toFrontendPost(p, gradientFor(p.category))).filter((p) => !p.featured);
          setPosts(mapped);
          setTotal(res.meta.totalItems);
        })
        .catch(() => setFailed(true))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(id);
  }, [category, search, gradientFor]);

  return (
    <>
      <BlogHero content={content} search={search} onSearch={setSearch} />

      {!search && <CategoryFilter categories={categories} active={category} onChange={setCategory} />}

      {!search && category === "all" && featured && <FeaturedPost post={featured} />}

      <section className="px-[5%] pb-[100px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 items-start">
          {loading ? (
            <div role="status" className="flex items-center justify-center py-24">
              <Loader2 size={28} className="animate-spin text-green-700" aria-hidden="true" />
              <span className="sr-only">Loading articles…</span>
            </div>
          ) : failed ? (
            <p role="alert" className="py-24 text-center text-text-muted">We couldn&apos;t load the articles right now. Please try again shortly.</p>
          ) : (
            <BlogGrid posts={posts} total={total} />
          )}

          <div className="lg:sticky lg:top-[92px]">
            <BlogSidebar content={content} categories={categories} onPickCategory={setCategory} />
          </div>
        </div>
      </section>

      <BlogCTA content={content} />
    </>
  );
}
