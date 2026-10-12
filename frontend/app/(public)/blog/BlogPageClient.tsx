"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import BlogHero from "./BlogHero";
import CategoryFilter from "./CategoryFilter";
import FeaturedPost from "./FeaturedPost";
import BlogGrid from "./BlogGrid";
import BlogSidebar from "./BlogSidebar";
import BlogCTA from "./BlogCTA";
import type { CategoryId, Post } from "./blogData";
import * as blogApi from "@/lib/api/blog";

export default function BlogPageClient() {
  const [category, setCategory] = useState<CategoryId>("all");
  const [search, setSearch] = useState("");

  const [featured, setFeatured] = useState<Post | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Featured post is fetched once — it doesn't change with filters.
  useEffect(() => {
    blogApi
      .getFeaturedPost()
      .then((p) => setFeatured(p ? blogApi.toFrontendPost(p) : null))
      .catch(() => {});
  }, []);

  // Debounced search + category-filtered fetch.
  useEffect(() => {
    const id = setTimeout(() => {
      setLoading(true);
      blogApi
        .listPublishedPosts({ category, search: search || undefined, limit: 50 })
        .then((res) => {
          const mapped = res.data.map(blogApi.toFrontendPost).filter((p) => !p.featured);
          setPosts(mapped);
          setTotal(res.meta.totalItems);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(id);
  }, [category, search]);

  return (
    <>
      {/* ── Hero with search ── */}
      <BlogHero search={search} onSearch={setSearch} />

      {/* ── Category filter ── */}
      {!search && <CategoryFilter active={category} onChange={setCategory} />}

      {/* ── Featured post (only shown when no filter active) ── */}
      {!search && category === "all" && featured && <FeaturedPost post={featured} />}

      {/* ── Main content + sidebar ── */}
      <section className="px-[5%] pb-[100px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 items-start">
          {/* Posts grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={28} className="animate-spin text-green-700" />
            </div>
          ) : (
            <BlogGrid posts={posts} total={total} />
          )}

          {/* Sidebar */}
          <div className="sticky top-[92px]">
            <BlogSidebar />
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <BlogCTA />
    </>
  );
}
