import Link from "next/link";
import type { HomeExamModules } from "@/lib/site-content/types";

// Static class strings so Tailwind's scanner sees every one.
const BADGE_STYLES = [
  "bg-gold/15 text-gold",
  "bg-green-300/15 text-green-300",
  "bg-blue-300/15 text-blue-300",
  "bg-orange-400/15 text-orange-400",
];

type Module = NonNullable<HomeExamModules["items"]>[number];

function ModuleCard({ module, index }: { module: Module; index: number }) {
  const body = (
    <>
      {module.badge && (
        <div
          className={`inline-flex px-3 py-[5px] rounded-full text-[10px] font-extrabold tracking-[0.1em] uppercase mb-[18px] ${BADGE_STYLES[index % BADGE_STYLES.length]}`}>
          {module.badge}
        </div>
      )}
      <div
        aria-hidden="true"
        className="absolute top-7 right-7 w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-sm text-white/40 transition-all duration-200 group-hover:bg-green-500 group-hover:border-green-500 group-hover:text-white">
        →
      </div>
      <div className="font-serif text-[22px] text-white mb-2.5 leading-[1.25]">{module.name}</div>
      {module.description && <div className="text-[13px] text-white/50 leading-[1.6] mb-5">{module.description}</div>}
      {!!module.tags?.length && (
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-white/40 font-medium">
          {module.tags.map((t, i) => (
            <span key={`${t}-${i}`} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">·</span>}
              <strong className="font-semibold">{t}</strong>
            </span>
          ))}
        </div>
      )}
    </>
  );

  const cls = `group rounded-[18px] px-7 py-8 border border-white/[0.08] bg-white/[0.04] block
    transition-all duration-300 relative overflow-hidden no-underline
    before:content-[''] before:absolute before:bottom-0 before:left-0 before:right-0
    before:h-[3px] before:bg-green-400 before:scale-x-0 before:transition-transform before:duration-300
    hover:bg-white/[0.08] hover:border-white/[0.16] hover:-translate-y-1 hover:before:scale-x-100
    [animation:fadeUp_0.6s_ease_both]`;
  const style = { animationDelay: `${index * 0.1}s` };

  return module.href ? (
    <Link href={module.href} className={`${cls} cursor-pointer`} style={style}>{body}</Link>
  ) : (
    <div className={cls} style={style}>{body}</div>
  );
}

export default function ExamModules({ content }: { content: HomeExamModules }) {
  const items = content.items ?? [];
  if (!items.length) return null;

  return (
    <section id="exams" className="px-[5%] py-[100px] bg-green-900 relative overflow-hidden">
      <div
        className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(46,139,87,0.15), transparent 70%)" }}
      />
      <div className="relative z-[1]">
        <div className="mb-16">
          {content.eyebrow && (
            <div className="inline-flex items-center gap-2 mb-4 before:content-[''] before:block before:w-6 before:h-0.5 before:rounded-sm before:bg-gold">
              <span className="text-[11px] font-bold text-gold tracking-[0.12em] uppercase">{content.eyebrow}</span>
            </div>
          )}
          {content.title && (
            <h2
              className="font-serif text-white leading-[1.1] tracking-[-0.03em] mb-4"
              style={{ fontSize: "clamp(32px, 4vw, 52px)", maxWidth: "560px" }}>
              {content.title}
            </h2>
          )}
          {content.subtitle && <p className="text-base text-white/55 leading-[1.7] max-w-[520px]">{content.subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((m, i) => (
            <ModuleCard key={`${m.name}-${i}`} module={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
