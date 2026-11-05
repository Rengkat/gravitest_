"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Send, TrendingUp } from "lucide-react";
import * as blogApi from "@/lib/api/blog";
import type { BackendPost } from "@/lib/api/blog";
import type { PublicItem } from "@/lib/api/site-content";
import type { BlogCategoryItem, BlogPage } from "@/lib/site-content/types";
import type { CategoryId } from "./blogData";

interface Props {
  content: BlogPage;
  categories: PublicItem<BlogCategoryItem>[];
  onPickCategory: (id: CategoryId) => void;
}

const fmt = (p: BackendPost) =>
  new Date(p.publishedAt ?? p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function BlogSidebar({ content, categories, onPickCategory }: Props) {
  const [popular, setPopular] = useState<BackendPost[]>([]);

  useEffect(() => {
    let live = true;
    blogApi.getPopularPosts().then((p) => live && setPopular(p)).catch(() => {});
    return () => { live = false; };
  }, []);

  const hasPromoBox = !!(content.sidebarTitle && content.sidebarButtonLabel && content.sidebarButtonHref);
  const hasPromoCard = !!(content.promoTitle && content.promoButtonLabel && content.promoButtonHref);

  return (
    <aside className="flex flex-col gap-6">
      {hasPromoBox && (
        <div className="rounded-[20px] bg-green-800 p-6 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative z-[1]">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center mb-4">
              <Send size={18} strokeWidth={1.75} className="text-gold" aria-hidden="true" />
            </div>
            <h3 className="font-serif text-[20px] text-white leading-tight mb-2">{content.sidebarTitle}</h3>
            {content.sidebarSubtitle && <p className="text-white/55 text-[13px] leading-relaxed mb-4">{content.sidebarSubtitle}</p>}
            <Link
              href={content.sidebarButtonHref!}
              className="inline-flex w-full items-center justify-center py-3 bg-gold text-green-900 font-bold text-sm rounded-xl no-underline hover:bg-gold-dark transition-all duration-200">
              {content.sidebarButtonLabel}
            </Link>
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="rounded-[20px] bg-white border border-cream-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} strokeWidth={1.75} className="text-green-600" aria-hidden="true" />
            <h3 className="text-sm font-bold text-green-900 uppercase tracking-[0.08em]">{content.topicsTitle || "Topics"}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onPickCategory(c.slug);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-3 py-1.5 rounded-lg bg-cream-dark border border-cream-border text-xs font-semibold text-text-muted transition-all duration-200 hover:border-green-800/30 hover:bg-green-50 hover:text-green-800">
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {popular.length > 0 && (
        <div className="rounded-[20px] bg-white border border-cream-border p-6">
          <h3 className="text-sm font-bold text-green-900 uppercase tracking-[0.08em] mb-4">{content.popularTitle || "Most Read"}</h3>
          <ol className="flex flex-col gap-4 list-none">
            {popular.map((post, i) => (
              <li key={post.id}>
                <Link href={`/blog/${post.slug}`} className="flex items-start gap-3 group no-underline">
                  <span aria-hidden="true" className="font-serif text-[28px] text-green-800/15 leading-none shrink-0 w-6 text-center">{i + 1}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-green-900 leading-[1.4] group-hover:text-green-600 transition-colors">{post.title}</p>
                    <p className="text-[11px] text-text-light mt-1">{post.readTimeMinutes} min read · {fmt(post)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      {hasPromoCard && (
        <div className="rounded-[20px] bg-cream-dark border border-cream-border p-6 text-center">
          <h3 className="font-serif text-[18px] text-green-900 mb-2">{content.promoTitle}</h3>
          {content.promoText && <p className="text-[13px] text-text-muted leading-relaxed mb-4">{content.promoText}</p>}
          <Link
            href={content.promoButtonHref!}
            className="inline-flex items-center gap-2 px-5 py-3 bg-green-800 text-white font-bold text-sm rounded-xl no-underline hover:bg-green-700 transition-all duration-200 hover:-translate-y-0.5">
            {content.promoButtonLabel}
            <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </div>
      )}
    </aside>
  );
}
