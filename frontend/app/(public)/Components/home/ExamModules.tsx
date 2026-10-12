import { ReactNode } from "react";

/* ─── Types ──────────────────────────────────────────────── */
type Module = {
  badge: string;
  title: string;
  desc: string;
  meta: ReactNode;
};

/* ─── Data ───────────────────────────────────────────────── */
const MODULES: Module[] = [
  {
    badge: "JAMB / UTME",
    title: "JAMB CBT Simulator",
    desc: "Exact JAMB interface. 10+ years of past questions. Mock scheduling with real exam conditions.",
    meta: (
      <>
        <strong>40,000+</strong> questions &nbsp;·&nbsp; <strong>10</strong> years
      </>
    ),
  },
  {
    badge: "WAEC / NECO",
    title: "WAEC & NECO CBT",
    desc: "Objective AND theory/essay. WAEC's new 2026 digital interface. AI-powered marking for essays.",
    meta: (
      <>
        <strong>Obj + Theory</strong> &nbsp;·&nbsp; <strong>2026 Ready</strong>
      </>
    ),
  },
  {
    badge: "Post-UTME",
    title: "Post-UTME Suite",
    desc: "University-specific questions for UNILAG, UI, OAU, ABU, UNIBEN and 40+ more. Each school's format respected.",
    meta: (
      <>
        <strong>40+</strong> universities &nbsp;·&nbsp; <strong>Cut-off</strong> tracker
      </>
    ),
  },
  {
    badge: "Professional",
    title: "ICAN & Nursing",
    desc: "MCQ and essay for ICAN (2025/26 syllabus) and Nursing Council certifications with AI grading.",
    meta: (
      <>
        <strong>2025/26</strong> syllabus &nbsp;·&nbsp; <strong>AI grading</strong>
      </>
    ),
  },
];

function Badge({ badge }: { badge: string }) {
  const base =
    "inline-flex px-3 py-[5px] rounded-full text-[10px] font-extrabold tracking-[0.1em] uppercase mb-[18px]";

  if (badge === "JAMB / UTME") return <div className={`${base} bg-gold/15 text-gold`}>{badge}</div>;
  if (badge === "WAEC / NECO")
    return <div className={`${base} bg-green-300/15 text-green-300`}>{badge}</div>;
  if (badge === "Post-UTME")
    return <div className={`${base} bg-blue-300/15 text-blue-300`}>{badge}</div>;
  return <div className={`${base} bg-orange-400/15 text-orange-400`}>{badge}</div>;
}

/* ─── Card ───────────────────────────────────────────────── */
function ModuleCard({ badge, title, desc, meta, index }: Module & { index: number }) {
  return (
    <div
      className="group rounded-[18px] px-7 py-8 border border-white/[0.08] bg-white/[0.04]
        transition-all duration-300 cursor-pointer relative overflow-hidden
        before:content-[''] before:absolute before:bottom-0 before:left-0 before:right-0
        before:h-[3px] before:bg-green-400 before:scale-x-0 before:transition-transform before:duration-300
        hover:bg-white/[0.08] hover:border-white/[0.16] hover:-translate-y-1 hover:before:scale-x-100
        [animation:fadeUp_0.6s_ease_both]"
      style={{ animationDelay: `${index * 0.1}s` }}>
      <Badge badge={badge} />

      {/* Arrow */}
      <div className="absolute top-7 right-7 w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-sm text-white/40 transition-all duration-200 group-hover:bg-green-500 group-hover:border-green-500 group-hover:text-white">
        →
      </div>

      <div className="font-serif text-[22px] text-white mb-2.5 leading-[1.25]">{title}</div>
      <div className="text-[13px] text-white/50 leading-[1.6] mb-5">{desc}</div>
      <div className="flex items-center gap-2 text-xs text-white/40 font-medium">{meta}</div>
    </div>
  );
}

/* ─── Section ────────────────────────────────────────────── */
export default function ExamModules() {
  return (
    <section id="exams" className="px-[5%] py-[100px] bg-green-900 relative overflow-hidden">
      {/* Glow */}
      <div
        className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(46,139,87,0.15), transparent 70%)" }}
      />

      <div className="relative z-[1]">
        {/* ── Header ── */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 mb-4 before:content-[''] before:block before:w-6 before:h-0.5 before:rounded-sm before:bg-gold">
            <span className="text-[11px] font-bold text-gold tracking-[0.12em] uppercase">
              Exam Modules
            </span>
          </div>

          <h2
            className="font-serif text-white leading-[1.1] tracking-[-0.03em] mb-4"
            style={{ fontSize: "clamp(32px, 4vw, 52px)", maxWidth: "560px" }}>
            Every exam you&apos;ll ever face. One platform.
          </h2>

          <p className="text-base text-white/55 leading-[1.7] max-w-[520px]">
            From secondary school finals to professional certifications.
          </p>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MODULES.map((module, i) => (
            <ModuleCard key={module.title} {...module} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
