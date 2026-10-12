"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Crown,
  Loader2,
  Trophy,
  Users,
  AlertTriangle,
  RefreshCw,
  Settings2,
  ListChecks,
  Save,
} from "lucide-react";
import * as leaderboardApi from "@/lib/api/leaderboard";
import { extractErrorMessage } from "@/lib/api/client";
import { useLeaderboardRealtime } from "@/lib/hooks/useLeaderboardRealtime";
import { Card, MiniStatCard, Badge, FilterSelect, Pagination, Avatar } from "../users/components/Primitives";
import { Toggle, Label } from "../games/components/Primitives";

type Tab = "browse" | "settings" | "incentives";

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "student", label: "Secondary School" },
  { value: "professional_student", label: "Professional" },
];

const SCOPE_OPTIONS = [
  { value: "general", label: "General" },
  { value: "category", label: "By Category" },
  { value: "exam_type", label: "By Exam Type" },
];

const EXAM_TYPE_OPTIONS = [
  { value: "", label: "Select exam type…" },
  ...Object.entries(leaderboardApi.EXAM_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

export default function AdminLeaderboardPage() {
  const [tab, setTab] = useState<Tab>("browse");

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-green-900 mb-1.5">Leaderboard</h1>
        <p className="text-[14px] text-gray-500">
          Fairness-weighted rankings (XP + streak + performance + consistency), monthly incentives,
          and the rules behind them.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <TabButton active={tab === "browse"} onClick={() => setTab("browse")} icon={Trophy}>
          Browse
        </TabButton>
        <TabButton active={tab === "incentives"} onClick={() => setTab("incentives")} icon={Crown}>
          Incentive Eligible
        </TabButton>
        <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={Settings2}>
          Settings
        </TabButton>
      </div>

      {tab === "browse" && <BrowseTab />}
      {tab === "incentives" && <IncentivesTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
        active ? "bg-green-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}>
      <Icon size={14} />
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// Browse
// ══════════════════════════════════════════════════════════════

function BrowseTab() {
  const [scope, setScope] = useState<leaderboardApi.LeaderboardScope>("general");
  const [category, setCategory] = useState("");
  const [examType, setExamType] = useState("");
  const [period, setPeriod] = useState("current");
  const [page, setPage] = useState(1);
  const [includeIneligible, setIncludeIneligible] = useState(false);

  const [history, setHistory] = useState<leaderboardApi.LeaderboardPeriodSummary[]>([]);
  const [result, setResult] = useState<leaderboardApi.LeaderboardListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  // Bumped after a manual recalculate/finalize OR a live socket push, to
  // force the fetch effect below to re-run even though none of its filter
  // inputs actually changed.
  const [reloadKey, setReloadKey] = useState(0);
  // Set right before a live-triggered reloadKey bump so the effect below
  // can skip the full-page spinner for that one refresh only — a real
  // filter change (or the initial load) still shows it.
  const liveRefreshRef = useRef(false);

  useEffect(() => {
    leaderboardApi
      .getAdminHistory()
      .then(setHistory)
      .catch(() => {
        /* history picker just won't populate */
      });
  }, [reloadKey]);

  useEffect(() => {
    if (scope === "category" && !category) return;
    if (scope === "exam_type" && !examType) return;
    let cancelled = false;
    const isBackgroundRefresh = liveRefreshRef.current;
    liveRefreshRef.current = false;
    if (!isBackgroundRefresh) setLoading(true);
    setError(null);
    leaderboardApi
      .getAdminLeaderboard({
        scope,
        category: (category || undefined) as leaderboardApi.LeaderboardCategory | undefined,
        examType: (examType || undefined) as leaderboardApi.LeaderboardExamType | undefined,
        period,
        page,
        limit: 20,
        includeIneligible,
      })
      .then((res) => !cancelled && setResult(res))
      .catch((err) => !cancelled && setError(extractErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, category, examType, period, page, includeIneligible, reloadKey]);

  // Live updates only make sense while looking at the current, still-moving
  // period — a finalized past month never changes underneath you.
  useLeaderboardRealtime(
    [scope === "category" && category ? `category:${category}` : null],
    () => {
      liveRefreshRef.current = true;
      setReloadKey((k) => k + 1);
    },
    period === "current",
  );

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const res = await leaderboardApi.recalculate();
      toast.success(
        `Recalculated — ${res.updated} entries updated for ${leaderboardApi.formatPeriodLabel(res.period)}`,
      );
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setRecalculating(false);
    }
  }

  async function handleFinalize() {
    if (period === "current") {
      toast.error("Select a specific month to finalize — 'current' finalizes automatically at month-end.");
      return;
    }
    if (!confirm(`Finalize ${leaderboardApi.formatPeriodLabel(period)}? This freezes ranks and marks incentive winners.`))
      return;
    setFinalizing(true);
    try {
      const res = await leaderboardApi.finalize(period);
      toast.success(`Finalized ${leaderboardApi.formatPeriodLabel(res.period)} — ${res.finalized} entries`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <div>
      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <FilterSelect
            label="Scope"
            value={scope}
            onChange={(v) => {
              setScope(v as leaderboardApi.LeaderboardScope);
              setPage(1);
            }}
            options={SCOPE_OPTIONS}
          />
          {scope === "category" && (
            <FilterSelect
              label="Category"
              value={category}
              onChange={(v) => {
                setCategory(v);
                setPage(1);
              }}
              options={CATEGORY_OPTIONS.filter((o) => o.value)}
            />
          )}
          {scope === "exam_type" && (
            <FilterSelect
              label="Exam Type"
              value={examType}
              onChange={(v) => {
                setExamType(v);
                setPage(1);
              }}
              options={EXAM_TYPE_OPTIONS}
            />
          )}
          <FilterSelect
            label="Period"
            value={period}
            onChange={(v) => {
              setPeriod(v);
              setPage(1);
            }}
            options={[
              { value: "current", label: "This Month" },
              ...history.filter((h) => h.isFinalized).map((h) => ({ value: h.period, label: leaderboardApi.formatPeriodLabel(h.period) })),
            ]}
          />
          <div>
            <label className="block text-[12px] font-semibold text-green-900 mb-2">Include ineligible</label>
            <div className="flex items-center h-[38px]">
              <Toggle checked={includeIneligible} onChange={() => setIncludeIneligible((v) => !v)} />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-800 text-white text-[12px] font-semibold hover:bg-green-900 transition-colors disabled:opacity-50">
              {recalculating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Recalculate
            </button>
            <button
              onClick={handleFinalize}
              disabled={finalizing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-[12px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
              {finalizing ? <Loader2 size={13} className="animate-spin" /> : null}
              Finalize
            </button>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={26} className="animate-spin text-green-700" />
        </div>
      )}

      {!loading && (error || !result) && (
        <Card className="p-8 text-center">
          <AlertTriangle size={26} className="mx-auto mb-3 text-red-400" />
          <p className="text-[13px] text-gray-500">Couldn&apos;t load the leaderboard{error ? ` (${error})` : ""}.</p>
        </Card>
      )}

      {!loading && result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <MiniStatCard
              icon={Users}
              label={includeIneligible ? "Students listed" : result.isFinalized ? "Ranked (final)" : "Ranked so far"}
              value={result.meta.totalItems.toLocaleString()}
              color="#2e8b57"
            />
            <MiniStatCard
              icon={Trophy}
              label="Top score"
              value={result.rows[0] ? Math.round(result.rows[0].score).toLocaleString() : "—"}
              color="#f59e0b"
            />
            <MiniStatCard
              icon={Crown}
              label="Qualify for incentive"
              value={result.rows.filter((r) => r.qualifiesForIncentive).length}
              color="#8b5cf6"
            />
          </div>

          <Card className="overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
                  <Th>Rank</Th>
                  <Th>Student</Th>
                  <Th>Category</Th>
                  <Th>XP (period)</Th>
                  <Th>Streak</Th>
                  <Th>Performance</Th>
                  <Th>Consistency</Th>
                  <Th>Score</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {result.rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-[13px] text-gray-400">
                      No entries for this filter combination yet.
                    </td>
                  </tr>
                )}
                {result.rows.map((row) => (
                  <tr
                    key={row.studentProfileId}
                    className="border-b last:border-0 hover:bg-gray-50/50"
                    style={{ borderColor: "rgba(30,80,50,0.05)" }}>
                    <td className="px-4 py-3 text-[13px] font-bold text-green-900">#{row.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar user={{ firstName: row.fullName?.[0] ?? "?", lastName: "", avatarUrl: row.avatarUrl ?? undefined }} size="sm" />
                        <span className="text-[13px] font-medium text-green-900">{row.fullName || "Student"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-600">
                      {leaderboardApi.CATEGORY_LABELS[row.category]}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-gray-800">{row.xpEarned.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-600">{row.streak}d</td>
                    <td className="px-4 py-3 text-[13px] text-gray-600">{Math.round(row.performance)}%</td>
                    <td className="px-4 py-3 text-[13px] text-gray-600">{Math.round(row.consistency)}%</td>
                    <td className="px-4 py-3 text-[13px] font-bold text-green-900">{Math.round(row.score).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {!row.isEligible ? (
                        // Shown when "Include ineligible" is on: say WHY they are not ranked.
                        <div title={row.ineligibleReasons?.join("\n")}>
                          <Badge label="Not eligible" color="#dc2626" bg="#dc262615" />
                          {row.ineligibleReasons?.map((r) => (
                            <p key={r} className="mt-1 text-[11px] text-gray-500">
                              {r}
                            </p>
                          ))}
                        </div>
                      ) : row.qualifiesForIncentive ? (
                        <Badge label="Incentive" color="#8b5cf6" bg="#8b5cf615" icon={Crown} />
                      ) : (
                        <Badge label="Eligible" color="#2e8b57" bg="#2e8b5715" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Pagination currentPage={result.meta.currentPage} totalPages={result.meta.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wide">{children}</th>;
}

// ══════════════════════════════════════════════════════════════
// Incentive-eligible
// ══════════════════════════════════════════════════════════════

function IncentivesTab() {
  const [period, setPeriod] = useState("current");
  const [category, setCategory] = useState("");
  const [history, setHistory] = useState<leaderboardApi.LeaderboardPeriodSummary[]>([]);
  const [rows, setRows] = useState<leaderboardApi.LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    leaderboardApi
      .getAdminHistory()
      .then(setHistory)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    leaderboardApi
      .getIncentiveEligible(period, (category || undefined) as leaderboardApi.LeaderboardCategory | undefined)
      .then((res) => !cancelled && setRows(res))
      .catch((err) => !cancelled && setError(extractErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period, category]);

  return (
    <div>
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FilterSelect
            label="Period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: "current", label: "This Month" },
              ...history.filter((h) => h.isFinalized).map((h) => ({ value: h.period, label: leaderboardApi.formatPeriodLabel(h.period) })),
            ]}
          />
          <FilterSelect label="Category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={26} className="animate-spin text-green-700" />
        </div>
      )}

      {!loading && error && (
        <Card className="p-8 text-center">
          <AlertTriangle size={26} className="mx-auto mb-3 text-red-400" />
          <p className="text-[13px] text-gray-500">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <Card className="overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
                <Th>#</Th>
                <Th>Student</Th>
                <Th>Category</Th>
                <Th>Score</Th>
                <Th>XP</Th>
                <Th>Streak</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-gray-400">
                    <ListChecks size={22} className="mx-auto mb-2 text-gray-300" />
                    No one qualifies for the incentive yet this period.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.studentProfileId} className="border-b last:border-0" style={{ borderColor: "rgba(30,80,50,0.05)" }}>
                  <td className="px-4 py-3 text-[13px] font-bold text-green-900">#{row.rank}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-green-900">{row.fullName}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-600">{leaderboardApi.CATEGORY_LABELS[row.category]}</td>
                  <td className="px-4 py-3 text-[13px] font-bold text-green-900">{Math.round(row.score).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-600">{row.xpEarned.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-600">{row.streak}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Settings
// ══════════════════════════════════════════════════════════════

function SettingsTab() {
  const [settings, setSettings] = useState<leaderboardApi.LeaderboardSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    leaderboardApi
      .getSettings()
      .then(setSettings)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await leaderboardApi.updateSettings({
        xpWeight: settings.xpWeight,
        streakWeight: settings.streakWeight,
        performanceWeight: settings.performanceWeight,
        consistencyWeight: settings.consistencyWeight,
        minSessionsRequired: settings.minSessionsRequired,
        minQuestionsAttemptedRequired: settings.minQuestionsAttemptedRequired,
        subscribersOnly: settings.subscribersOnly,
        incentiveTopN: settings.incentiveTopN,
        notifyDaysBeforeClose: settings.notifyDaysBeforeClose,
        notifyOnResultsPublished: settings.notifyOnResultsPublished,
      });
      setSettings(updated);
      toast.success("Leaderboard settings saved");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof leaderboardApi.LeaderboardSettings>(key: K, value: leaderboardApi.LeaderboardSettings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={26} className="animate-spin text-green-700" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle size={26} className="mx-auto mb-3 text-red-400" />
        <p className="text-[13px] text-gray-500">Couldn&apos;t load settings{error ? ` (${error})` : ""}.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-[15px] font-bold text-green-900 mb-1">Score Formula</h3>
        <p className="text-[12px] text-gray-500 mb-5">
          score = xpEarned×xpWeight + streak×streakWeight + performance×performanceWeight + consistency×consistencyWeight
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumberField label="XP Weight" value={settings.xpWeight} onChange={(v) => set("xpWeight", v)} step={0.1} />
          <NumberField label="Streak Weight" value={settings.streakWeight} onChange={(v) => set("streakWeight", v)} />
          <NumberField label="Performance Weight" value={settings.performanceWeight} onChange={(v) => set("performanceWeight", v)} />
          <NumberField label="Consistency Weight" value={settings.consistencyWeight} onChange={(v) => set("consistencyWeight", v)} />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-[15px] font-bold text-green-900 mb-1">Eligibility</h3>
        <p className="text-[12px] text-gray-500 mb-5">
          Guards against one big session vaulting someone to the top of the leaderboard.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          <NumberField
            label="Min sessions / month"
            value={settings.minSessionsRequired}
            onChange={(v) => set("minSessionsRequired", v)}
          />
          <NumberField
            label="Min questions attempted"
            value={settings.minQuestionsAttemptedRequired}
            onChange={(v) => set("minQuestionsAttemptedRequired", v)}
          />
          <NumberField label="Incentive Top N / category" value={settings.incentiveTopN} onChange={(v) => set("incentiveTopN", v)} />
        </div>
        <div className="flex items-center gap-3">
          <Toggle checked={settings.subscribersOnly} onChange={() => set("subscribersOnly", !settings.subscribersOnly)} />
          <Label>Only active subscribers are leaderboard-eligible</Label>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-[15px] font-bold text-green-900 mb-1">Notifications</h3>
        <p className="text-[12px] text-gray-500 mb-5">
          "Closing soon" nudges go out at these day-before-month-end offsets (0 = final day).
        </p>
        <div className="mb-5">
          <Label>Notify days before close</Label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {[7, 5, 3, 2, 1, 0].map((day) => {
              const active = settings.notifyDaysBeforeClose.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    set(
                      "notifyDaysBeforeClose",
                      active
                        ? settings.notifyDaysBeforeClose.filter((d) => d !== day)
                        : [...settings.notifyDaysBeforeClose, day].sort((a, b) => b - a),
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                    active ? "bg-green-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}>
                  {day === 0 ? "Final day" : `${day}d before`}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Toggle
            checked={settings.notifyOnResultsPublished}
            onChange={() => set("notifyOnResultsPublished", !settings.notifyOnResultsPublished)}
          />
          <Label>Notify users when monthly results are published</Label>
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-800 text-white text-[13px] font-semibold hover:bg-green-900 transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Settings
        </button>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30"
      />
    </div>
  );
}
