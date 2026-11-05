import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCollection } from "@/lib/api/site-content";
import type { HelpCategoryItem } from "@/lib/site-content/types";
import SimpleMarkdown from "../../blog/[slug]/SimpleMarkdown";
import { absoluteUrl } from "@/lib/seo/site";

export const revalidate = 60;

async function findArticle(slug: string) {
  try {
    const cats = await getCollection<HelpCategoryItem>("help-categories");
    for (const cat of cats) {
      const article = (cat.articles ?? []).find((a) => a.slug === slug && a.body);
      if (article) return { cat, article };
    }
  } catch {
    /* treated as not found */
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const found = await findArticle(slug);
  if (!found) return { title: "Help article not found" };
  return {
    title: `${found.article.title} — Gravitest Help Centre`,
    alternates: { canonical: absoluteUrl(`/help-centre/${slug}`) },
  };
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await findArticle(slug);
  if (!found) notFound();
  const { cat, article } = found;

  return (
    <article className="min-h-screen bg-cream px-[5%] pt-[130px] pb-20">
      <div className="max-w-3xl mx-auto">
        <Link href="/help-centre" className="inline-flex items-center gap-1.5 text-sm text-green-800 no-underline mb-6">
          <ArrowLeft size={14} aria-hidden="true" /> Back to Help Centre
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">{cat.title}</p>
        <h1 className="font-serif text-[34px] md:text-[44px] leading-tight text-green-900 mb-8">{article.title}</h1>
        <SimpleMarkdown content={article.body ?? ""} />
      </div>
    </article>
  );
}
