"use client";

import { Trophy, TrendingUp, ChevronRight } from "lucide-react";
import { LEADERBOARD } from "@/lib/constants/games";

export default function Leaderboard() {
  const topThree = LEADERBOARD.filter((e) => e.rank <= 3);
  const rest = LEADERBOARD.filter((e) => e.rank > 3 && !e.isCurrentUser);
  const me = LEADERBOARD.find((e) => e.isCurrentUser);

  const podiumOrder = [topThree[1], topThree[0], topThree[2]]; // 2nd, 1st, 3rd

  const PODIUM_CONFIG = [
    { height: "h-16", bg: "from-gray-500 to-gray-400", label: "2nd", textSize: "text-lg" },
    { height: "h-24", bg: "from-amber-400 to-yellow-300", label: "1st", textSize: "text-2xl" },
    { height: "h-12", bg: "from-orange-500 to-amber-400", label: "3rd", textSize: "text-base" },
  ];

  return (
    <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <Trophy size={15} className="text-amber-400" />
          </div>
          <h3 className="text-[15px] font-bold text-white">Top Players This Week</h3>
        </div>
        <button className="flex items-center gap-1 text-[13px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
          View All <ChevronRight size={14} />
        </button>
      </div>

      <div className="p-6">
        {/* Podium */}
        <div className="flex items-end justify-center gap-4 mb-8">
          {podiumOrder.map((player, i) => {
            if (!player) return null;
            const cfg = PODIUM_CONFIG[i];
            return (
              <div key={player.rank} className="flex flex-col items-center">
                <div className="text-2xl mb-1">{player.badge}</div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 border-2 border-gray-600 flex items-center justify-center text-[13px] font-black text-white mb-2 shadow-lg">
                  {player.avatar}
                </div>
                <p className="text-[11px] font-semibold text-gray-300 mb-1 text-center max-w-[70px] truncate">
                  {player.username}
                </p>
                <p className="text-[10px] text-emerald-400 font-bold mb-2">
                  {player.score.toLocaleString()} pts
                </p>
                <div
                  className={`w-16 ${cfg.height} rounded-t-xl bg-gradient-to-b ${cfg.bg} flex items-center justify-center text-white font-black opacity-80`}>
                  <span className={cfg.textSize}>{player.rank}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest of list */}
        <div className="space-y-2">
          {rest.map((entry) => (
            <LeaderboardRow key={entry.rank} entry={entry} />
          ))}

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 border-t border-dashed border-gray-800" />
            <span className="text-[11px] text-gray-600">· · ·</span>
            <div className="flex-1 border-t border-dashed border-gray-800" />
          </div>

          {/* Current user */}
          {me && <LeaderboardRow entry={me} />}
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: (typeof LEADERBOARD)[0] }) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
        entry.isCurrentUser
          ? "bg-emerald-500/10 border border-emerald-500/25"
          : "hover:bg-gray-800/60 border border-transparent"
      }`}>
      {/* Rank */}
      <div className="w-8 text-center">
        <span className="text-[13px] font-bold text-gray-500">#{entry.rank}</span>
      </div>

      {/* Badge */}
      <span className="text-lg">{entry.badge}</span>

      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-black ${
          entry.isCurrentUser ? "bg-emerald-500 text-white" : "bg-gray-700 text-gray-300"
        }`}>
        {entry.avatar}
      </div>

      {/* Name + game */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-[13px] font-bold truncate ${entry.isCurrentUser ? "text-emerald-300" : "text-white"}`}>
          {entry.username}
          {entry.isCurrentUser && (
            <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
              You
            </span>
          )}
        </p>
        <p className="text-[11px] text-gray-500 truncate">{entry.game}</p>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <p
          className={`text-[14px] font-black ${entry.isCurrentUser ? "text-emerald-400" : "text-white"}`}>
          {entry.score.toLocaleString()}
        </p>
        <p className="text-[10px] text-gray-600">pts</p>
      </div>
    </div>
  );
}
