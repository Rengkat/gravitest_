"use client";

import { useCallback } from "react";
import { AIResult, ExamMode } from "@/types/examsTypes";
import { BookOpen, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { elaborateEssayScore } from "@/lib/api/aiScoring";
import ExplainWithAiButton from "@/Components/shared/ExplainWithAiButton";
import MarkdownContent from "@/Components/shared/MarkdownContent";

/**
 * Feedback for ONE graded part: score, AI feedback (strengths / weaknesses /
 * how to improve), the stored explanation, the mark scheme, and an
 * "Explain more with AI" control that is bound to this part's own score row.
 * State here is local to the part, so parts can never affect each other.
 */
export default function AIResultPanel({
  result,
  modelAnswer,
  questionText,
  onToggleSolution,
  onElaborated,
}: {
  result: AIResult;
  modelAnswer?: string;
  /** Context line for the AI dialog (the part's question text). */
  questionText?: string;
  onToggleSolution: () => void;
  onElaborated?: (detailedFeedback: string) => void;
  mode?: ExamMode;
}) {
  const pct = result.maxScore ? Math.round((result.score / result.maxScore) * 100) : 0;
  const barColor = pct >= 70 ? "bg-green-600" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
  const scoreId = result.id;
  const mark = modelAnswer ?? result.modelAnswer;

  // Bound to this part's score row (which carries the student's answer, the mark scheme and rubric server-side).
  const requestExplanation = useCallback(
    async () => {
      if (!scoreId) throw new Error("There is nothing to explain for this part yet.");
      const res = await elaborateEssayScore(scoreId);
      const text = res.detailedFeedback;
      if (!text) throw new Error("The AI returned an empty explanation. Please try again.");
      onElaborated?.(text);
      return text;
    },
    [scoreId, onElaborated],
  );

  return (
    <div
      className="mt-4 rounded-xl border overflow-hidden"
      style={{ borderColor: "rgba(30,80,50,0.15)" }}
      role="region"
      aria-label={`AI assessment: ${result.score} out of ${result.maxScore}`}>
      <div className="bg-gradient-to-r from-green-900 to-green-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-yellow-300" aria-hidden="true" />
          <span className="text-white text-sm font-bold">AI Assessment</span>
          <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Automated estimate
          </span>
        </div>
        <div className="text-white font-mono font-bold text-lg">
          {result.score}
          <span className="text-green-200 text-sm font-normal">/{result.maxScore}</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100" aria-hidden="true">
        <div className={`h-full ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>

      <div className="p-4 space-y-4 bg-white">
        {result.needsReview && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
            The AI was not very confident about this grade, so it has been flagged for review.
          </p>
        )}

        {result.feedback && <p className="text-sm text-gray-800 leading-relaxed">{result.feedback}</p>}

        {result.strengths?.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-green-800 uppercase tracking-wide mb-1.5">Strengths</p>
            <ul className="space-y-1">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-gray-700">
                  <span className="text-green-700 mt-0.5 shrink-0" aria-hidden="true">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.improvements?.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-orange-700 uppercase tracking-wide mb-1.5">
              Weaknesses &amp; how to improve
            </p>
            <ul className="space-y-1">
              {result.improvements.map((s, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-gray-700">
                  <span className="text-orange-600 mt-0.5 shrink-0" aria-hidden="true">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Stored (database) explanation — the authoritative starting point */}
        {result.explanation && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-green-900">
              <Sparkles size={12} aria-hidden="true" /> Explanation
            </p>
            <MarkdownContent text={result.explanation} className="!text-[13px] !leading-relaxed" />
          </div>
        )}

        {scoreId && (
          <ExplainWithAiButton
            questionText={questionText ?? "Explain my answer and how to improve it"}
            request={requestExplanation}
            label={result.explanation ? "Explain more with Sabi" : "Explain with Sabi"}
          />
        )}

        {mark && (
          <div>
            <button
              type="button"
              onClick={onToggleSolution}
              aria-expanded={!!result.showSolution}
              className="flex items-center gap-2 text-xs font-semibold text-green-900 hover:text-green-700 transition-colors">
              <BookOpen size={13} aria-hidden="true" />
              {result.showSolution ? "Hide Model Answer" : "Show Model Answer"}
              {result.showSolution ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
            </button>
            {result.showSolution && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-[11px] font-bold text-green-900 uppercase tracking-wide mb-1.5">
                  Model Answer / Mark Scheme
                </p>
                <MarkdownContent text={mark} className="!text-[13px] !leading-relaxed" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
