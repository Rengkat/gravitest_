"use client";

import Link from "next/link";
import { useEffect } from "react";

const GRID_CELLS: Array<"answered" | "flagged" | "current" | "default"> = [
  "answered",
  "answered",
  "answered",
  "flagged",
  "answered",
  "answered",
  "answered",
  "answered",
  "answered",
  "answered",
  "answered",
  "current",
  "default",
  "default",
  "default",
  "default",
  "default",
  "default",
  "default",
  "default",
];

const CELL_CLS = {
  answered: "bg-green-500 border-green-500 text-white",
  flagged: "bg-gold border-gold-dark text-green-900",
  current: "bg-green-800 border-green-800 text-white",
  default: "bg-white border-cream-border text-text-muted",
};

// A quiet nod to the paper OMR sheet every JAMB/WAEC candidate has shaded by
// hand — half-filled pencil ovals, tiled faintly behind the copy instead of
// a generic tech grid.
function OmrPattern() {
  return (
    <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <pattern id="omr-oval" width="34" height="22" patternUnits="userSpaceOnUse">
          <ellipse
            cx="10"
            cy="11"
            rx="7"
            ry="5"
            fill="none"
            stroke="rgba(26,74,46,0.14)"
            strokeWidth="1.1"
          />
          <ellipse cx="10" cy="11" rx="7" ry="5" fill="rgba(26,74,46,0.05)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#omr-oval)" />
    </svg>
  );
}

