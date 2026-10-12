"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, Users, Clock, Trophy, Zap, Sparkles, Play, Lock, TrendingUp } from "lucide-react";
import { Game } from "@/types/games";
import { getDifficultyConfig, formatPlayers } from "@/lib/constants/games";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const [flipped, setFlipped] = useState(false);
  const diff = getDifficultyConfig(game.difficulty);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}>
      <Link href={game.path}>
        <div
          className={`relative bg-gray-900 border ${game.borderColor} rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 cursor-pointer`}
          style={{
            boxShadow: flipped
              ? `0 20px 60px -10px ${game.glowColor}30, 0 0 0 1px ${game.glowColor}20`
              : "0 4px 24px -4px rgba(0,0,0,0.4)",
          }}>
          {/* Top gradient accent */}
          <div className={`h-1 w-full bg-gradient-to-r ${game.accentColor}`} />

          {/* Background glow on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${game.glowColor}15 0%, transparent 70%)`,
            }}
          />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-1.5 z-10">
            {game.isNew && (
              <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-emerald-500 text-white tracking-wide uppercase shadow-lg shadow-emerald-500/30">
                New
              </span>
            )}
            {game.isPopular && (
              <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-lg shadow-amber-500/30">
                <Zap size={9} /> Hot
              </span>
            )}
            {game.isFeatured && (
              <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-violet-500 text-white flex items-center gap-1 shadow-lg shadow-violet-500/30">
                <Sparkles size={9} /> Featured
              </span>
            )}
          </div>

          {/* XP badge top-right */}
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-800/80 backdrop-blur-sm border border-gray-700">
              <Zap size={10} className="text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400">+{game.xpReward} XP</span>
            </div>
          </div>

          {/* Icon — properly circular with glow ring */}
          <div className="flex justify-center pt-10 pb-5">
            <div className="relative">
              {/* Outer glow ring */}
              <div
                className="absolute inset-0 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity"
                style={{ background: game.glowColor }}
              />
              {/* Icon circle — perfect aspect ratio via fixed w+h */}
              <div
                className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${game.accentColor} flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-110`}>
                <span className="text-4xl leading-none select-none" role="img">
                  {game.emoji}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pb-5">
            {/* Title */}
            <h3 className="text-[16px] font-black text-white leading-snug mb-1.5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
              {game.title}
            </h3>
            <p className="text-[13px] text-gray-400 leading-relaxed mb-4 line-clamp-2">
              {game.description}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span className="text-[12px] font-bold text-white">{game.rating}</span>
                <span className="text-[11px] text-gray-600">
                  ({(game.ratingCount / 1000).toFixed(1)}k)
                </span>
              </div>

              <span className="w-px h-3 bg-gray-700" />

              {/* Players */}
              <div className="flex items-center gap-1 text-gray-500">
                <Users size={12} />
                <span className="text-[12px]">{formatPlayers(game.players)}</span>
              </div>

              <span className="w-px h-3 bg-gray-700" />

              {/* Duration */}
              <div className="flex items-center gap-1 text-gray-500">
                <Clock size={12} />
                <span className="text-[12px]">{game.duration}</span>
              </div>
            </div>

            {/* Difficulty + Completion row */}
            <div className="flex items-center justify-between mb-4">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${diff.bg} ${diff.color} flex items-center gap-1.5`}>
                <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                {game.difficulty}
              </span>
              <div className="flex items-center gap-1 text-gray-500">
                <TrendingUp size={11} />
                <span className="text-[11px]">{game.completionRate}% complete</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {game.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                  {tag}
                </span>
              ))}
              {game.achievements && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center gap-1">
                  <Trophy size={9} /> {game.achievements}
                </span>
              )}
            </div>

            {/* CTA button */}
            <button
              className={`w-full py-2.5 rounded-xl font-bold text-[14px] text-white bg-gradient-to-r ${game.accentColor} hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg`}
              style={{ boxShadow: `0 4px 20px -4px ${game.glowColor}60` }}>
              <Play size={15} className="fill-white" />
              Play Now
            </button>
          </div>
        </div>
      </Link>

      {/* Hover flip — detail overlay */}
      {flipped && (
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden z-20 pointer-events-none"
          style={{ boxShadow: `0 24px 80px -12px ${game.glowColor}50` }}>
          {/* We don't intercept clicks — let the Link underneath handle it */}
          <div className="absolute inset-0 bg-gray-950/96 backdrop-blur-sm p-5 flex flex-col justify-between animate-in fade-in duration-200">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${game.accentColor} flex items-center justify-center shadow-lg shrink-0`}>
                  <span className="text-2xl leading-none">{game.emoji}</span>
                </div>
                <div>
                  <h4 className="text-[14px] font-black text-white leading-snug">{game.title}</h4>
                  <span className="text-[11px] text-gray-400">
                    {game.category} · {game.difficulty}
                  </span>
                </div>
              </div>

              <p className="text-[13px] text-gray-300 leading-relaxed line-clamp-4">
                {game.longDescription}
              </p>
            </div>

            {/* Detail stats */}
            <div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Players", value: formatPlayers(game.players), icon: "👥" },
                  { label: "Achievements", value: String(game.achievements), icon: "🏆" },
                  { label: "XP Reward", value: `+${game.xpReward}`, icon: "⚡" },
                ].map(({ label, value, icon }) => (
                  <div
                    key={label}
                    className="bg-gray-800/60 rounded-xl p-2.5 text-center border border-gray-700/50">
                    <div className="text-lg mb-0.5">{icon}</div>
                    <div className="text-[13px] font-bold text-white">{value}</div>
                    <div className="text-[10px] text-gray-500">{label}</div>
                  </div>
                ))}
              </div>

              <div
                className={`w-full py-2.5 rounded-xl font-bold text-[14px] text-white bg-gradient-to-r ${game.accentColor} flex items-center justify-center gap-2`}>
                <Play size={15} className="fill-white" />
                Start Playing
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
