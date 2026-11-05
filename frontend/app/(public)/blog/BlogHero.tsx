import { Search } from "lucide-react";
import type { BlogPage } from "@/lib/site-content/types";

interface Props {
  content: BlogPage;
  search: string;
  onSearch: (val: string) => void;
}

export default function BlogHero({ content, search, onSearch }: Props) {
  const stats = content.heroStats ?? [];
  return (
    <section className="pt-[140px] pb-16 px-[5%] text-center relative overflow-hidden bg-cream">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(46,139,87,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(245,200,66,0.05) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(26,74,46,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(26,74,46,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)",
        }}
      />

      <div className="relative z-[1]">
        {content.heroEyebrow && (
          <div className="inline-flex items-center gap-2 mb-4 [animation:fadeUp_0.6s_ease_both] before:content-[''] before:block before:w-6 before:h-0.5 before:rounded-sm before:bg-green-500">
            <span className="text-[11px] font-bold text-green-600 tracking-[0.12em] uppercase">{content.heroEyebrow}</span>
          </div>
        )}

        {content.heroTitle && (
          <h1
            className="font-serif text-green-900 leading-[1.08] tracking-[-1.5px] mb-5 [animation:fadeUp_0.6s_0.1s_ease_both]"
            style={{ fontSize: "clamp(38px, 5vw, 64px)" }}>
            {content.heroTitle}
            {content.heroTitleHighlight && (
              <>
                <br />
                <em className="not-italic text-green-600">{content.heroTitleHighlight}</em>
              </>
            )}
          </h1>
        )}

        {content.heroSubtitle && (
          <p className="text-lg text-text-muted max-w-[500px] mx-auto mb-10 leading-[1.7] [animation:fadeUp_0.6s_0.2s_ease_both]">
            {content.heroSubtitle}
          </p>
        )}

        <div className="max-w-[520px] mx-auto [animation:fadeUp_0.6s_0.3s_ease_both]">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
              <Search size={18} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <input
              type="search"
              aria-label="Search articles"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search articles"
              className="w-full pl-12 pr-5 py-4 rounded-[14px] bg-white border border-cream-border text-green-900 text-sm font-medium placeholder:text-green-900/30 outline-none transition-all duration-200 shadow-[var(--shadow-card)] focus:border-green-800 focus:shadow-[0_0_0_3px_rgba(26,74,46,0.1)]"
            />
          </div>
        </div>

        {stats.length > 0 && (
          <div className="flex items-center justify-center gap-6 mt-10 flex-wrap [animation:fadeUp_0.6s_0.4s_ease_both]">
            {stats.map(({ value, label }, i) => (
              <div key={`${label}-${i}`} className="flex items-center gap-2 text-sm text-text-muted">
                <span className="font-serif text-lg text-green-800">{value}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