export default function Hero() {
  useEffect(() => {
    let seconds = 84 * 60 + 38;
    const el = document.querySelector<HTMLElement>(".exam-timer-text");
    if (!el) return;
    const id = setInterval(() => {
      if (seconds > 0) seconds--;
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      el.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="min-h-screen pt-[120px] pb-20 px-[5%] grid grid-cols-1 md:grid-cols-2 items-center gap-[60px] relative overflow-hidden bg-cream">
      {/* Background: faint OMR-sheet texture, fading out toward the right */}
      <div
        className="absolute inset-0 z-0"
        style={{
          maskImage: "linear-gradient(to right, black 0%, black 40%, transparent 75%)",
          WebkitMaskImage: "linear-gradient(to right, black 0%, black 40%, transparent 75%)",
        }}>
        <OmrPattern />
      </div>

      {/* ── Left: content ── */}
      <div className="relative z-[1]">
        <div className="[animation:fadeUp_0.6s_0.1s_ease_both]">
          <p className="font-mono text-xs font-semibold tracking-[0.16em] text-green-700 uppercase mb-4">
            JAMB · WAEC · ICAN · Nursing &amp; more
          </p>

          <h1
            className="font-serif font-bold leading-[1.12] tracking-[-0.02em] text-green-900 mb-6"
            style={{ fontSize: "clamp(38px,4.6vw,60px)" }}>
            Practice the exam
            <br />
            you&apos;re actually sitting
            {/* <span className="relative inline-block">
              .
              <span className="absolute -bottom-1 left-0 right-[-14px] h-[3px] bg-gold/70 rounded-full" />
            </span> */}
          </h1>
        </div>

        <p className="text-base text-gray-600 leading-relaxed max-w-[480px] mb-10 font-light tracking-wide [animation:fadeUp_0.6s_0.2s_ease_both]">
          Gravitest mirrors the real JAMB and WAEC CBT screens, question format and all, so nothing
          about test day catches you off guard. Every wrong answer comes with a worked explanation,
          and it all runs fine on 2G.
        </p>

        <div className="flex items-center gap-4 mb-10 [animation:fadeUp_0.6s_0.3s_ease_both]">
          <Link
            href="/register"
            className="inline-flex items-center gap-2.5 px-9 py-4 bg-gradient-to-b from-green-700 to-green-800 rounded-lg text-white font-sans text-sm font-medium no-underline tracking-wide shadow-[0_8px_20px_rgba(26,74,46,0.28)] transition-all duration-300 hover:from-green-600 hover:to-green-700 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(26,74,46,0.35)] active:translate-y-0 active:shadow-[0_4px_12px_rgba(26,74,46,0.25)]">
            Start practising free
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </Link>
          <Link
            href="#"
            className="inline-flex bg-gradient-to-b from-green-700 to-green-800 items-center gap-2 px-5 py-4 text-white font-sans text-sm font-medium no-underline border border-green-800/20 rounded-lg transition-all duration-200 hover:border-green-800/50 hover:bg-green-800/[0.04]">
            See a sample question
          </Link>
        </div>

        <div className="flex items-center gap-2.5 text-sm text-gray-500 [animation:fadeUp_0.6s_0.4s_ease_both]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          12,400 students are practising with Gravitest this session
        </div>
      </div>

      {/* ── Right: the product itself ── */}
      <div className="relative z-[1] [animation:fadeIn_0.8s_0.3s_ease_both] hidden md:block">
        <div className="bg-white rounded-[20px] shadow-[0_20px_60px_rgba(13,43,26,0.14)] overflow-hidden border border-cream-border">
          {/* Header */}
          <div className="bg-green-800 px-5 py-[14px] flex items-center justify-between">
            <div className="flex gap-1">
              {["USE OF ENGLISH", "MATHS", "PHYSICS", "CHEM"].map((tab) => (
                <div
                  key={tab}
                  className={`px-[14px] py-[5px] rounded-md text-xs font-semibold tracking-[0.03em] cursor-pointer transition-all duration-200 ${tab === "PHYSICS" ? "bg-white/15 text-white" : "text-white/60"}`}>
                  {tab}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-[#e63946] px-[14px] py-1.5 rounded-lg">
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="white"
                strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 6v6l4 2" />
              </svg>
              <span className="exam-timer-text font-mono text-sm font-medium text-white">
                01:24:38
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-[18px]">
              <span className="font-mono text-xs font-medium text-text-light tracking-[0.08em]">
                QUESTION 12 OF 40
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gold-dark font-semibold cursor-pointer">
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 3v18h1.5v-7h11l-2.5-4 2.5-4h-12.5V3H5z" />
                </svg>
                Flag
              </span>
            </div>
            <p className="text-sm leading-[1.65] text-text-main mb-5">
              A body of mass 5 kg is acted upon by a force of 20 N for 4 seconds. If the body starts
              from rest, what is the velocity at the end of this time?
            </p>
            <div className="flex flex-col gap-2.5">
              {[
                { letter: "A", text: "4 m/s", state: "default" },
                { letter: "B", text: "8 m/s", state: "selected" },
                {
                  letter: "C",
                  text: "16 m/s",
                  state: "correct",
                  extra: <span className="text-[11px] text-green-500 font-bold ml-1">Correct</span>,
                },
                { letter: "D", text: "100 m/s", state: "default" },
              ].map(({ letter, text, state, extra }) => (
                <div
                  key={letter}
                  className={`flex items-center gap-3 px-4 py-[11px] border-[1.5px] rounded-[10px] cursor-pointer transition-all duration-200 text-[13.5px] text-text-main hover:border-green-400 hover:bg-green-50 ${state === "selected" ? "border-green-500 bg-green-500/[0.07]" : state === "correct" ? "border-[#22c55e] bg-[#22c55e]/[0.08]" : "border-cream-border"}`}>
                  <div
                    className={`w-[26px] h-[26px] rounded-full border-[1.5px] flex items-center justify-center text-xs font-bold shrink-0 ${state === "selected" || state === "correct" ? "bg-green-500 border-green-500 text-white" : "border-current text-text-muted"}`}>
                    {letter}
                  </div>
                  {text}
                  {extra}
                </div>
              ))}
            </div>

            {/* Sabi-Explain */}
            <div className="mt-4 rounded-xl px-[18px] py-4 bg-green-900">
              <div className="flex items-center gap-[7px] text-[11px] font-bold text-gold tracking-[0.1em] uppercase mb-2">
                Sabi-Explain
              </div>
              <div className="text-[12.5px] text-white/85 leading-[1.6]">
                Using Newton&apos;s 2nd Law: F = ma, so a = 20/5 ={" "}
                <strong className="text-gold">4 m/s²</strong>. Then v = u + at = 0 + (4 × 4) ={" "}
                <strong className="text-gold">16 m/s</strong>.
              </div>
            </div>
          </div>

          {/* Navigator */}
          <div className="px-6 py-4 border-t border-cream-border bg-cream-dark">
            <div className="flex justify-between text-[11px] font-semibold text-text-muted tracking-[0.06em] uppercase mb-2.5">
              <span>Question Navigator</span>
              <span className="text-green-500 font-bold">8/40 Answered</span>
            </div>
            <div className="flex flex-wrap gap-[5px]">
              {GRID_CELLS.map((state, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-semibold border cursor-pointer ${CELL_CLS[state]}`}>
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-2.5">
              {[
                { color: "bg-green-500", label: "Answered" },
                { color: "bg-gold", label: "Flagged" },
                { color: "bg-green-800", label: "Current" },
              ].map(({ color, label }) => (
                <span key={label} className="text-[11px] text-text-muted flex items-center gap-1">
                  <span className={`w-3 h-3 rounded-[3px] inline-block ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
