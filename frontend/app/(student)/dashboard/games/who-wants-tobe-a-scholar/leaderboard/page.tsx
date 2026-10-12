"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Loader2, AlertTriangle, Sparkles, Calendar, Trophy } from "lucide-react";
import * as gamesApi from "@/lib/api/games";
import { extractErrorMessage } from "@/lib/api/client";

const RANK_BADGE = ["🥇", "🥈", "🥉"];

export default function ScholarLeaderboardPage() {
  const [result, setResult] = useState<gamesApi.ScholarLeaderboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    gamesApi
      .getScholarMonthlyLeaderboard({ limit: 50 })
      .then((res) => !cancelled && setResult(res))
      .catch((err) => !cancelled && setError(extractErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const resetsInDays =
    result?.periodResetsAt != null
      ? Math.max(1, Math.ceil((new Date(result.periodResetsAt).getTime() - Date.now()) / 86_400_000))
      : null;

  const topThree = result?.entries.filter((e) => e.rank <= 3) ?? [];
  const rest = result?.entries.filter((e) => e.rank > 3) ?? [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link
        href="/dashboard/games/who-wants-tobe-a-scholar"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-green-800 mb-6 no-underline">
        <ArrowLeft size={15} /> Back to Who Wants to Be a Scholar
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-[12px] font-semibold text-gold-dark mb-3">
            <Crown size={13} />
            Who Wants to Be a Scholar
          </div>
          <h1 className="font-serif text-3xl text-green-900 mb-1.5">This Month&apos;s Leaderboard</h1>
          <p className="text-[14px] text-gray-500 max-w-xl">
            Ranked by your single best game this month — one great run beats a dozen average ones.
            Play is free for everyone; subscribers are eligible to win the monthly prize.
          </p>
        </div>
        {resetsInDays !== null && (
          <span className="shrink-0 text-[12px] text-gray-400 flex items-center gap-1 mt-1">
            <Calendar size={12} /> Resets in {resetsInDays}d
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={26} className="animate-spin text-green-700" />
        </div>
      )}

      {!loading && (error || !result) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <AlertTriangle size={26} className="mx-auto mb-3 text-red-400" />
          <p className="text-[13px] text-gray-500">
            Couldn&apos;t load the leaderboard{error ? ` (${error})` : ""}.
          </p>
        </div>
      )}

      {!loading && result && (
        <>
          {result.entries.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Trophy size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="text-[14px] text-gray-500">
                No games played yet this month — be the first on the board!
              </p>
            </div>
          )}

          {topThree.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <div className="flex items-end justify-center gap-4 flex-wrap">
                {[topThree[1], topThree[0], topThree[2]].map((entry) => {
                  if (!entry) return null;
                  const rank = entry.rank;
                  const podiumHeight = rank === 1 ? "h-24" : rank === 2 ? "h-16" : "h-10";
                  const podiumColor = rank === 1 ? "bg-gold" : rank === 2 ? "bg-gray-200" : "bg-orange-300";
                  const ring =
                    rank === 1
                      ? "bg-yellow-50 text-yellow-700 border-yellow-400"
                      : rank === 2
                        ? "bg-gray-100 text-gray-500 border-gray-300"
                        : "bg-orange-50 text-orange-700 border-orange-300";
                  return (
                    <div key={entry.userId} className="flex flex-col items-center">
                      <div className="text-3xl mb-1">{RANK_BADGE[rank - 1]}</div>
                      <div
                        className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl border-4 ${ring}`}>
                        {entry.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <p className="text-[13px] font-bold text-green-900 mt-2 max-w-[110px] truncate text-center">
                        {entry.name || "Student"}
                      </p>
                      <p className="text-[12px] text-gray-500">₦{entry.bestPrize.toLocaleString("en-NG")}</p>
                      {entry.incentiveEligible && (
                        <span className="mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                          Eligible
                        </span>
                      )}
                      <div
                        className={`w-24 ${podiumHeight} ${podiumColor} rounded-t-lg mt-2 flex items-center justify-center font-bold text-white text-lg`}>
                        {rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-[14px] font-semibold text-gray-800 mb-4">Rankings</h3>
              <div className="space-y-2">
                {rest.map((entry) => (
                  <LeaderboardRow key={entry.userId} entry={entry} />
                ))}
                {result.currentUserEntry && !result.entries.some((e) => e.isCurrentUser) && (
                  <>
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 border-t border-dashed border-gray-200" />
                      <span className="text-xs text-gray-400">· · ·</span>
                      <div className="flex-1 border-t border-dashed border-gray-200" />
                    </div>
                    <LeaderboardRow entry={result.currentUserEntry} />
                  </>
                )}
              </div>
            </div>
          )}

          {result.currentUserEntry && !result.currentUserEntry.incentiveEligible && (
            <div className="mt-6 bg-gradient-to-br from-green-800 to-green-900 rounded-2xl p-6 text-center text-white">
              <Sparkles size={22} className="mx-auto mb-2 text-gold" />
              <p className="text-[14px] font-semibold mb-1">You&apos;re on the board, but not yet eligible to win</p>
              <p className="text-white/70 text-[13px] mb-4">
                Upgrade to a paid plan to be eligible for this month&apos;s prize.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-green-900 rounded-xl font-bold text-[13px] no-underline">
                View Plans
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: gamesApi.ScholarLeaderboardEntry }) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
        entry.isCurrentUser
          ? "bg-blue-50 border-2 border-blue-300 shadow-sm"
          : "hover:bg-gray-50 border border-transparent"
      }`}>
      <div className="w-8 text-center">
        <span
          className={`text-sm font-bold ${
            entry.rank === 1
              ? "text-yellow-500"
              : entry.rank === 2
                ? "text-gray-400"
                : entry.rank === 3
                  ? "text-orange-400"
                  : "text-gray-500"
          }`}>
          #{entry.rank}
        </span>
      </div>
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
          entry.isCurrentUser ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
        }`}>
        {entry.name?.[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${entry.isCurrentUser ? "text-blue-700" : "text-gray-800"}`}>
          {entry.name || "Student"}
          {entry.isCurrentUser && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">You</span>
          )}
          {entry.incentiveEligible && (
            <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 align-middle">
              Eligible
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400">
          {entry.gamesPlayed} game{entry.gamesPlayed === 1 ? "" : "s"} played
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${entry.isCurrentUser ? "text-blue-700" : "text-gray-800"}`}>
          ₦{entry.bestPrize.toLocaleString("en-NG")}
        </p>
        <p className="text-xs text-gray-400">best score</p>
      </div>
    </div>
  );
}
