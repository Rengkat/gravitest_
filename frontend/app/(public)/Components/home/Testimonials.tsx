import { Award } from "lucide-react";
import type { HomeTestimonials, TestimonialItem } from "@/lib/site-content/types";

// Avatar fallback colours: static strings so Tailwind keeps them; chosen by position.
const AVATARS = ["bg-gold text-green-900", "bg-green-600 text-white", "bg-green-800 text-white"];

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function Avatar({ t, index }: { t: TestimonialItem; index: number }) {
  if (t.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={t.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" loading="lazy" />;
  }
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-[15px] shrink-0 ${AVATARS[index % AVATARS.length]}`} aria-hidden="true">
      {initialsOf(t.name)}
    </div>
  );
}

function Card({ t, index }: { t: TestimonialItem; index: number }) {
  const f = !!t.featured;
  return (
    <figure
      className={`rounded-[20px] px-7 py-8 border transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[var(--shadow-card)] [animation:fadeUp_0.6s_ease_both] ${
        f ? "bg-green-800 border-green-700" : "bg-white border-cream-border"
      }`}
      style={{ animationDelay: `${index * 0.12}s` }}>
      {t.score && (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold mb-3 ${f ? "bg-gold/15 text-gold" : "bg-green-500/10 text-green-600"}`}>
          <Award size={11} strokeWidth={2.5} aria-hidden="true" />
          {t.score}
        </div>
      )}
      <div aria-hidden="true" className={`text-[36px] leading-none mb-3.5 font-serif ${f ? "text-gold opacity-50" : "text-green-200 opacity-30"}`}>&quot;</div>
      <blockquote className={`text-sm leading-[1.7] mb-5 italic ${f ? "text-white/80" : "text-text-muted"}`}>{t.quote}</blockquote>
      <figcaption className={`flex items-center gap-3 pt-4 border-t ${f ? "border-white/10" : "border-cream-border"}`}>
        <Avatar t={t} index={index} />
        <div>
          <div className={`text-sm font-bold ${f ? "text-white" : "text-text-main"}`}>{t.name}</div>
          {t.role && <div className={`text-xs ${f ? "text-white/45" : "text-text-light"}`}>{t.role}</div>}
        </div>
      </figcaption>
    </figure>
  );
}

export default function Testimonials({ content, items }: { content: HomeTestimonials; items: TestimonialItem[] }) {
  if (!items.length) return null;
  return (
    <section className="px-[5%] py-[100px] bg-cream-dark">
      <div className="mb-16">
        {content.eyebrow && (
          <div className="inline-flex items-center gap-2 mb-4 before:content-[''] before:block before:w-6 before:h-0.5 before:rounded-sm before:bg-green-500">
            <span className="text-[11px] font-bold text-green-600 tracking-[0.12em] uppercase">{content.eyebrow}</span>
          </div>
        )}
        {content.title && (
          <h2 className="font-serif font-bold text-green-900 leading-[1.1] tracking-[-0.03em]" style={{ fontSize: "clamp(32px, 4vw, 52px)", maxWidth: "600px" }}>
            {content.title}
          </h2>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((t, i) => (
          <Card key={`${t.name}-${i}`} t={t} index={i} />
        ))}
      </div>
    </section>
  );
}
