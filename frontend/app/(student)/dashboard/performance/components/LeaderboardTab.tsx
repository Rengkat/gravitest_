"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Medal,
  Flame,
  Target,
  Sparkles,
  Users,
  Award,
  Loader2,
  AlertTriangle,
  Crown,
  ChevronDown,
} from "lucide-react";
import * as leaderboardApi from "@/lib/api/leaderboard";
import * as studentsApi from "@/lib/api/students";
import { extractErrorMessage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";
import { useLeaderboardRealtime } from "@/lib/hooks/useLeaderboardRealtime";

const RANK_BADGE = ["🥇", "🥈", "🥉"];

type Scope = leaderboardApi.LeaderboardScope;

const LeaderboardTab = () => {
  const myCategory = useAuthStore((s) =>
    s.user?.role === "professional_student" ? "professional_student" : "student",
  ) as leaderboardApi.LeaderboardCategory;

  const [scope, setScope] = useState<Scope>("general");
  const [examType, setExamType] = useState<leaderboardApi.LeaderboardExamType | null>(null);
  const [period, setPeriod] = useState("current");

  const [myExamTargets, setMyExamTargets] = useState<leaderboardApi.LeaderboardExamType[]>([]);
  const [history, setHistory] = useState<leaderboardApi.LeaderboardPeriodSummary[]>([]);
  const [myPosition, setMyPosition] = useState<leaderboardApi.MyLeaderboardPosition | null>(null);
  const [result, setResult] = useState<leaderboardApi.LeaderboardListResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumped by useLeaderboardRealtime when the backend pushes a
  // leaderboard:update event, forcing the fetch effect below to re-run.
  const [liveTick, setLiveTick] = useState(0);
  // Set right before a live-triggered liveTick bump so the effect below
  // can skip the full-page spinner for that one refresh only — a real
  // filter/scope change still shows it.
  const liveRefreshRef = useRef(false);

  // Fetched once: the student's own exam targets (for the Exam Type scope
  // dropdown) and the list of past periods (for the Monthly/history picker).
  useEffect(() => {
    studentsApi
      .getMyOverview()
      .then((overview) => {
        const targets = overview.profile.examTargets as leaderboardApi.LeaderboardExamType[];
        setMyExamTargets(targets);
        if (targets.length > 0) setExamType((prev) => prev ?? targets[0]);
      })
      .catch(() => {
        /* exam-type scope just won't have a preselected target */
      });
    leaderboardApi
      .getHistory()
      .then(setHistory)
      .catch(() => {
        /* history picker just won't populate */
      });
  }, []);

  useEffect(() => {
    if (scope === "exam_type" && !examType) return; // wait for exam targets to load
    let cancelled = false;
    // A live-triggered refresh re-fetches quietly in the background rather
    // than showing the full-page spinner, so rankings don't visibly flicker
    // for someone actively reading the table.
    const isLiveRefresh = liveRefreshRef.current;
    liveRefreshRef.current = false;
    if (!isLiveRefresh) setLoading(true);
    setError(null);

    Promise.all([
      leaderboardApi.getLeaderboard({
        scope,
        category: scope === "category" ? myCategory : undefined,
        examType: scope === "exam_type" ? (examType ?? undefined) : undefined,
        period,
        limit: 50,
      }),
      leaderboardApi.getMyPosition(period),
    ])
      .then(([listResult, position]) => {
        if (cancelled) return;
        setResult(listResult);
        setMyPosition(position);
        if (isLiveRefresh) toast("Rankings updated", { icon: "🔄", duration: 2000 });
      })
      .catch((err) => !cancelled && setError(extractErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, examType, period, myCategory, liveTick]);

  // Only "This Month" is live — a past, finalized period never changes.
  useLeaderboardRealtime(
    [scope === "category" ? `category:${myCategory}` : null],
    () => {
      liveRefreshRef.current = true;
      setLiveTick((t) => t + 1);
    },
    period === "current",
  );

  const myRank =
    scope === "general"
      ? myPosition?.ranks.general
      : scope === "category"
        ? myPosition?.ranks.category
        : (myPosition?.ranks.examType.find((e) => e.examType === examType)?.rank ?? null);

  const total = scope === "category" ? myPosition?.totals.category : myPosition?.totals.general;

  const percentile =
    myRank && total ? Math.max(1, Math.round(100 - (myRank / total) * 100)) : null;

  const rows = result?.rows ?? [];
  const topThree = rows.filter((r) => r.rank <= 3);
  const rest = rows.filter((r) => r.rank > 3);
  const meInList = rows.some((r) => r.isCurrentUser);

  return (
    <div className="space-y-6">
      {/* Scope + period controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-white rounded-2xl shadow-lg p-1.5">
          <ScopeButton active={scope === "general"} onClick={() => setScope("general")}>
            General
          </ScopeButton>
          <ScopeButton active={scope === "category"} onClick={() => setScope("category")}>
            My Category
          </ScopeButton>
          {myExamTargets.length > 0 && (
            <ScopeButton active={scope === "exam_type"} onClick={() => setScope("exam_type")}>
              <Target size={14} className="inline mr-1 -mt-0.5" />
              Exam Type
            </ScopeButton>
          )}
        </div>

        {scope === "exam_type" && myExamTargets.length > 1 && (
          <div className="relative">
            <select
              value={examType ?? ""}
              onChange={(e) => setExamType(e.target.value as leaderboardApi.LeaderboardExamType)}
              className="appearance-none pl-4 pr-9 py-2.5 rounded-2xl bg-white shadow-lg text-sm font-semibold text-green-900 cursor-pointer focus:outline-none">
              {myExamTargets.map((et) => (
                <option key={et} value={et}>
                  {leaderboardApi.EXAM_TYPE_LABELS[et] ?? et}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>
        )}

        <div className="relative ml-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 rounded-2xl bg-white shadow-lg text-sm font-semibold text-green-900 cursor-pointer focus:outline-none">
            <option value="current">This Month</option>
            {history
              .filter((h) => h.isFinalized)
              .map((h) => (
                <option key={h.period} value={h.period}>
                  {leaderboardApi.formatPeriodLabel(h.period)}
                </option>
              ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-blue-600" />
        </div>
      )}

      {!loading && (error || !result) && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertTriangle size={28} className="mx-auto mb-3 text-red-400" />
          <p className="text-gray-600">Couldn&apos;t load the leaderboard{error ? ` (${error})` : ""}.</p>
        </div>
      )}

      {!loading && result && myPosition && !myPosition.isEligible && (
        <NotYetRankedNotice eligibility={myPosition.eligibility} />
      )}

      {!loading && result && myPosition && (
        <>
          {/* Stats bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Medal size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{myRank ? `#${myRank}` : "—"}</p>
                <p className="text-sm text-gray-500">Your Rank</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Sparkles size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {percentile !== null ? `Top ${100 - percentile}%` : "—"}
                </p>
                <p className="text-sm text-gray-500">Percentile Standing</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Users size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{result.meta.totalItems.toLocaleString()}</p>
                <p className="text-sm text-gray-500">
                  {result.isFinalized ? "Ranked (final)" : "Ranked so far"}
                </p>
              </div>
            </div>
          </div>

          {myPosition.entry && (
            <MyScoreBreakdown
              entry={myPosition.entry}
              qualifies={myPosition.qualifiesForIncentive}
              isEligible={myPosition.isEligible}
            />
          )}

          {/* Top 3 */}
          {topThree.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Award size={22} className="text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-800">Top Performers</h3>
              </div>
              <div className="flex items-end justify-center gap-4 mb-2 flex-wrap">
                {[topThree[1], topThree[0], topThree[2]].map((row, i) => {
                  if (!row) return null;
                  const rank = row.rank;
                  const size = rank === 1 ? "w-24 h-24 text-2xl" : "w-20 h-20 text-lg";
                  const ring =
                    rank === 1
                      ? "bg-yellow-50 text-yellow-700 border-yellow-400"
                      : rank === 2
                        ? "bg-gray-100 text-gray-500 border-gray-300"
                        : "bg-orange-50 text-orange-700 border-orange-300";
                  const podiumHeight = rank === 1 ? "h-24" : rank === 2 ? "h-16" : "h-10";
                  const podiumColor = rank === 1 ? "bg-yellow-400" : rank === 2 ? "bg-gray-200" : "bg-orange-300";
                  return (
                    <div key={row.studentProfileId} className="flex flex-col items-center">
                      <div className="text-3xl mb-1">{RANK_BADGE[rank - 1]}</div>
                      <div className={`${size} rounded-full flex items-center justify-center font-bold border-4 ${ring}`}>
                        {row.fullName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <p className="text-sm font-bold text-gray-800 mt-2">{row.fullName || "Student"}</p>
                      <p className="text-xs text-gray-500">{Math.round(row.score).toLocaleString()} pts</p>
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

          {/* Full leaderboard table */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Rankings</h3>
              {period === "current" && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            {rows.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">
                No eligible rankings yet for this period — keep practising!
              </p>
            ) : (
              <div className="space-y-2">
                {rest.map((row) => (
                  <LeaderboardRow key={row.studentProfileId} row={row} />
                ))}
                {myPosition.entry && !meInList && myRank && (
                  <>
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 border-t border-dashed border-gray-200" />
                      <span className="text-xs text-gray-400">· · ·</span>
                      <div className="flex-1 border-t border-dashed border-gray-200" />
                    </div>
                    <LeaderboardRow
                      row={{
                        rank: myRank,
                        studentProfileId: "me",
                        userId: "me",
                        fullName: "You",
                        avatarUrl: null,
                        category: "student",
                        examTargets: [],
                        xpEarned: myPosition.entry.xpEarned,
                        streak: myPosition.entry.streak,
                        performance: myPosition.entry.performance,
                        consistency: myPosition.entry.consistency,
                        score: myPosition.entry.score,
                        qualifiesForIncentive: myPosition.qualifiesForIncentive,
                        isCurrentUser: true,
                        isEligible: myPosition.isEligible,
                      }}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

function ScopeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        active ? "bg-green-800 text-white" : "text-gray-500 hover:bg-gray-50"
      }`}>
      {children}
    </button>
  );
}

function NotYetRankedNotice({ eligibility }: { eligibility?: leaderboardApi.EligibilityProgress }) {
  // Say exactly what is blocking them, instead of a generic "do more sessions"
  // (which is wrong advice when the real blocker is, say, the subscription).
  const missing = eligibility?.missing ?? [];
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3" role="status">
      <AlertTriangle size={20} className="text-amber-500 mt-0.5 shrink-0" />
      <div className="text-sm text-amber-800">
        <p>
          You&apos;re not on the leaderboard yet this month. Your score is tracked, but you only appear in the
          rankings once you meet all of these:
        </p>
        {missing.length > 0 ? (
          <ul className="mt-2 list-disc pl-5 space-y-1">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2">Keep practising regularly — rankings need consistent activity, not one big session.</p>
        )}
      </div>
    </div>
  );
}

function MyScoreBreakdown({
  entry,
  qualifies,
  isEligible,
}: {
  entry: NonNullable<leaderboardApi.MyLeaderboardPosition["entry"]>;
  qualifies: boolean;
  isEligible: boolean;
}) {
  return (
    <div className="bg-gradient-to-br from-green-800 to-green-900 rounded-2xl shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg">Your Score Breakdown</h3>
        {qualifies && (
          <span className="flex items-center gap-1.5 bg-gold text-green-900 text-xs font-bold px-3 py-1 rounded-full">
            <Crown size={12} /> Qualifies for Incentive
          </span>
        )}
        {!qualifies && !isEligible && (
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/70">Not yet eligible</span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat icon={Sparkles} label="XP Earned" value={entry.xpEarned.toLocaleString()} />
        <Stat icon={Flame} label="Streak" value={`${entry.streak}d`} />
        <Stat icon={Target} label="Performance" value={`${Math.round(entry.performance)}%`} />
        <Stat icon={Award} label="Consistency" value={`${Math.round(entry.consistency)}%`} />
      </div>
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-sm text-white/70">Leaderboard Score</span>
        <span className="text-2xl font-bold">{Math.round(entry.score).toLocaleString()}</span>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white/10 rounded-xl p-3">
      <Icon size={16} className="text-gold mb-1.5" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-white/60">{label}</p>
    </div>
  );
}

function LeaderboardRow({ row }: { row: leaderboardApi.LeaderboardRow }) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
        row.isCurrentUser
          ? "bg-blue-50 border-2 border-blue-300 shadow-sm"
          : "hover:bg-gray-50 border border-transparent"
      }`}>
      <div className="w-8 text-center">
        <span
          className={`text-sm font-bold ${
            row.rank === 1
              ? "text-yellow-500"
              : row.rank === 2
                ? "text-gray-400"
                : row.rank === 3
                  ? "text-orange-400"
                  : "text-gray-500"
          }`}>
          #{row.rank}
        </span>
      </div>
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
          row.isCurrentUser ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
        }`}>
        {row.fullName?.[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${row.isCurrentUser ? "text-blue-700" : "text-gray-800"}`}>
          {row.fullName || "Student"}
          {row.isCurrentUser && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">You</span>
          )}
          {row.qualifiesForIncentive && (
            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              <Crown size={10} className="inline -mt-0.5" /> Incentive
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400">
          {row.xpEarned.toLocaleString()} XP · {row.streak}d streak · {Math.round(row.consistency)}% consistent
        </p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold ${row.isCurrentUser ? "text-blue-700" : "text-gray-800"}`}>
          {Math.round(row.performance)}%
        </p>
        <p className="text-xs text-gray-400">accuracy</p>
      </div>
    </div>
  );
}

export default LeaderboardTab;
