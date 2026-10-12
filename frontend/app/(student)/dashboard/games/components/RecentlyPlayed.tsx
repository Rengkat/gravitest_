"use client";

import Link from "next/link";
import { Clock, Play, ChevronRight } from "lucide-react";
import { GAMES } from "@/lib/constants/games";

export default function RecentlyPlayed() {
  const recent = GAMES.filter((g) => g.lastPlayed).sort(
    (a, b) => new Date(b.lastPlayed!).getTime() - new Date(a.lastPlayed!).getTime(),
  );

  if (recent.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-500" />
          <h3 className="text-[15px] font-bold text-white">Recently Played</h3>
        </div>
        <button className="flex items-center gap-1 text-[13px] text-emerald-400 hover:text-emerald-300 font-semibold">
          See all <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {recent.map((game) => (
          <Link key={game.id} href={game.path} className="shrink-0">
            <div
              className="w-56 bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-all group cursor-pointer hover:-translate-y-1"
              style={{ boxShadow: "none" }}>
              {/* Icon row */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${game.accentColor} flex items-center justify-center shadow-md shrink-0`}>
                  <span className="text-xl leading-none">{game.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-white truncate leading-snug">
                    {game.title}
                  </p>
                  <p className="text-[11px] text-gray-500">{game.category}</p>
                </div>
              </div>

              {/* Last played */}
              <p className="text-[11px] text-gray-600 mb-3">
                Last played{" "}
                {new Date(game.lastPlayed!).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </p>

              <button
                className={`w-full py-2 rounded-xl text-[12px] font-bold text-white bg-gradient-to-r ${game.accentColor} flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity`}>
                <Play size={12} className="fill-white" /> Continue
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
