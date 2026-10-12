"use client";

import { TrendingUp, TrendingDown, AlertCircle, Lightbulb } from "lucide-react";
import { buildCohortInsights, levelColor, type SubjectPoint } from "./Insights";

interface Props {
  // One array of subject points per student/submission, e.g.
  // [[{subject:"Maths",avgScore:80,questionCount:20}, ...], [...], ...]
  allSubjectPoints: SubjectPoint[][];
  contextLabel: string; // "practice sessions" or "exam submissions"
}

export function InsightsTab({ allSubjectPoints, contextLabel }: Props) {
  const cohort = buildCohortInsights(allSubjectPoints);

  if (cohort.length === 0) {
    return (
      <div
        className="bg-white rounded-2xl border p-12 text-center text-text-muted"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        Not enough graded data yet to generate insights.
      </div>
    );
  }

  const weakest = cohort.filter((c) => c.level === "weakness");
  const strongest = [...cohort].reverse().filter((c) => c.level === "strength");

  return (
    <div className="space-y-5">
      {/* Headline cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className="bg-white rounded-2xl border p-5"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <TrendingDown size={15} className="text-red-600" />
            </div>
            <h3 className="font-serif text-base text-green-900">Weakest Areas</h3>
          </div>
          {weakest.length === 0 ? (
            <p className="text-[13px] text-text-muted">
              No subjects below the weakness threshold. Great cohort performance.
            </p>
          ) : (
            <div className="space-y-2">
              {weakest.slice(0, 4).map((c) => {
                const cfg = levelColor(c.level);
                return (
                  <div
                    key={c.subject}
                    className="flex items-center justify-between p-2.5 rounded-lg"
                    style={{ background: cfg.bg }}>
                    <div>
                      <div className="text-[13px] font-semibold text-green-900">{c.subject}</div>
                      <div className="text-[10px] text-text-muted">
                        {c.studentCount} students graded
                      </div>
                    </div>
                    <span className="text-[14px] font-bold" style={{ color: cfg.color }}>
                      {c.avgScore.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          className="bg-white rounded-2xl border p-5"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp size={15} className="text-green-700" />
            </div>
            <h3 className="font-serif text-base text-green-900">Strongest Areas</h3>
          </div>
          {strongest.length === 0 ? (
            <p className="text-[13px] text-text-muted">
              No subjects above the strength threshold yet.
            </p>
          ) : (
            <div className="space-y-2">
              {strongest.slice(0, 4).map((c) => {
                const cfg = levelColor(c.level);
                return (
                  <div
                    key={c.subject}
                    className="flex items-center justify-between p-2.5 rounded-lg"
                    style={{ background: cfg.bg }}>
                    <div>
                      <div className="text-[13px] font-semibold text-green-900">{c.subject}</div>
                      <div className="text-[10px] text-text-muted">
                        {c.studentCount} students graded
                      </div>
                    </div>
                    <span className="text-[14px] font-bold" style={{ color: cfg.color }}>
                      {c.avgScore.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Full subject breakdown, weakest first */}
      <div
        className="bg-white rounded-2xl border p-6"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <h3 className="font-serif text-base text-green-900 mb-4">All Subjects — Cohort Average</h3>
        <div className="space-y-3">
          {cohort.map((c) => {
            const cfg = levelColor(c.level);
            return (
              <div key={c.subject} className="flex items-center gap-3">
                <span className="text-[12px] text-green-900 w-36 shrink-0 truncate">
                  {c.subject}
                </span>
                <div className="flex-1 h-2 rounded-full bg-cream overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.avgScore}%`, background: cfg.color }}
                  />
                </div>
                <span
                  className="text-[12px] font-bold w-12 text-right"
                  style={{ color: cfg.color }}>
                  {c.avgScore.toFixed(0)}%
                </span>
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 w-24 text-center"
                  style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendation banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <Lightbulb size={15} className="text-blue-700" />
        </div>
        <div>
          <h4 className="text-[13px] font-semibold text-blue-900 mb-1">Cohort Recommendation</h4>
          <p className="text-[12px] text-blue-800 leading-relaxed">
            {weakest.length > 0
              ? `Across ${contextLabel}, ${weakest.map((w) => w.subject).join(" and ")} ${
                  weakest.length === 1 ? "is" : "are"
                } the lowest-performing subject${weakest.length === 1 ? "" : "s"}. Consider flagging these for additional content, weak-topic drills, or rubric review to confirm AI grading is calibrated correctly.`
              : `Across ${contextLabel}, performance is consistently strong with no subject falling below the weakness threshold.`}
          </p>
        </div>
      </div>
    </div>
  );
}
