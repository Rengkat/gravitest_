"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gamepad2, Crown, Search, Type } from "lucide-react";
import * as gamesApi from "@/lib/api/games";

// Cross-game progress summary for the dashboard overview. Built to take
// more games as they're integrated — each entry is just a slug + a
// stats fetcher, so adding the next game is a one-line change here.
const GAMES = [
  {
    key: "scholar",
    name: "Who Wants to Be a Scholar",
    href: "/dashboard/games/who-wants-tobe-a-scholar",
    icon: Crown,
    accent: "text-gold",
    unit: "₦",
    fetch: () => gamesApi.getMyScholarStats().then((s) => ({ best: s.highestScore, played: s.gamesPlayed })),
  },
  {
    key: "karmen",
    name: "Where in Nigeria is Madam Karmen?",
    href: "/dashboard/games/madam-karmen",
    icon: Search,
    accent: "text-amber-500",
    unit: "",
    fetch: () => gamesApi.getMyKarmenStats().then((s) => ({ best: s.highScore, played: s.gamesPlayed })),
  },
  {
    key: "word-connect",
    name: "Word Connect",
    href: "/dashboard/games/word-connect",
    icon: Type,
    accent: "text-sky-500",
    unit: "₦",
    fetch: () =>
      gamesApi.getMyWordConnectStats().then((s) => ({ best: s.highScore, played: s.gamesPlayed })),
  },
];

export default function GamesOverviewPanel() {
  const [stats, setStats] = useState<Record<string, { best: number; played: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      GAMES.map((g) =>
        g
          .fetch()
          .then((r) => [g.key, r] as const)
          .catch(() => [g.key, { best: 0, played: 0 }] as const),
      ),
    )
      .then((pairs) => {
        if (cancelled) return;
        setStats(Object.fromEntries(pairs));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPlayed = Object.values(stats).reduce((sum, s) => sum + s.played, 0);

  return (
    <div className="p-6 rounded-2xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl text-green-900 flex items-center gap-2">
          <Gamepad2 size={18} className="text-purple-600" />
          Game Progress
        </h2>
        <Link href="/dashboard/games" className="text-[12px] font-semibold text-green-600 hover:text-green-700">
          View All →
        </Link>
      </div>

      {loading ? (
        <p className="text-[13px] text-gray-400">Loading…</p>
      ) : totalPlayed === 0 ? (
        <p className="text-[13px] text-gray-500">
          You haven&apos;t played any games yet —{" "}
          <Link href="/dashboard/games" className="text-green-700 font-semibold">
            pick one and start earning XP
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-3">
          {GAMES.map((g) => {
            const s = stats[g.key];
            if (!s) return null;
            const Icon = g.icon;
            return (
              <Link
                key={g.key}
                href={g.href}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all no-underline">
                <Icon size={18} className={g.accent} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-green-900 truncate">{g.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {s.played} game{s.played === 1 ? "" : "s"} played
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-bold text-gray-800">
                    {g.unit}
                    {s.best.toLocaleString("en-NG")}
                  </p>
                  <p className="text-[11px] text-gray-400">best</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
