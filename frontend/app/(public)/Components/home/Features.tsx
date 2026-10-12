import Card from "@/Components/Card";
import { Monitor, Sparkles, BarChart3, WifiOff, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────── */
type Feature = {
  Icon: LucideIcon;
  title: string;
  desc: string;
  tag: string;
  featured?: boolean;
  delay: string;
};

/* ─── Data ───────────────────────────────────────────────── */
const FEATURES: Feature[] = [
  {
    Icon: Monitor,
    title: "Exact CBT Interface Replication",
    desc: "Practice on a pixel-perfect replica of the real JAMB, WAEC 2026 Digital, and ICAN interfaces. Walk into the exam hall and feel zero surprise.",
    tag: "Same screens as test day",
    featured: true,
    delay: "",
  },
  {
    Icon: Sparkles,
    title: "Sabi-Explain AI",
    desc: "Every wrong answer triggers an instant AI breakdown using Nigerian syllabus context, local examples — even in Pidgin if you prefer.",
    tag: "Explained the way you'd ask a friend",
    delay: "reveal-delay-1",
  },
  {
    Icon: BarChart3,
    title: "Deep Performance Analytics",
    desc: "Track weak topics, time per question, and score trajectory across every mock. Know exactly where you're losing marks.",
    tag: "Down to the question",
    delay: "reveal-delay-2",
  },
  {
    Icon: WifiOff,
    title: "Works on 2G & Offline",
    desc: "Download question banks and video lessons. Practice on the bus, in your village — even with zero data after download.",
    tag: "Zero data after download",
    delay: "reveal-delay-1",
  },
  {
    Icon: Flame,
    title: "Streaks, XP & Leaderboards",
    desc: "Daily study streaks, subject XP points, and national leaderboards make preparation feel like a competition.",
    tag: "National leaderboard, real names",
    delay: "reveal-delay-3",
  },
];

/* ─── Section ────────────────────────────────────────────── */
export default function Features() {
  return (
    <section className="px-[5%] py-[100px] relative" id="features">
      {/* ── Section header — NO reveal wrapper, always visible ── */}
      <div className="mb-16">
        {/* Label */}
        <div className="inline-flex items-center gap-2 mb-4 before:content-[''] before:block before:w-6 before:h-0.5 before:rounded-sm before:bg-green-500">
          <span className="text-[11px] font-bold text-green-600 tracking-[0.12em] uppercase">
            Why Gravitest
          </span>
        </div>

        {/* Title */}
        <h2
          className="font-serif font-bold text-green-900 leading-[1.1] tracking-[-0.03em] mb-4 max-w-[620px]"
          style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>
          Built around how Nigerian students actually study.
        </h2>

        {/* Sub */}
        <p className="text-base text-text-muted leading-[1.7] max-w-[540px]">
          Five tools tuned for real exam halls, real networks, and real syllabuses — not a generic
          study app with JAMB slapped on it.
        </p>
      </div>

      {/* ── Cards grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature) => (
          <Card key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
