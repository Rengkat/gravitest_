import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft, Eye } from "lucide-react";
import * as blogApi from "@/lib/api/blog";
import { CATEGORIES } from "../blogData";
import SimpleMarkdown from "./SimpleMarkdown";
import PostCard from "../PostCard";
import { JsonLd, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { absoluteUrl } from "@/lib/seo/site";

// Server component — fetched directly on the server for real SSR/SEO
// (this is public marketing content, exactly the kind of page that
// should be indexable and fast on first paint, unlike the dashboard
// which is client-rendered behind auth).
async function getData(slug: string) {
  try {
    return await blogApi.getPostBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getData(slug);
  if (!data) return { title: "Post Not Found | Gravitest Blog" };

  const { post } = data;
  const url = absoluteUrl(`/blog/${post.slug}`);
  const publishedTime = post.publishedAt ?? post.createdAt;

  return {
    title: post.title,
    description: post.excerpt,
    keywords: [post.tag, post.category, "JAMB", "WAEC", "Nigerian exam prep"],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.excerpt,
      publishedTime,
      authors: [post.authorName],
      images: post.coverImageUrl ? [{ url: post.coverImageUrl, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getData(slug);
  if (!data) notFound();

  const { post, related } = data;
  const categoryLabel = CATEGORIES.find((c) => c.id === post.category)?.label ?? post.tag;
  const frontendRelated = related.map(blogApi.toFrontendPost);

  return (
    <article className="bg-cream min-h-screen">
      <JsonLd
        data={articleJsonLd({
          title: post.title,
          description: post.excerpt,
          slug: post.slug,
          authorName: post.authorName,
          publishedAt: post.publishedAt,
          modifiedAt: post.publishedAt,
          imageUrl: post.coverImageUrl,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      {/* Hero */}
      <div className={`bg-gradient-to-br ${blogApi.toFrontendPost(post).gradientCls} text-white pt-[140px] pb-16 px-[5%]`}>
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 no-underline transition-colors">
            <ArrowLeft size={14} /> Back to Blog
          </Link>
          <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-[12px] font-semibold mb-4">
            {categoryLabel}
          </span>
          <h1 className="font-serif text-[32px] md:text-[42px] leading-tight mb-5">{post.title}</h1>
          <p className="text-white/75 text-[16px] leading-relaxed mb-6">{post.excerpt}</p>

          <div className="flex items-center gap-4 flex-wrap text-white/70 text-[13px]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-[12px]">
                {post.authorInitials ?? post.authorName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-white text-[13px]">{post.authorName}</div>
                {post.authorRole && <div className="text-[11px] text-white/60">{post.authorRole}</div>}
              </div>
            </div>
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />
              {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} /> {post.readTimeMinutes} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Eye size={13} /> {post.viewCount.toLocaleString()} views
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-[5%] py-14">
        <SimpleMarkdown content={post.content} />
      </div>

      {/* Related posts */}
      {frontendRelated.length > 0 && (
        <div className="max-w-6xl mx-auto px-[5%] pb-20">
          <h2 className="font-serif text-2xl text-green-900 mb-6">More on {categoryLabel}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {frontendRelated.map((p, i) => (
              <PostCard key={p.slug} post={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
