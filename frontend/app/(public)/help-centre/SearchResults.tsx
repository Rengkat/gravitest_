import { ChevronRight, File, Search } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { PublicItem } from "@/lib/api/site-content";
import type { FaqItem, HelpCategoryItem } from "@/lib/site-content/types";

const SLUG_OK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
type Hit = { key: string; group: string; title: string; href?: string };

/** Searches the admin-managed help articles and FAQs. */
export default function SearchResults({
  query, categories, faqs,
}: { query: string; categories: PublicItem<HelpCategoryItem>[]; faqs: PublicItem<FaqItem>[] }) {
  const results = useMemo(() => {
    const q = query.toLowerCase();
    const out: Hit[] = [];
    for (const cat of categories) {
      for (const [i, art] of (cat.articles ?? []).entries()) {
        if (art.title.toLowerCase().includes(q) || cat.title.toLowerCase().includes(q) || art.body?.toLowerCase().includes(q)) {
          const linked = !!art.body && !!art.slug && SLUG_OK.test(art.slug);
          out.push({ key: `a-${cat.id}-${i}`, group: cat.title, title: art.title, href: linked ? `/help-centre/${art.slug}` : undefined });
        }
      }
    }
    for (const f of faqs) {
      if (f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)) {
        out.push({ key: `f-${f.id}`, group: `FAQ · ${f.category}`, title: f.question });
      }
    }
    return out.slice(0, 10);
  }, [query, categories, faqs]);

  if (!results.length) {
    return (
      <div className="text-center py-12" role="status">
        <div className="flex justify-center mb-4"><Search size={48} strokeWidth={1.5} aria-hidden="true" style={{ color: "#8aab98" }} /></div>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#0d2b1a", marginBottom: 8 }}>{`No results for "${query}"`}</p>
        <p style={{ fontSize: 14, color: "#4a6357" }}>Try different words, or browse the categories below.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[680px] mx-auto" data-testid="search-results">
      <p role="status" style={{ fontSize: 13, color: "#8aab98", marginBottom: 16, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em" }}>
        {`${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`}
      </p>
      <ul className="flex flex-col gap-2 list-none">
        {results.map((r) => {
          const inner = (
            <>
              <File size={16} strokeWidth={2} aria-hidden="true" style={{ color: "#8aab98", flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111a14" }} className="truncate">{r.title}</div>
                <div style={{ fontSize: 11, color: "#8aab98", marginTop: 2 }}>{r.group}</div>
              </div>
              {r.href && <ChevronRight size={14} strokeWidth={2.5} aria-hidden="true" style={{ color: "#8aab98", flexShrink: 0 }} />}
            </>
          );
          const cls = "flex items-center gap-3 px-5 py-4 rounded-xl no-underline";
          const style = { background: "white", border: "1px solid rgba(30,80,50,0.1)" };
          return (
            <li key={r.key}>
              {r.href ? <Link href={r.href} className={cls} style={style}>{inner}</Link> : <div className={cls} style={style}>{inner}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
