"use client";

import { Trophy, Zap, Flame, Target, Star } from "lucide-react";
import { PLAYER_STATS, formatXP } from "@/lib/constants/games";

export default function GamesHero() {
  const xpToNextLevel = 5000;
  const xpProgress = (PLAYER_STATS.totalXP / xpToNextLevel) * 100;

  return (
    <div className="relative bg-gray-950 text-white overflow-hidden">
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Glow blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500 rounded-full blur-[100px] opacity-8 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 py-14">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left: heading */}
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-5">
              <Zap size={14} className="text-emerald-400" />
              <span className="text-[13px] font-semibold text-emerald-300 tracking-wide uppercase">
                Educational Games
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-3 leading-tight">
              <span className="text-white">Learn.</span>{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Play.
              </span>{" "}
              <span className="text-white">Win.</span>
            </h1>
            <p className="text-[16px] text-gray-400 max-w-md leading-relaxed">
              Master every subject through games designed to make knowledge stick — and make
              learning feel like an adventure.
            </p>
          </div>

          {/* Right: player stats card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 min-w-[280px] shadow-2xl">
            {/* Level + XP */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Your Level
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white">{PLAYER_STATS.level}</span>
                  <span className="text-[13px] text-emerald-400 font-semibold">Scholar</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Trophy size={28} className="text-white" />
              </div>
            </div>

            {/* XP bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
                <span>{formatXP(PLAYER_STATS.totalXP)} XP</span>
                <span>{formatXP(xpToNextLevel)} XP</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-600 mt-1">
                {formatXP(xpToNextLevel - PLAYER_STATS.totalXP)} XP to Level{" "}
                {PLAYER_STATS.level + 1}
              </p>
            </div>

            {/* Mini stats grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  icon: Target,
                  label: "Games",
                  value: PLAYER_STATS.gamesPlayed,
                  color: "text-sky-400",
                },
                {
                  icon: Star,
                  label: "Achievements",
                  value: PLAYER_STATS.achievementsUnlocked,
                  color: "text-amber-400",
                },
                {
                  icon: Flame,
                  label: "Streak",
                  value: `${PLAYER_STATS.currentStreak}d`,
                  color: "text-orange-400",
                },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-gray-800/60 rounded-xl p-2.5 text-center">
                  <Icon size={14} className={`${color} mx-auto mb-1`} />
                  <div className="text-[14px] font-bold text-white">{value}</div>
                  <div className="text-[10px] text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
