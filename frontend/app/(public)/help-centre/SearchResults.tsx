import { CATEGORIES } from "@/lib/constants/help-data";
import { ChevronRight, File, Search } from "lucide-react";
import { useMemo } from "react";

/* ─────────────────────────────────────────────────────────
   SEARCH RESULTS
───────────────────────────────────────────────────────── */
export default function SearchResults({ query }: { query: string }) {
  const results = useMemo(() => {
    const q = query.toLowerCase();
    const out: { cat: string; slug: string; title: string }[] = [];
    for (const cat of CATEGORIES) {
      for (const art of cat.articles) {
        if (art.title.toLowerCase().includes(q) || cat.title.toLowerCase().includes(q)) {
          out.push({ cat: cat.title, slug: art.slug, title: art.title });
        }
      }
    }
    return out.slice(0, 8);
  }, [query]);

  if (!results.length) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <Search size={48} strokeWidth={1.5} style={{ color: "#8aab98" }} />
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#0d2b1a", marginBottom: 8 }}>
          {`No results for "${query}"`}
        </p>
        <p style={{ fontSize: 14, color: "#4a6357" }}>
          Try different words, or browse the categories below.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[680px] mx-auto" data-testid="search-results">
      <p
        style={{
          fontSize: 13,
          color: "#8aab98",
          marginBottom: 16,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.06em",
        }}>
        {`${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`}
      </p>
      <div className="flex flex-col gap-2">
        {results.map((r) => (
          <a
            key={r.slug}
            href={`/help/${r.slug}`}
            className="flex items-center gap-3 px-5 py-4 rounded-xl transition-all duration-200 no-underline group"
            style={{ background: "white", border: "1px solid rgba(30,80,50,0.1)" }}>
            <File size={16} strokeWidth={2} style={{ color: "#8aab98", flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <div
                style={{ fontSize: 14, fontWeight: 600, color: "#111a14" }}
                className="group-hover:text-[#1a4a2e] transition-colors truncate">
                {r.title}
              </div>
              <div style={{ fontSize: 11, color: "#8aab98", marginTop: 2 }}>{r.cat}</div>
            </div>
            <ChevronRight size={14} strokeWidth={2.5} style={{ color: "#8aab98", flexShrink: 0 }} />
          </a>
        ))}
      </div>
    </div>
  );
}
