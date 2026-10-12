"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
} from "lucide-react";
import type { PracticeQuestionScore } from "../../types";

interface Props {
  scores: PracticeQuestionScore[];
  onOverride?: (scoreId: string, reviewedScore: number, reviewNotes: string) => void;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const color = confidence >= 0.85 ? "#10b981" : confidence >= 0.65 ? "#f59e0b" : "#ef4444";
  const label = confidence >= 0.85 ? "High" : confidence >= 0.65 ? "Medium" : "Low";
  return (
    <span
      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${color}15`, color }}>
      <Sparkles size={9} />
      {label} confidence ({(confidence * 100).toFixed(0)}%)
    </span>
  );
}

function statusFromScore(score: number): { Icon: any; color: string } {
  if (score >= 70) return { Icon: CheckCircle2, color: "#10b981" };
  if (score >= 40) return { Icon: AlertCircle, color: "#f59e0b" };
  return { Icon: XCircle, color: "#ef4444" };
}

function ScoreRow({
  item,
  index,
  onOverride,
}: {
  item: PracticeQuestionScore;
  index: number;
  onOverride?: (scoreId: string, reviewedScore: number, reviewNotes: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reviewedScore, setReviewedScore] = useState(String(item.reviewedScore ?? item.aiScore));
  const [reviewNotes, setReviewNotes] = useState(item.reviewNotes ?? "");

  const { Icon: StatusIcon, color: statusColor } = statusFromScore(
    item.reviewedScore ?? item.aiScore,
  );

  const handleSave = () => {
    const score = parseFloat(reviewedScore);
    if (isNaN(score) || score < 0 || score > 100) return;
    onOverride?.(item.id, score, reviewNotes);
    setEditing(false);
  };

  return (
    <div className="border-b last:border-0" style={{ borderColor: "rgba(30,80,50,0.06)" }}>
      <div
        className="flex items-center gap-3 px-5 py-3 hover:bg-cream/20 cursor-pointer"
        onClick={() => setExpanded(!expanded)}>
        <StatusIcon size={16} style={{ color: statusColor }} className="shrink-0" />
        <span className="text-[11px] font-semibold text-text-muted shrink-0">Q{index + 1}</span>
        <span className="text-[13px] text-green-900 flex-1 truncate">{item.questionText}</span>

        <div className="flex items-center gap-2 shrink-0">
          <ConfidenceBadge confidence={item.confidence} />
          {item.reviewedScore != null && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">
              Reviewed
            </span>
          )}
          <span className="text-[12px] font-bold" style={{ color: statusColor }}>
            {item.reviewedScore ?? item.aiScore}%
          </span>
          {expanded ? (
            <ChevronUp size={14} className="text-text-muted" />
          ) : (
            <ChevronDown size={14} className="text-text-muted" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 space-y-3" onClick={(e) => e.stopPropagation()}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-1">
              {item.studentName}'s Answer
            </p>
            <div className="rounded-xl bg-cream p-3 text-[13px] text-green-900">
              {item.studentAnswer}
            </div>
          </div>

          {item.correctAnswer && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-1">
                Correct Answer
              </p>
              <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-[13px] text-green-900">
                {item.correctAnswer}
              </div>
            </div>
          )}

          {item.aiFeedback && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-1">
                AI Feedback
              </p>
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-[12px] text-blue-900">
                {item.aiFeedback}
              </div>
            </div>
          )}

          {item.suggestedImprovements?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-1">
                Suggested Improvements
              </p>
              <ul className="space-y-1">
                {item.suggestedImprovements.map((s, i) => (
                  <li key={i} className="text-[12px] text-green-900 flex items-start gap-1.5">
                    <span className="text-green-600 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.scoringCriteria?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-1.5">
                Scoring Criteria
              </p>
              <div className="space-y-1.5">
                {item.scoringCriteria.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[12px] bg-cream rounded-lg px-3 py-1.5">
                    <span className="text-green-900">{c.criterion}</span>
                    <span className="font-semibold text-green-900">
                      {c.awardedPoints}/{c.maxPoints}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.reviewedBy && (
            <div className="flex items-center gap-1.5 text-[11px] text-blue-600">
              <User size={11} /> Reviewed by {item.reviewedBy}
              {item.reviewNotes && <span className="text-text-muted">— "{item.reviewNotes}"</span>}
            </div>
          )}

          {editing ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-[11px] font-semibold text-amber-700">Override AI Score</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={reviewedScore}
                  onChange={(e) => setReviewedScore(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-amber-200 text-[13px] focus:outline-none"
                  placeholder="0–100"
                />
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-amber-200 text-[13px] focus:outline-none"
                  placeholder="Reason for override…"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-800 text-white text-[12px] font-semibold">
                  <Save size={12} /> Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px]">
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            onOverride && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline">
                <Edit3 size={11} /> Override score
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function AutoGradingPanel({ scores, onOverride }: Props) {
  const reviewed = scores.filter((s) => s.reviewedScore != null).length;
  const avgScore = scores.length
    ? (scores.reduce((sum, s) => sum + (s.reviewedScore ?? s.aiScore), 0) / scores.length).toFixed(
        1,
      )
    : "—";
  const avgConfidence = scores.length
    ? ((scores.reduce((sum, s) => sum + s.confidence, 0) / scores.length) * 100).toFixed(0)
    : "—";

  return (
    <div className="space-y-4">
      <div
        className="bg-white rounded-2xl border p-6"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-serif text-lg text-green-900">Auto-Grading Results</h3>
            <p className="text-[12px] text-text-muted mt-0.5">
              {scores.length} questions · AI graded
            </p>
          </div>
          <div className="text-right">
            <div className="text-[26px] font-bold text-green-900">{avgScore}%</div>
            <div className="text-[10px] text-text-muted">Average Score</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-green-50">
            <div className="text-[20px] font-bold text-green-700">{reviewed}</div>
            <div className="text-[10px] text-text-muted font-semibold">Teacher Reviewed</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-blue-50">
            <div className="text-[20px] font-bold text-blue-700">{avgConfidence}%</div>
            <div className="text-[10px] text-text-muted font-semibold">Avg AI Confidence</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-amber-50">
            <div className="text-[20px] font-bold text-amber-700">{scores.length - reviewed}</div>
            <div className="text-[10px] text-text-muted font-semibold">Awaiting Review</div>
          </div>
        </div>
      </div>

      <div
        className="bg-white rounded-2xl border overflow-hidden"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Question Breakdown
          </h3>
        </div>

        {scores.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-text-muted">
            No question data available.
          </div>
        ) : (
          scores.map((s, i) => <ScoreRow key={s.id} item={s} index={i} onOverride={onOverride} />)
        )}
      </div>
    </div>
  );
}
