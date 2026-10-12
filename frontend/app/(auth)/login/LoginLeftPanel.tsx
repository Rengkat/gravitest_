import { Flame } from "lucide-react";
import Link from "next/link";

const TICKER = [
  { text: "Chukwuemeka just scored 308 in JAMB", sub: "Engineering, ABU — 20 min ago" },
  { text: "Amaka passed her ICAN Foundation", sub: "Accountancy, Lagos — 1 hr ago" },
  { text: "Bashir got 6 A's in WAEC 2025", sub: "SS3 Graduate, Kano — 3 hrs ago" },
  { text: "Chukwuemeka just scored 308 in JAMB", sub: "Engineering, ABU — 20 min ago" },
];

const EXAM_OPTIONS = [
  { letter: "A", text: "Ohm's Law", active: false },
  { letter: "B", text: "Faraday's Law", active: false },
  { letter: "D", text: "Fleming's Left-Hand Rule ✓", active: true },
];

export default function LoginLeftPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-[44%] xl:w-[42%] relative overflow-hidden flex-col"
      style={{ background: "linear-gradient(160deg,#0d2b1a 0%,#1a4a2e 55%,#1f5c38 100%)" }}>
      {/* Noise */}
      <div
        className="absolute inset-0 pointer-events-none z-[1] opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glows */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(58,171,106,0.18) 0%,transparent 70%)" }}
      />
      <div
        className="absolute bottom-32 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(245,200,66,0.07) 0%,transparent 70%)" }}
      />

      <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 no-underline "
          style={{ marginBottom: "3rem" }}>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-serif text-2xl text-gold border border-white/10">
            G
          </div>
          <span className="font-serif text-2xl text-white tracking-tight">Gravitest</span>
        </Link>

        {/* Central content */}
        <div className="my-auto">
          {/* <p className="text-green-300/80 text-xs font-bold tracking-widest uppercase mb-5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 [animation:pulse-dot_2s_infinite] inline-block" />
            Welcome back
          </p> */}

          <h1
            className="font-serif text-white leading-[1.08] tracking-tight mb-6"
            style={{ fontSize: "clamp(32px,3.8vw,46px)" }}>
            Ready to pick up
            <br />
            where you
            <br />
            <em className="text-gold not-italic">left off?</em>
          </h1>

          <p className="text-white/50 text-[14px] leading-relaxed mb-10 max-w-[280px]">
            Your progress, streaks, and weak topics are all waiting for you.
          </p>

          {/* Mini exam card */}
          <div className="bg-white/[0.06] border border-white/10 rounded-2xl overflow-hidden mb-6 backdrop-blur-sm [animation:float_6s_ease-in-out_infinite]">
            <div className="bg-green-800/60 px-4 py-2.5 flex items-center justify-between border-b border-white/[0.08]">
              <div className="flex gap-1">
                {["ENG", "MATHS", "PHYSICS", "CHEM"].map((t) => (
                  <span
                    key={t}
                    className={`px-2.5 py-1 rounded-[5px] text-[10px] font-bold tracking-[0.03em] ${t === "PHYSICS" ? "bg-white/15 text-white" : "text-white/55"}`}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5 bg-red-500/80 px-2 py-1 rounded-md">
                <svg
                  width="10"
                  height="10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="white"
                  strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" strokeLinecap="round" />
                </svg>
                <span className="font-mono text-[11px] text-white font-medium">00:47:12</span>
              </div>
            </div>
            <div className="p-4">
              <p className="text-white/60 text-[11px] font-mono mb-2 tracking-widest uppercase">
                Question 23 of 40
              </p>
              <p className="text-white/85 text-[13px] leading-relaxed mb-3">
                Which law states that the force on a conductor is proportional to the current and
                length in a magnetic field?
              </p>
              <div className="space-y-1.5">
                {EXAM_OPTIONS.map(({ letter, text, active }) => (
                  <div
                    key={letter}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${active ? "border-green-400/40 bg-green-500/10" : "border-white/[0.08] bg-white/[0.03]"}`}>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${active ? "bg-green-500 border-green-400 text-white" : "border-white/25 text-white/50"}`}>
                      {letter}
                    </div>
                    <span
                      className={`text-[12px] ${active ? "text-green-300 font-semibold" : "text-white/50"}`}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-3 text-center">
              <div className="font-serif text-xl text-white mb-0.5">247</div>
              <div className="text-[10px] text-white/35 uppercase tracking-wide font-semibold">
                Questions
              </div>
            </div>
            <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-3 text-center">
              <div className="font-serif text-xl text-gold mb-0.5 flex items-center justify-center gap-1">
                <Flame size={16} strokeWidth={1.5} /> 14
              </div>
              <div className="text-[10px] text-white/35 uppercase tracking-wide font-semibold">
                Day Streak
              </div>
            </div>
            <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-3 text-center">
              <div className="font-serif text-xl text-green-300 mb-0.5">78%</div>
              <div className="text-[10px] text-white/35 uppercase tracking-wide font-semibold">
                Avg Score
              </div>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className="mt-auto pt-6">
          <div
            className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.06] border border-white/10 overflow-hidden"
            style={{ height: "72px" }}>
            <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
              🎯
            </div>
            <div className="overflow-hidden h-10 flex-1 relative">
              <div
                className="absolute top-0 left-0 right-0"
                style={{ animation: "ticker 9s steps(1) infinite" }}>
                {TICKER.map((item, i) => (
                  <div key={i} className="h-10 flex flex-col justify-center">
                    <p className="text-white text-[13px] font-semibold leading-tight">
                      {item.text}
                    </p>
                    <p className="text-white/35 text-[11px]">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
