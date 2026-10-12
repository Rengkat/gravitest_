"use client";

import { useEffect, useState } from "react";
import {
  HelpCircle,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { DIFFICULTY_CONFIG, formatNumber, pct } from "@/utils/config";
import * as adminApi from "@/lib/api/admin-dashboard";

const TYPE_COLORS = ["#3b82f6", "#8b5cf6", "#14b8a6", "#f97316", "#ec4899", "#06b6d4", "#84cc16", "#f43f5e"];

export default function BankStatsPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState<adminApi.QuestionBankStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getQuestionBankStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 mb-8">
        <Loader2 size={22} className="animate-spin text-green-700" />
      </div>
    );
  }

  if (!stats) return null;

  // "Avg Quality Score" / usage trend percentages used to be shown here —
  // those concepts don't exist on the backend (no quality score, no
  // per-period usage tracking), so they were fabricated. Dropped rather
  // than faked. Draft/Published below IS a real backend concept, just
  // stored as isActive true/false rather than a separate status field —
  // same boolean the Status filter and the row badges use.
  const kpis = [
    { icon: HelpCircle, label: "Total", value: formatNumber(stats.total), color: "#2e8b57" },
    { icon: Check, label: "Published", value: formatNumber(stats.active), color: "#10b981" },
    { icon: AlertCircle, label: "Draft", value: formatNumber(stats.inactive), color: "#f59e0b" },
    {
      icon: HelpCircle,
      label: "With Explanations",
      value: formatNumber(stats.withExplanations),
      color: "#6366f1",
    },
    { icon: HelpCircle, label: "With Images", value: formatNumber(stats.withImages), color: "#f97316" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl text-green-900">Question Bank Statistics</h2>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-1 text-[13px] text-green-700 hover:text-green-800 font-medium transition-colors">
          {collapsed ? (
            <>
              <ChevronDown size={15} /> Show stats
            </>
          ) : (
            <>
              <ChevronUp size={15} /> Hide stats
            </>
          )}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
            {kpis.map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:-translate-y-0.5 transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
                  <Icon size={18} style={{ color }} strokeWidth={1.8} />
                </div>
                <div className="text-[22px] font-bold text-green-900">{value}</div>
                <div className="text-[12px] text-gray-500 font-medium">{label}</div>
              </div>
            ))}
          </div>

          {/* Question type distribution — rendered dynamically from
              whatever types actually exist in the bank, since the
              backend has 8 real QuestionType values (not the 4 the old
              hardcoded config assumed). */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {Object.entries(stats.byType).map(([type, count], i) => {
              const percentage = pct(count, stats.total);
              const color = TYPE_COLORS[i % TYPE_COLORS.length];
              return (
                <div key={type} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-green-900">{formatNumber(count)}</span>
                    <span className="text-[11px] text-gray-500">{percentage}%</span>
                  </div>
                  <div className="text-[13px] font-semibold text-green-900 capitalize">
                    {type.replace(/_/g, " ")}
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Difficulty distribution */}
          <div className="grid grid-cols-3 gap-4">
            {(Object.entries(DIFFICULTY_CONFIG) as any[]).map(([level, cfg]) => {
              const count = stats.byDifficulty[level] ?? 0;
              const percentage = pct(count, stats.total);
              return (
                <div key={level} className={`p-4 rounded-2xl bg-white border ${cfg.border} shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cfg.bg} border ${cfg.border}`}
                      style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="text-[13px] font-bold text-green-900">{percentage}%</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900 mb-2">{formatNumber(count)}</div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
