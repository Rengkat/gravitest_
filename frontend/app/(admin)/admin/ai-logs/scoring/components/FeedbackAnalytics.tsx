"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, Tag } from "lucide-react";
import type { PracticeQuestionScore, ExamSubmission } from "../../types";

interface Props {
  practiceScores: PracticeQuestionScore[];
  examSubmissions: ExamSubmission[];
}

const THEMES = [
  { label: "Missed key concepts", count: 38, sentiment: "negative" as const },
  { label: "Excellent explanation", count: 31, sentiment: "positive" as const },
  { label: "Calculation error", count: 27, sentiment: "negative" as const },
  { label: "Partially correct", count: 24, sentiment: "neutral" as const },
  { label: "Good structure", count: 21, sentiment: "positive" as const },
  { label: "Needs more detail", count: 19, sentiment: "negative" as const },
  { label: "Strong argument", count: 17, sentiment: "positive" as const },
  { label: "Off-topic response", count: 14, sentiment: "negative" as const },
];

const SENTIMENT_CFG = {
  positive: { color: "#10b981", bg: "#10b98115", icon: ThumbsUp },
  negative: { color: "#ef4444", bg: "#ef444415", icon: ThumbsDown },
  neutral: { color: "#6b7280", bg: "#6b728015", icon: MessageSquare },
};

export function FeedbackAnalytics({ practiceScores, examSubmissions }: Props) {
  const [view, setView] = useState<"overview" | "themes">("overview");

  const totalFeedback = practiceScores.length + examSubmissions.length;
  const avgAiScore = practiceScores.length
    ? (practiceScores.reduce((s, p) => s + p.aiScore, 0) / practiceScores.length).toFixed(1)
    : "—";
  const reviewedCount = practiceScores.filter((p) => p.reviewedScore != null).length;
  const reviewedPct = practiceScores.length ? (reviewedCount / practiceScores.length) * 100 : 0;

  // Discrepancy between AI score and teacher-reviewed score (when present)
  const discrepancies = practiceScores
    .filter((p) => p.reviewedScore != null)
    .map((p) => Math.abs(p.aiScore - (p.reviewedScore as number)));
  const avgDiscrepancy = discrepancies.length
    ? (discrepancies.reduce((s, d) => s + d, 0) / discrepancies.length).toFixed(1)
    : "—";

  const examReviewed = examSubmissions.filter((e) => e.teacherReview).length;
  const examReviewedPct = examSubmissions.length
    ? (examReviewed / examSubmissions.length) * 100
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {(["overview", "themes"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all border ${
              view === v
                ? "bg-green-800 text-white border-green-800"
                : "bg-white text-text-muted border-gray-200 hover:bg-cream"
            }`}>
            {v === "overview" ? "Overview" : "Common Themes"}
          </button>
        ))}
      </div>

      {view === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            className="bg-white rounded-2xl border p-6"
            style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <h3 className="font-serif text-lg text-green-900 mb-4">Practice Question Feedback</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cream">
                <div className="text-[20px] font-bold text-green-900">{avgAiScore}%</div>
                <div className="text-[10px] text-text-muted">Avg AI Score</div>
              </div>
              <div className="p-3 rounded-xl bg-cream">
                <div
                  className="text-[20px] font-bold"
                  style={{
                    color: parseFloat(avgDiscrepancy as string) <= 5 ? "#10b981" : "#f59e0b",
                  }}>
                  ±{avgDiscrepancy}
                </div>
                <div className="text-[10px] text-text-muted">Avg AI/Teacher Diff</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-text-muted">Teacher reviewed</span>
                <span className="font-semibold text-green-900">
                  {reviewedCount} / {practiceScores.length}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${reviewedPct}%` }}
                />
              </div>
            </div>
          </div>

          <div
            className="bg-white rounded-2xl border p-6"
            style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <h3 className="font-serif text-lg text-green-900 mb-4">Exam Submission Feedback</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cream">
                <div className="text-[20px] font-bold text-green-900">{examSubmissions.length}</div>
                <div className="text-[10px] text-text-muted">Total Submissions</div>
              </div>
              <div className="p-3 rounded-xl bg-cream">
                <div className="text-[20px] font-bold text-green-900">{examReviewed}</div>
                <div className="text-[10px] text-text-muted">Teacher Reviewed</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-text-muted">Review coverage</span>
                <span className="font-semibold text-green-900">{examReviewedPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-600"
                  style={{ width: `${examReviewedPct}%` }}
                />
              </div>
            </div>

            {examSubmissions.length > 0 && (
              <div
                className="mt-4 pt-4 border-t space-y-2"
                style={{ borderColor: "rgba(30,80,50,0.06)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Subject Breakdown (latest submission)
                </p>
                {examSubmissions[0]?.aiBreakdown?.slice(0, 3).map((b) => (
                  <div key={b.subject} className="flex items-center justify-between text-[12px]">
                    <span className="text-green-900">{b.subject}</span>
                    <span className="font-semibold text-green-900">
                      {b.score}/{b.maxScore}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {view === "themes" && (
        <div
          className="bg-white rounded-2xl border p-6"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <h3 className="font-serif text-lg text-green-900 mb-1">Common Feedback Themes</h3>
          <p className="text-[12px] text-text-muted mb-4">
            Most frequent AI feedback categories across all graded sessions
          </p>

          <div className="space-y-3">
            {THEMES.map((theme) => {
              const cfg = SENTIMENT_CFG[theme.sentiment];
              const Icon = cfg.icon;
              const maxCount = THEMES[0].count;
              const pct = (theme.count / maxCount) * 100;
              return (
                <div key={theme.label} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: cfg.bg }}>
                    <Icon size={13} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="font-medium text-green-900">{theme.label}</span>
                      <span className="text-text-muted">{theme.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: cfg.color }}
                      />
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {theme.sentiment}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
