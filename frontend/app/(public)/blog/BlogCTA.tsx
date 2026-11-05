import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { BlogPage } from "@/lib/site-content/types";

export default function BlogCTA({ content }: { content: BlogPage }) {
  if (!content.ctaTitle) return null;
  return (
    <section className="px-[5%] py-[100px] bg-green-800 text-center relative overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(245,200,66,0.08), transparent 60%)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative z-[1] [animation:fadeUp_0.6s_ease_both]">
        {content.ctaEyebrow && (
          <div className="inline-flex items-center gap-2 mb-5 before:content-[''] before:block before:w-6 before:h-0.5 before:rounded-sm before:bg-gold">
            <span className="text-[11px] font-bold text-gold tracking-[0.12em] uppercase">{content.ctaEyebrow}</span>
          </div>
        )}
        <h2 className="font-serif text-white leading-[1.1] tracking-[-1.5px] mb-5" style={{ fontSize: "clamp(32px, 4.5vw, 58px)" }}>
          {content.ctaTitle}
          {content.ctaTitleHighlight && (
            <>
              <br />
              <em className="not-italic text-gold">{content.ctaTitleHighlight}</em>
            </>
          )}
        </h2>
        {content.ctaSubtitle && <p className="text-[17px] text-white/60 max-w-[480px] mx-auto mb-9 leading-[1.65]">{content.ctaSubtitle}</p>}
        <div className="flex justify-center gap-3.5 flex-wrap">
          {content.ctaButtonLabel && content.ctaButtonHref && (
            <Link
              href={content.ctaButtonHref}
              className="inline-flex items-center gap-2 px-9 py-4 bg-gold rounded-xl text-green-900 font-sans text-[15px] font-extrabold no-underline transition-all duration-[250ms] hover:bg-gold-dark hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(245,200,66,0.4)]">
              {content.ctaButtonLabel}
              <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          )}
          {content.ctaSecondaryLabel && content.ctaSecondaryHref && (
            <Link
              href={content.ctaSecondaryHref}
              className="px-8 py-4 bg-transparent border-2 border-white/30 rounded-xl text-white/85 font-sans text-[15px] font-semibold no-underline transition-all duration-[250ms] hover:border-white/60 hover:bg-white/[0.06]">
              {content.ctaSecondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
