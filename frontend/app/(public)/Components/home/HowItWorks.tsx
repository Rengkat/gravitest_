import type { HomeHowItWorks } from "@/lib/site-content/types";

export default function HowItWorks({ content }: { content: HomeHowItWorks }) {
  const steps = content.items ?? [];
  if (!steps.length) return null;

  return (
    <section className="px-[5%] py-[100px] bg-cream-dark relative">
      <div className="text-center mb-16">
        {content.eyebrow && (
          <div className="inline-flex items-center gap-2 mb-4 justify-center before:content-[''] before:block before:w-6 before:h-0.5 before:rounded-sm before:bg-green-500">
            <span className="text-[11px] font-bold text-green-600 tracking-[0.12em] uppercase">{content.eyebrow}</span>
          </div>
        )}
        {content.title && (
          <h2
            className="font-serif font-bold text-green-900 leading-[1.1] tracking-[-0.03em] mx-auto mb-4 text-center"
            style={{ fontSize: "clamp(32px, 4vw, 52px)", maxWidth: "600px" }}>
            {content.title}
          </h2>
        )}
        {content.subtitle && (
          <p className="text-base text-text-muted leading-[1.7] mx-auto text-center max-w-[520px]">{content.subtitle}</p>
        )}
      </div>

      <ol className="grid grid-cols-2 md:grid-cols-4 gap-0 relative list-none">
        <div
          aria-hidden="true"
          className="hidden md:block absolute top-9 h-0.5 opacity-30 left-[12.5%] right-[12.5%]"
          style={{ background: "linear-gradient(90deg, var(--color-green-400), var(--color-green-300), var(--color-green-400))" }}
        />
        {steps.map(({ title, description }, i) => (
          <li
            key={`${title}-${i}`}
            className="px-5 text-center group [animation:fadeUp_0.6s_ease_both]"
            style={{ animationDelay: `${i * 0.12}s` }}>
            <div
              aria-hidden="true"
              className="w-[72px] h-[72px] rounded-full bg-white border-2 border-cream-border flex items-center justify-center mx-auto mb-6 font-serif text-[26px] text-green-800 relative z-[1] shadow-[0_4px_16px_rgba(13,43,26,0.08)] transition-all duration-300 group-hover:bg-green-800 group-hover:text-white group-hover:border-green-800 group-hover:scale-[1.08] group-hover:shadow-[0_8px_28px_rgba(26,74,46,0.25)]">
              {i + 1}
            </div>
            <div className="font-serif text-lg text-green-900 mb-2.5">{title}</div>
            <div className="text-[13.5px] text-text-muted leading-[1.6]">{description}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
