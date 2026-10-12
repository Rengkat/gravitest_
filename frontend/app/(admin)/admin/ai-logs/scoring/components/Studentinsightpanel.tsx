"use client";

import { TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
import { buildStudentInsight, levelColor, type SubjectPoint } from "./Insights";

interface Props {
  studentId: string;
  studentName: string;
  subjectPoints: SubjectPoint[];
}

export function StudentInsightPanel({ studentId, studentName, subjectPoints }: Props) {
  const insight = buildStudentInsight(studentId, studentName, subjectPoints);

  if (insight.subjects.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <h3 className="font-serif text-base text-green-900 mb-4">Strengths & Weaknesses</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {insight.topStrength && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
              <TrendingUp size={15} className="text-green-700" />
            </div>
            <div>
              <div className="text-[10px] text-green-700 font-semibold uppercase tracking-wide">
                Top Strength
              </div>
              <div className="text-[14px] font-bold text-green-900">
                {insight.topStrength.subject}
              </div>
              <div className="text-[11px] text-text-muted">
                {insight.topStrength.avgScore.toFixed(0)}% avg
              </div>
            </div>
          </div>
        )}
        {insight.topWeakness && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
              <TrendingDown size={15} className="text-red-600" />
            </div>
            <div>
              <div className="text-[10px] text-red-600 font-semibold uppercase tracking-wide">
                Needs Attention
              </div>
              <div className="text-[14px] font-bold text-green-900">
                {insight.topWeakness.subject}
              </div>
              <div className="text-[11px] text-text-muted">
                {insight.topWeakness.avgScore.toFixed(0)}% avg
              </div>
            </div>
          </div>
        )}
        {!insight.topWeakness && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-cream">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
              <TrendingUp size={15} className="text-green-700" />
            </div>
            <div>
              <div className="text-[10px] text-text-muted font-semibold uppercase tracking-wide">
                Status
              </div>
              <div className="text-[13px] font-semibold text-green-900">
                No weak subjects detected
              </div>
            </div>
          </div>
        )}
      </div>

      {/* All subjects, ranked */}
      <div className="space-y-2 mb-4">
        {insight.subjects.map((s) => {
          const cfg = levelColor(s.level);
          return (
            <div key={s.subject} className="flex items-center gap-3">
              <span className="text-[12px] text-green-900 w-32 shrink-0 truncate">{s.subject}</span>
              <div className="flex-1 h-1.5 rounded-full bg-cream overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.avgScore}%`, background: cfg.color }}
                />
              </div>
              <span className="text-[11px] font-bold w-10 text-right" style={{ color: cfg.color }}>
                {s.avgScore.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Recommendation */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100">
        <Lightbulb size={14} className="text-blue-700 shrink-0 mt-0.5" />
        <p className="text-[12px] text-blue-900 leading-relaxed">{insight.recommendation}</p>
      </div>
    </div>
  );
}
