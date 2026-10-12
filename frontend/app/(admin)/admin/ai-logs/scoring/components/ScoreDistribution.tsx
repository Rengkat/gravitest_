"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { ScoringAnalytics } from "../../types";

interface Props {
  analytics: ScoringAnalytics;
}

function getColor(range: string): string {
  if (range.includes("81") || range.includes("90")) return "#10b981";
  if (range.includes("61") || range.includes("71") || range.includes("60")) return "#2e8b57";
  if (range.includes("41") || range.includes("51") || range.includes("40")) return "#f59e0b";
  if (range.includes("21") || range.includes("31")) return "#f97316";
  return "#ef4444";
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-green-900 text-white rounded-lg px-3 py-2 shadow-lg">
      <div className="text-[11px] font-semibold">{label}</div>
      <div className="text-[12px] text-green-300">{payload[0].value} questions</div>
    </div>
  );
}

export function ScoreDistribution({ analytics }: Props) {
  const {
    scoreDistribution,
    averageScore,
    totalQuestionsGraded,
    teacherReviewRate,
    reviewDiscrepancy,
  } = analytics;

  if (!scoreDistribution || scoreDistribution.length === 0) {
    return (
      <div
        className="bg-white rounded-2xl border p-6 text-center text-[13px] text-text-muted"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        No scoring data available yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="font-serif text-lg text-green-900">Score Distribution</h3>
          <p className="text-[12px] text-text-muted mt-0.5">
            {totalQuestionsGraded.toLocaleString()} questions graded
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <div className="text-[20px] font-bold text-green-900">{averageScore.toFixed(1)}%</div>
            <div className="text-[10px] text-text-muted">Average Score</div>
          </div>
          <div>
            <div className="text-[20px] font-bold text-blue-600">
              {teacherReviewRate.toFixed(1)}%
            </div>
            <div className="text-[10px] text-text-muted">Teacher Review Rate</div>
          </div>
          <div>
            <div
              className="text-[20px] font-bold"
              style={{ color: reviewDiscrepancy <= 5 ? "#10b981" : "#f59e0b" }}>
              ±{reviewDiscrepancy.toFixed(1)}
            </div>
            <div className="text-[10px] text-text-muted">Avg AI/Teacher Diff</div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={scoreDistribution}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {scoreDistribution.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.range)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div
        className="flex flex-wrap gap-3 mt-2 pt-4 border-t"
        style={{ borderColor: "rgba(30,80,50,0.06)" }}>
        {scoreDistribution.map((b) => (
          <div key={b.range} className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: getColor(b.range) }} />
            {b.range}: <strong className="text-green-900">{b.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
