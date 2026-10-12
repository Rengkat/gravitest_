import Link from "next/link";

const FEATURES = [
  "Pixel-perfect JAMB & WAEC interface",
  "AI explanations in English & Pidgin",
  "Works offline on 2G networks",
  "Free to start — no credit card needed",
];

const TICKER_ITEMS = [
  { text: "Adaeze scored 312 in JAMB", sub: "Medicine, UNILAG — 2 hours ago" },
  { text: "Emeka got 7 A's in WAEC", sub: "SS3, Ibadan — 5 hours ago" },
  { text: "Fatima passed ICAN Level 1", sub: "Abuja — yesterday" },
  // duplicate first item so the CSS loop is seamless
  { text: "Adaeze scored 312 in JAMB", sub: "Medicine, UNILAG — 2 hours ago" },
];

export default function LeftPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-[44%] xl:w-[42%] relative overflow-hidden flex-col"
      style={{ background: "linear-gradient(160deg, #0d2b1a 0%, #1a4a2e 50%, #1f5c38 100%)" }}>
      {/* Noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1] opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glows */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(58,171,106,0.18) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-20 right-10 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(245,200,66,0.08) 0%, transparent 70%)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-auto no-underline">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-serif text-2xl text-gold border border-white/10">
            G
          </div>
          <span className="font-serif text-2xl text-white tracking-tight">Gravitest</span>
        </Link>

        {/* Main pitch */}
        <div className="my-auto">
          <h1
            className="font-serif text-white leading-[1.08] tracking-tight mb-6 mt-2 lg:mt-10"
            style={{ fontSize: "clamp(32px, 3.5vw, 48px)" }}>
            Your exam results
            <br />
            start <em className="text-gold not-italic">here.</em>
          </h1>

          <p className="text-white/55 text-[15px] leading-relaxed mb-10 max-w-xs">
            Join thousands of Nigerian students using Gravitest to pass JAMB, WAEC, and professional
            exams on the first try.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center text-sm shrink-0 text-green-300">
                  ✓
                </div>
                <span className="text-white/70 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof ticker */}
        <div className="mt-auto mt-2 lg:mt-10">
          <div
            className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.06] border border-white/10 overflow-hidden"
            style={{ height: "76px" }}>
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center shrink-0 text-lg">
              🎯
            </div>
            <div className="overflow-hidden h-10 relative flex-1">
              <div
                className="absolute top-0 left-0 right-0"
                style={{ animation: "ticker 9s steps(1) infinite" }}>
                {TICKER_ITEMS.map((item, i) => (
                  <div key={i} className="h-10 flex flex-col justify-center">
                    <div className="text-white text-sm font-semibold">{item.text}</div>
                    <div className="text-white/40 text-xs">{item.sub}</div>
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
