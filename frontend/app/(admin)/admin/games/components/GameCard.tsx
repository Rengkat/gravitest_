"use client";

import {
  Settings,
  Brain,
  BarChart3,
  Play,
  Gamepad2,
  Trophy,
  Puzzle,
  MapPin,
  Calculator,
  Flag,
} from "lucide-react";
import type { Game, ViewMode } from "../types";
import { CATEGORY_CONFIG, STATUS_CONFIG, GAME_CONFIGS } from "../constants";

const ICON_MAP: Record<string, any> = {
  scholar: Trophy,
  "word-connect": Puzzle,
  "madam-karmen": MapPin,
  "algebra-heist": Calculator,
  "nigerian-trail": Flag,
  "zombie-logic": Brain,
};

interface Props {
  game: Game;
  onOpen: (game: Game, mode: ViewMode) => void;
}

export function GameCard({ game, onOpen }: Props) {
  const Icon = ICON_MAP[game.slug] ?? Gamepad2;
  const catCfg = CATEGORY_CONFIG[game.category];
  const statCfg = STATUS_CONFIG[game.status];
  const cfg = GAME_CONFIGS[game.slug];

  const maxWeekly = Math.max(...game.weeklyTrend, 1);

  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all group"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      {/* Coloured top stripe */}
      <div className="h-1.5" style={{ background: catCfg.color }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: catCfg.bg }}>
              <Icon size={22} style={{ color: catCfg.color }} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-green-900 leading-tight">{game.name}</h3>
              <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1">{game.description}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end shrink-0">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: catCfg.bg, color: catCfg.color }}>
              {catCfg.label}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: statCfg.bg, color: statCfg.color }}>
              {statCfg.label}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-4 gap-3 py-4 border-t border-b"
          style={{ borderColor: "rgba(30,80,50,0.06)" }}>
          <StatCol label="Plays" value={game.totalPlays.toLocaleString()} />
          <StatCol label="Avg Score" value={game.avgScore.toLocaleString()} />
          <StatCol label={cfg.questionLabel} value={game.questionsCount} />
          <StatCol label="Completion" value={`${game.completionRate}%`} />
        </div>

        {/* Mini bar chart — weekly trend */}
        <div className="flex items-end gap-1 h-8 mt-4 mb-4">
          {game.weeklyTrend.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              style={{
                height: `${(v / maxWeekly) * 100}%`,
                background: `${catCfg.color}${i === 6 ? "ff" : "60"}`,
                minHeight: "3px",
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onOpen(game, "questions")}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-[12px] font-semibold text-text-muted hover:border-green-400 hover:text-green-800 transition-all">
            <Brain size={13} /> {cfg.questionLabel}
          </button>
          <button
            onClick={() => onOpen(game, "settings")}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-[12px] font-semibold text-text-muted hover:border-green-400 hover:text-green-800 transition-all">
            <Settings size={13} /> Settings
          </button>
          <button
            onClick={() => onOpen(game, "analytics")}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-green-800 text-white text-[12px] font-semibold hover:bg-green-700 transition-all">
            <BarChart3 size={13} /> Stats
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCol({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-[16px] font-bold text-green-900">{value}</div>
      <div className="text-[9px] text-text-muted uppercase tracking-wide">{label}</div>
    </div>
  );
}
