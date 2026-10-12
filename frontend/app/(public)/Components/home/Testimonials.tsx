import { Target, BookOpen, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────── */
type Testimonial = {
  ChipIcon: LucideIcon;
  chipText: string;
  quote: string;
  initials: string;
  name: string;
  role: string;
  featured?: boolean;
};

/* ─── Data ───────────────────────────────────────────────────────────────────
   chip.cls / avatar.bgCls / avatar.textCls removed from data — those were
   dynamic class strings invisible to Tailwind's scanner. All colour decisions
   now live in explicit component branches below.
──────────────────────────────────────────────────────────────────────────── */
const TESTIMONIALS: Testimonial[] = [
  {
    ChipIcon: Target,
    chipText: "312 in JAMB 2024",
    quote:
      "I failed JAMB twice before I found Gravitest. The Sabi-Explain feature changed everything — I finally understood why answers were wrong. Scored 312 on my third attempt.",
    initials: "AO",
    name: "Adaeze Okonkwo",
    role: "Medicine, University of Lagos",
    featured: true,
  },
  {
    ChipIcon: BookOpen,
    chipText: "7 A's in WAEC",
    quote:
      "The essay practice mode with AI grading is insane. It told me exactly where I was losing marks in English — my sentence structure. Fixed it in 2 weeks.",
    initials: "KA",
    name: "Kolade Adeyemi",
    role: "SS3 Graduate, Ibadan",
  },
  {
    ChipIcon: Zap,
    chipText: "Offline mode user",
    quote:
      "Data is expensive where I live, so I download my past questions on Wi-Fi at school and practice all weekend without spending a naira on data. Game changer.",
    initials: "MO",
    name: "Mercy Okafor",
    role: "SS2 Student, Enugu",
  },
];

/* ─── Chip ───────────────────────────────────────────────────────────────────
   Each variant is its own branch — fully static class strings.
──────────────────────────────────────────────────────────────────────────── */
function Chip({
  ChipIcon,
  chipText,
  featured,
}: {
  ChipIcon: LucideIcon;
  chipText: string;
  featured: boolean;
}) {
  const base =
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold mb-3";

  if (featured) {
    return (
      <div className={`${base} bg-gold/15 text-gold`}>
        <ChipIcon size={11} strokeWidth={2.5} />
        {chipText}
      </div>
    );
  }
  if (chipText.includes("WAEC")) {
    return (
      <div className={`${base} bg-green-500/10 text-green-600`}>
        <ChipIcon size={11} strokeWidth={2.5} />
        {chipText}
      </div>
    );
  }
  return (
    <div className={`${base} bg-orange-400/10 text-orange-400`}>
      <ChipIcon size={11} strokeWidth={2.5} />
      {chipText}
    </div>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────────────────
   bg and text colour per initials — explicit branches, not dynamic strings.
──────────────────────────────────────────────────────────────────────────── */
function Avatar({ initials }: { initials: string }) {
  const base =
    "w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-[15px] shrink-0";

  if (initials === "AO") return <div className={`${base} bg-gold text-green-900`}>{initials}</div>;
  if (initials === "KA") return <div className={`${base} bg-green-600 text-white`}>{initials}</div>;
  return <div className={`${base} bg-green-800 text-white`}>{initials}</div>;
}

/* ─── Card ───────────────────────────────────────────────────────────────────
   Featured and standard are fully separate branches — no ternary merging
   class strings so every class is a complete scannable literal.
──────────────────────────────────────────────────────────────────────────── */
function TestimonialCard({
  ChipIcon,
  chipText,
  quote,
  initials,
  name,
  role,
  featured = false,
  index,
}: Testimonial & { index: number }) {
  if (featured) {
    return (
      <div
        className="rounded-[20px] px-7 py-8 border transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[var(--shadow-card)] bg-green-800 border-green-700 [animation:fadeUp_0.6s_ease_both]"
        style={{ animationDelay: `${index * 0.12}s` }}>
        {/* Stars */}
        <div className="flex gap-0.5 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="text-gold text-sm">
              ★
            </span>
          ))}
        </div>

        <Chip ChipIcon={ChipIcon} chipText={chipText} featured />

        {/* Quote mark */}
        <div className="text-[36px] leading-none mb-3.5 font-serif text-gold opacity-50">
          &quot;
        </div>

        {/* Text */}
        <p className="text-sm leading-[1.7] mb-5 italic text-white/80">{quote}</p>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
          <Avatar initials={initials} />
          <div>
            <div className="text-sm font-bold text-white">{name}</div>
            <div className="text-xs text-white/45">{role}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[20px] px-7 py-8 border transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[var(--shadow-card)] bg-white border-cream-border [animation:fadeUp_0.6s_ease_both]"
      style={{ animationDelay: `${index * 0.12}s` }}>
      {/* Stars */}
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="text-gold text-sm">
            ★
          </span>
        ))}
      </div>

      <Chip ChipIcon={ChipIcon} chipText={chipText} featured={false} />

      {/* Quote mark */}
      <div className="text-[36px] leading-none mb-3.5 font-serif text-green-200 opacity-30">
        &quot;
      </div>

      {/* Text */}
      <p className="text-sm leading-[1.7] mb-5 italic text-text-muted">{quote}</p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-cream-border">
        <Avatar initials={initials} />
        <div>
          <div className="text-sm font-bold text-text-main">{name}</div>
          <div className="text-xs text-text-light">{role}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Section ────────────────────────────────────────────── */
export default function Testimonials() {
  return (
    <section className="px-[5%] py-[100px] bg-cream-dark">
      {/* ── Header — no reveal wrapper, always visible ── */}
      <div className="mb-16">
        {/* Label */}
        <div className="inline-flex items-center gap-2 mb-4 before:content-[''] before:block before:w-6 before:h-0.5 before:rounded-sm before:bg-green-500">
          <span className="text-[11px] font-bold text-green-600 tracking-[0.12em] uppercase">
            Student Stories
          </span>
        </div>

        {/* Title */}
        <h2
          className="font-serif font-bold text-green-900 leading-[1.1] tracking-[-0.03em]"
          style={{ fontSize: "clamp(32px, 4vw, 52px)", maxWidth: "600px" }}>
          From &quot;I&apos;m not sure&quot; to &quot;I scored 312.&quot;
        </h2>
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, i) => (
          <TestimonialCard key={t.name} {...t} index={i} />
        ))}
      </div>
    </section>
  );
}
