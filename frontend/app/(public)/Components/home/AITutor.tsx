import { Send, BookOpen, Sparkles } from "lucide-react";
import { ICON_REGISTRY } from "@/lib/site-content/icons";
import type { HomeAiTutor } from "@/lib/site-content/types";

/* ─── Section ────────────────────────────────────────────── */
export default function AITutor({ content }: { content: HomeAiTutor }) {
  const features = content.items ?? [];
  return (
    <section className="px-[5%] py-[100px] bg-cream relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        {/* ── Left: copy + feature list ── */}
        <div className="[animation:fadeUp_0.6s_ease_both]">
          {content.eyebrow && (
            <div className="inline-flex items-center gap-2 mb-4 before:content-[''] before:block before:w-6 before:h-0.5 before:rounded-sm before:bg-green-500">
              <span className="text-[11px] font-bold text-green-600 tracking-[0.12em] uppercase">{content.eyebrow}</span>
            </div>
          )}
          {content.title && (
            <h2
              className="font-serif font-bold text-green-900 leading-[1.1] tracking-[-0.03em] mb-4"
              style={{ fontSize: "clamp(32px, 4vw, 52px)", maxWidth: "600px" }}>
              {content.title}
            </h2>
          )}
          {content.subtitle && <p className="text-base text-text-muted leading-[1.7] max-w-[480px] mb-8">{content.subtitle}</p>}

          <div className="flex flex-col gap-3.5">
            {features.map(({ icon, title, description }, i) => {
              const Icon = ICON_REGISTRY[icon] ?? Sparkles;
              return (
                <div
                  key={`${title}-${i}`}
                  className="flex items-start gap-3.5 p-4 bg-white rounded-[14px] border border-cream-border [animation:fadeUp_0.6s_ease_both]"
                  style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-green-900 mb-1">{title}</div>
                    <div className="text-[13px] text-text-muted leading-[1.6]">{description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: chat demo ── */}
        <div className="bg-white rounded-[24px] shadow-[var(--shadow-heavy)] border border-cream-border overflow-hidden [animation:fadeUp_0.6s_0.2s_ease_both]">
          {/* Chat header */}
          <div className="bg-green-800 px-[22px] py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-base font-bold text-green-900">
              ✦
            </div>
            <div>
              <div className="text-sm font-bold text-white">Gravitest-Tutor</div>
              <div className="text-[11px] text-white/55">AI Subject Expert · Chemistry</div>
            </div>
            <div className="w-2 h-2 bg-green-300 rounded-full ml-auto [animation:pulse-dot_2s_infinite]" />
          </div>

          {/* Messages */}
          <div className="p-6 flex flex-col gap-4">
            {/* User */}
            <div className="flex flex-row-reverse gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-green-200 text-green-800 flex items-center justify-center text-[11px] font-bold shrink-0">
                AD
              </div>
              <div className="max-w-[78%] px-4 py-3 rounded-[14px] rounded-br-[4px] bg-green-800 text-white text-[13px] leading-[1.55]">
                Abeg explain moles to me like I&apos;m in the market buying tomatoes 😂
              </div>
            </div>

            {/* AI */}
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-gold text-green-900 flex items-center justify-center text-xs font-bold shrink-0">
                ✦
              </div>
              <div className="max-w-[78%] px-4 py-3 rounded-[14px] rounded-bl-[4px] bg-cream-dark text-text-main text-[13px] leading-[1.55]">
                Okay! Imagine tomatoes are atoms. One <em>mole</em> = 6.02 × 10²³ tomatoes
                (Avogadro&apos;s number). Just like a &quot;basket&quot; is a unit for tomatoes, a
                &quot;mole&quot; is just a unit for counting tiny atoms. The molar mass tells you
                how much 1 mole weighs in grams.
                <div className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full text-xs font-bold text-green-700 mt-2">
                  <BookOpen size={11} strokeWidth={2} />
                  Chemistry · Moles &amp; Avogadro
                </div>
              </div>
            </div>

            {/* User */}
            <div className="flex flex-row-reverse gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-green-200 text-green-800 flex items-center justify-center text-[11px] font-bold shrink-0">
                AD
              </div>
              <div className="max-w-[78%] px-4 py-3 rounded-[14px] rounded-br-[4px] bg-green-800 text-white text-[13px] leading-[1.55]">
                So if I have 18g of water, how many moles is that?
              </div>
            </div>

            {/* AI */}
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-full bg-gold text-green-900 flex items-center justify-center text-xs font-bold shrink-0">
                ✦
              </div>
              <div className="max-w-[78%] px-4 py-3 rounded-[14px] rounded-bl-[4px] bg-cream-dark text-text-main text-[13px] leading-[1.55]">
                Perfect! H₂O molar mass = 18 g/mol. So 18g ÷ 18 g/mol =&nbsp;
                <strong>1 mole</strong> exactly. That&apos;s 6.02 × 10²³ water molecules in one
                small cup of water! 🎯
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="px-[22px] py-4 border-t border-cream-border bg-cream-dark flex items-center gap-2.5">
            <input
              type="text"
              defaultValue="Give me a practice question on this"
              placeholder="Ask Sabi-Tutor anything…"
              className="flex-1 h-[42px] px-4 border border-cream-border rounded-[10px] bg-white font-sans text-[13px] text-text-main outline-none transition-colors duration-200 focus:border-green-400"
            />
            <button
              title="send"
              className="w-[42px] h-[42px] bg-green-800 border-none rounded-[10px] text-white cursor-pointer flex items-center justify-center shrink-0 transition-all duration-200 hover:bg-green-600 hover:scale-[1.05]">
              <Send size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
