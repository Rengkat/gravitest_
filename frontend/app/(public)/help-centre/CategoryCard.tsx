import { useState } from "react";
import Link from "next/link";
import DynamicIcon from "@/Components/DynamicIcon";
import StatusBadge from "./StatusBadge";
import type { PublicItem } from "@/lib/api/site-content";
import type { HelpCategoryItem } from "@/lib/site-content/types";

const SLUG_OK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function CategoryCard({ cat, index }: { cat: PublicItem<HelpCategoryItem>; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const color = cat.color && /^#[0-9a-fA-F]{6}$/.test(cat.color) ? cat.color : "#1a4a2e";
  const articles = cat.articles ?? [];
  const shown = expanded ? articles : articles.slice(0, 3);

  return (
    <section
      data-testid={`category-card-${index}`}
      aria-label={cat.title}
      className="block rounded-[20px] p-7 border"
      style={{ background: "white", border: "1px solid rgba(30,80,50,0.1)" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}18`, color }}>
        <DynamicIcon name={cat.icon} size={22} strokeWidth={1.8} />
      </div>

      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#0d2b1a", lineHeight: 1.25 }}>{cat.title}</h3>
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold mt-0.5" style={{ background: "rgba(26,74,46,0.07)", color: "#276b43", fontFamily: "'JetBrains Mono', monospace" }}>
          {articles.length}
        </span>
      </div>

      {cat.description && <p style={{ fontSize: 13, color: "#4a6357", lineHeight: 1.6, marginBottom: 20 }}>{cat.description}</p>}

      <ul className="flex flex-col gap-2" style={{ listStyle: "none" }}>
        {shown.map((art, i) => {
          const linked = !!art.body && !!art.slug && SLUG_OK.test(art.slug);
          return (
            <li key={`${art.title}-${i}`} className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
              {linked ? (
                <Link href={`/help-centre/${art.slug}`} className="flex-1 truncate no-underline hover:underline" style={{ fontSize: 12, color: "#1a4a2e", lineHeight: 1.4 }}>
                  {art.title}
                </Link>
              ) : (
                <span className="flex-1 truncate" style={{ fontSize: 12, color: "#4a6357", lineHeight: 1.4 }}>{art.title}</span>
              )}
              {art.status && <StatusBadge status={art.status} />}
            </li>
          );
        })}
      </ul>

      {articles.length > 3 && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 text-[12px] font-semibold underline"
          style={{ color: "#276b43", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {expanded ? "Show fewer" : `Show all ${articles.length} articles`}
        </button>
      )}
    </section>
  );
}
