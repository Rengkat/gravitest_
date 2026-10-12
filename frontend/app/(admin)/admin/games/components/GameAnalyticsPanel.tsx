"use client";

import { Download, X, TrendingUp } from "lucide-react";
import type { Game } from "../types";
import { CATEGORY_CONFIG } from "../constants";
import { Card } from "./Primitives";

interface Props {
  game: Game;
  onClose: () => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function GameAnalyticsPanel({ game, onClose }: Props) {
  const catCfg = CATEGORY_CONFIG[game.category];
  const maxTrend = Math.max(...game.weeklyTrend, 1);

  const diffStats = [
    { level: "Easy", success: 85, color: "#10b981" },
    { level: "Medium", success: 68, color: "#f59e0b" },
    { level: "Hard", success: 45, color: "#f97316" },
    { level: "Expert", success: 28, color: "#ef4444" },
  ];

  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div>
          <h2 className="font-serif text-lg text-green-900">Game Analytics</h2>
          <p className="text-[12px] text-text-muted">{game.name}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] text-text-muted hover:bg-gray-50 transition-colors">
            <Download size={13} /> Export
          </button>
          <button
            title="close"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPITile
            label="Total Plays"
            value={game.totalPlays.toLocaleString()}
            trend="+12%"
            color="#2e8b57"
          />
          <KPITile
            label="Avg Score"
            value={game.avgScore.toLocaleString()}
            trend="+5%"
            color="#3b82f6"
          />
          <KPITile
            label="Completion"
            value={`${game.completionRate}%`}
            trend="+3%"
            color="#8b5cf6"
          />
          <KPITile
            label="Avg Session"
            value={`${Math.floor(game.avgTime / 60)}m ${game.avgTime % 60}s`}
            trend="-8s"
            trendDown
            color="#f97316"
          />
        </div>

        {/* Weekly bar chart */}
        <Card className="p-5">
          <h3 className="font-semibold text-green-900 mb-4 text-[14px]">Weekly Play Volume</h3>
          <div className="h-40 flex items-end gap-2">
            {game.weeklyTrend.map((v, i) => {
              const pct = (v / maxTrend) * 100;
              const isToday = i === 6;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[9px] font-semibold text-green-900 opacity-0 group-hover:opacity-100 transition-opacity">
                    {v.toLocaleString()}
                  </span>
                  <div
                    className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-default"
                    style={{
                      height: `${Math.max(pct, 4)}%`,
                      background: isToday ? catCfg.color : `${catCfg.color}60`,
                    }}
                  />
                  <span
                    className={`text-[9px] ${isToday ? "font-bold text-green-900" : "text-text-muted"}`}>
                    {DAYS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Difficulty breakdown */}
        <Card className="p-5">
          <h3 className="font-semibold text-green-900 mb-4 text-[14px]">
            Success Rate by Difficulty
          </h3>
          <div className="space-y-3">
            {diffStats
              .filter((d) =>
                game.settings.difficultyLevels.some(
                  (l) => l.toLowerCase() === d.level.toLowerCase(),
                ),
              )
              .map((d) => (
                <div key={d.level}>
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="font-semibold text-gray-700">{d.level}</span>
                    <span className="text-gray-500">{d.success}% correct</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${d.success}%`, background: d.color }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* Game config summary */}
        <Card className="p-5">
          <h3 className="font-semibold text-green-900 mb-4 text-[14px]">Active Configuration</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[12px]">
            <ConfigItem
              k="Time Limit"
              v={game.settings.timeLimit === 0 ? "Unlimited" : `${game.settings.timeLimit}s`}
            />
            <ConfigItem k="Lives" v={String(game.settings.lives)} />
            <ConfigItem k="Max Questions" v={String(game.settings.maxQuestions)} />
            <ConfigItem k="Base Points" v={game.settings.scoring.basePoints.toLocaleString()} />
            <ConfigItem
              k="Streak Multiplier"
              v={
                game.settings.scoring.streakBonus
                  ? `×${game.settings.scoring.streakMultiplier}`
                  : "Off"
              }
            />
            <ConfigItem k="Hints" v={game.settings.hintsEnabled ? "Enabled" : "Disabled"} />
            <ConfigItem
              k="Leaderboard"
              v={game.settings.leaderboardEnabled ? "Enabled" : "Disabled"}
            />
            <ConfigItem
              k="Daily Challenges"
              v={game.settings.dailyChallenges ? "Enabled" : "Disabled"}
            />
            <ConfigItem k="Last Updated" v={game.lastUpdated} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function KPITile({
  label,
  value,
  trend,
  trendDown = false,
  color,
}: {
  label: string;
  value: string;
  trend: string;
  trendDown?: boolean;
  color: string;
}) {
  return (
    <div
      className="p-4 rounded-xl border"
      style={{ background: `${color}08`, borderColor: `${color}20` }}>
      <div className="text-[11px] font-medium mb-1" style={{ color }}>
        {label}
      </div>
      <div className="text-[22px] font-bold text-green-900">{value}</div>
      <div
        className={`text-[10px] font-semibold mt-1 flex items-center gap-0.5 ${trendDown ? "text-green-600" : "text-green-600"}`}>
        <TrendingUp size={10} /> {trend} vs last month
      </div>
    </div>
  );
}

function ConfigItem({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
      <span className="text-text-muted">{k}</span>
      <span className="font-semibold text-green-900">{v}</span>
    </div>
  );
}
