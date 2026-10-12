import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="px-[5%] py-[120px] bg-green-800 text-center relative overflow-hidden">
      {/* Radial gold glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none rounded-full"
        style={{ background: "radial-gradient(circle, rgba(245,200,66,0.06), transparent 60%)" }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-[1] [animation:fadeUp_0.6s_ease_both]">
        <h2
          className="font-serif text-white leading-[1.1] tracking-[-1.5px] mb-5"
          style={{ fontSize: "clamp(36px, 5vw, 64px)" }}>
          Your exam date
          <br />
          is coming.
          <br />
          <em className="not-italic text-gold">Are you ready?</em>
        </h2>

        <p className="text-[17px] text-white/60 max-w-[500px] mx-auto mb-10 leading-[1.65]">
          Join 12,000+ Nigerian students already practising on Gravitest. Start free — no credit
          card, no data wasted.
        </p>

        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="inline-flex items-center gap-2.5 px-9 py-4 bg-gold rounded-xl text-green-900 font-sans text-[15px] font-extrabold no-underline cursor-pointer transition-all duration-[250ms] hover:bg-gold-dark hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(245,200,66,0.4)]">
            Start Free Today
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>

          <Link
            href="/help-centre"
            className="px-8 py-4 bg-transparent border-2 border-white/30 rounded-xl text-white/85 font-sans text-[15px] font-semibold no-underline cursor-pointer transition-all duration-[250ms] hover:border-white/60 hover:bg-white/[0.06]">
            Talk to Our Team
          </Link>
        </div>
      </div>
    </section>
  );
}
