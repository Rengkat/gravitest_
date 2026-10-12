"use client";

import Link from "next/link";
import { Trophy, Users, Star, Play, Sparkles, Clock } from "lucide-react";
import { GAMES } from "@/lib/constants/games";

export default function FeaturedGameBanner() {
  const featured = GAMES.find((g) => g.isFeatured) ?? GAMES[1];

  return (
    <div
      className="relative mt-12 rounded-3xl overflow-hidden border border-emerald-500/20"
      style={{
        background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
        boxShadow: "0 0 80px -20px rgba(16,185,129,0.3)",
      }}>
      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      {/* Top-left glow */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-400 rounded-full blur-3xl opacity-20 pointer-events-none" />

      <div className="relative px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left */}
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-4">
            <Sparkles size={13} className="text-amber-300" />
            <span className="text-[12px] font-bold text-white tracking-wide">
              Challenge of the Week
            </span>
          </div>

          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-4xl shadow-xl">
              {featured.emoji}
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                {featured.title}
              </h2>
              <p className="text-emerald-200 text-[13px] font-medium">{featured.category}</p>
            </div>
          </div>

          <p className="text-emerald-100 text-[14px] leading-relaxed mb-6 max-w-lg">
            {featured.description}
          </p>

          <Link href={featured.path}>
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-900 font-black rounded-xl hover:bg-emerald-50 transition-all shadow-xl text-[14px] hover:-translate-y-0.5 active:translate-y-0">
              <Play size={16} className="fill-emerald-900" />
              Play Featured Game
            </button>
          </Link>
        </div>

        {/* Right: stats */}
        <div className="flex gap-6 shrink-0 flex-wrap justify-center">
          {[
            {
              icon: Users,
              value: `${(featured.players / 1000).toFixed(1)}k+`,
              label: "Players",
              glow: "text-sky-300",
            },
            { icon: Star, value: `${featured.rating}★`, label: "Rating", glow: "text-amber-300" },
            {
              icon: Trophy,
              value: String(featured.achievements),
              label: "Achievements",
              glow: "text-yellow-300",
            },
            { icon: Clock, value: featured.duration, label: "Duration", glow: "text-emerald-300" },
          ].map(({ icon: Icon, value, label, glow }) => (
            <div key={label} className="text-center">
              <div
                className={`w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-2`}>
                <Icon size={16} className={glow} />
              </div>
              <div className="text-xl font-black text-white">{value}</div>
              <div className="text-[11px] text-emerald-300 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
