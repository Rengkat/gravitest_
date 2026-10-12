import { Category } from "@/lib/constants/help-data";
import { useState } from "react";
import StatusBadge from "./StatusBadge";

/* ─────────────────────────────────────────────────────────
   CATEGORY CARD
───────────────────────────────────────────────────────── */
export default function CategoryCard({ cat, index }: { cat: Category; index: number }) {
  const [hovered, setHovered] = useState(false);
  const IconComponent = cat.icon;

  return (
    <a
      href={`/help/category/${cat.title.toLowerCase().replace(/\s+/g, "-")}`}
      data-testid={`category-card-${index}`}
      className="block no-underline rounded-[20px] p-7 border transition-all duration-300"
      style={{
        background: "white",
        border: `1px solid ${hovered ? "rgba(46,139,87,0.25)" : "rgba(30,80,50,0.1)"}`,
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 4px 32px rgba(13,43,26,0.10)" : "none",
        animationDelay: `${index * 0.07}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${cat.color}18` }}>
        <IconComponent size={22} strokeWidth={1.8} style={{ color: cat.color }} />
      </div>

      {/* Title + article count */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 18,
            color: "#0d2b1a",
            lineHeight: 1.25,
          }}>
          {cat.title}
        </h3>
        <span
          className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold mt-0.5"
          style={{
            background: "rgba(26,74,46,0.07)",
            color: "#276b43",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
          {cat.articles.length}
        </span>
      </div>

      <p style={{ fontSize: 13, color: "#4a6357", lineHeight: 1.6, marginBottom: 20 }}>
        {cat.description}
      </p>

      {/* Top articles preview */}
      <ul className="flex flex-col gap-2" style={{ listStyle: "none" }}>
        {cat.articles.slice(0, 3).map((art) => (
          <li key={art.slug} className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full shrink-0" style={{ background: cat.color }} />
            <span
              style={{ fontSize: 12, color: "#4a6357", lineHeight: 1.4 }}
              className="flex-1 truncate">
              {art.title}
            </span>
            {art.status && <StatusBadge status={art.status} />}
          </li>
        ))}
        {cat.articles.length > 3 && (
          <li style={{ fontSize: 12, color: "#8aab98", paddingLeft: 12 }}>
            +{cat.articles.length - 3} more articles
          </li>
        )}
      </ul>
    </a>
  );
}
