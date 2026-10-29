"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleSlash,
  Loader2,
  PenLine,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import AIResultPanel from "@/app/(protected)/cbt/theory/components/AIResultPanel";
import ExplainWithAiButton from "@/Components/shared/ExplainWithAiButton";
import MarkdownContent from "@/Components/shared/MarkdownContent";
import { explainMcqQuestion } from "@/lib/api/aiExplain";
import { regradeAnswer } from "@/lib/api/exams";
import { extractErrorMessage } from "@/lib/api/client";
import type { QuestionGradeStatus, TheoryQuestionResult } from "@/lib/results/buildTheoryResults";

export type { TheoryQuestionResult } from "@/lib/results/buildTheoryResults";

interface Props {
  sessionId: string;
  /** Exam mode shows marks and percentages; Practice is a learning review with no formal score. */
  showScores: boolean;
  totalScore: number;
  maxScore: number;
  percentage: number;
  questions: TheoryQuestionResult[];
  /** Re-fetch results after a successful regrade. */
  onRegraded: () => Promise<void> | void;
}

const STATUS_LABEL: Record<QuestionGradeStatus, string> = {
  graded: "Graded",
  needs_review: "Graded · review pending",
  ungraded: "Could not be graded",
  not_attempted: "Not attempted",
};

function bandColor(pct: number) {
  if (pct >= 70) return "bg-green-700 text-white";
  if (pct >= 50) return "bg-amber-600 text-white";
  return "bg-red-600 text-white";
}

export default function TheoryResultSection({
  sessionId,
  showScores,
  totalScore,
  maxScore,
  percentage,
  questions,
  onRegraded,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  // Every map below is keyed by a stable id (question or part), so one question's
  // retry/solution state can never leak into another.
  const [showModel, setShowModel] = useState<Record<string, boolean>>({});
  const [retry, setRetry] = useState<Record<string, { loading: boolean; error?: string }>>({});

  const active = questions.find((q) => q.id === activeId);

  const handleRetry = useCallback(
    async (questionId: string) => {
      if (retry[questionId]?.loading) return; // no duplicate grading requests
      setRetry((prev) => ({ ...prev, [questionId]: { loading: true } }));
      try {
        await regradeAnswer(sessionId, questionId);
        await onRegraded();
        setRetry((prev) => ({ ...prev, [questionId]: { loading: false } }));
      } catch (err) {
        setRetry((prev) => ({ ...prev, [questionId]: { loading: false, error: extractErrorMessage(err) } }));
      }
    },
    [retry, sessionId, onRegraded],
  );

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" aria-labelledby="theory-results-heading">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
            <PenLine size={18} className="text-violet-700" aria-hidden="true" />
          </div>
          <h3 id="theory-results-heading" className="text-[16px] font-bold text-gray-900">
            Theory / Practical
          </h3>
        </div>
        {showScores && (
          <div className="text-right">
            <p className="text-[22px] font-extrabold text-gray-900 leading-none">
              {totalScore}
              <span className="text-gray-600 text-base font-semibold">/{maxScore}</span>
            </p>
            <p className="text-[12px] font-bold text-violet-700">{percentage}%</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
        {questions.map((q) => {
          const pct = q.marksTotal ? Math.round((q.marksGot / q.marksTotal) * 100) : 0;
          const isActive = activeId === q.id;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setActiveId(q.id)}
              aria-pressed={isActive}
              className={`flex items-center justify-between gap-2 p-3 rounded-xl border-2 transition-all text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700 ${
                isActive ? "border-gray-900" : "border-gray-200 hover:border-gray-400"
              }`}>
              <span className="text-[14px] font-extrabold text-gray-900">{q.title}</span>
              {q.status === "graded" || q.status === "needs_review" ? (
                showScores ? (
                  <span className={`text-[12px] font-bold px-2.5 py-1 rounded-md ${bandColor(pct)}`}>
                    {q.marksGot}/{q.marksTotal} · {pct}%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[12px] font-bold text-green-900">
                    <CheckCircle2 size={14} aria-hidden="true" /> {STATUS_LABEL[q.status]}
                  </span>
                )
              ) : q.status === "ungraded" ? (
                <span className="inline-flex items-center gap-1 text-[12px] font-bold text-red-800">
                  <AlertTriangle size={14} aria-hidden="true" /> {STATUS_LABEL.ungraded}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[12px] font-bold text-gray-700">
                  <CircleSlash size={14} aria-hidden="true" /> {STATUS_LABEL.not_attempted}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-5 pt-5 border-t border-gray-200">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h4 className="text-[15px] font-extrabold text-gray-900">{active.title}</h4>
            <span className="text-[12px] font-semibold text-gray-700">{STATUS_LABEL[active.status]}</span>
          </div>

          {active.imageUrl && (
            <Image
              src={active.imageUrl}
              width={500}
              height={400}
              alt={`Diagram for ${active.title}`}
              className="mb-3 max-w-full rounded-lg border border-gray-200 max-h-64 object-contain"
            />
          )}

          {/* Grading failed for this question: clear status + retry (everything else stays available). */}
          {active.status === "ungraded" && (
            <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-3">
              <AlertTriangle size={18} className="shrink-0 text-red-700" aria-hidden="true" />
              <p className="flex-1 text-[13px] text-red-900">
                We couldn&apos;t grade this question automatically. Your answer is saved
                {showScores ? ", and it hasn't been counted towards your score yet" : ""}. You can retry now.
                {retry[active.id]?.error && <span className="block font-semibold">{retry[active.id]?.error}</span>}
              </p>
              <button
                type="button"
                onClick={() => handleRetry(active.id)}
                disabled={retry[active.id]?.loading}
                className="flex items-center gap-1.5 rounded-lg bg-green-800 px-3 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60">
                {retry[active.id]?.loading ? (
                  <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw size={13} aria-hidden="true" />
                )}
                {retry[active.id]?.loading ? "Grading…" : "Retry grading"}
              </button>
            </div>
          )}

          <div className="space-y-4">
            {active.parts.map(({ sub, result, failed, studentText, studentImageUrls }) => (
              <div key={sub.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-extrabold text-gray-900">{sub.label}</span>
                  {showScores && result && (
                    <span className="text-[13px] font-bold text-gray-900">
                      {result.score}/{result.maxScore}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-gray-800 mb-3">{sub.text}</p>

                <div className="mb-3 rounded-lg border border-gray-200 bg-white p-3">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-700">Your answer</p>
                  {studentText.trim() ? (
                    <p className="whitespace-pre-wrap text-[13px] text-gray-900">{studentText}</p>
                  ) : studentImageUrls.length === 0 ? (
                    <p className="text-[13px] italic text-gray-700">No answer was given for this part.</p>
                  ) : null}
                  {studentImageUrls.map((url) => (
                    <Image
                      key={url}
                      src={url}
                      width={500}
                      height={400}
                      alt={`Your submitted work for ${sub.label}`}
                      className="mt-2 max-w-full rounded-lg border border-gray-200 max-h-64 object-contain"
                    />
                  ))}
                </div>

                {result ? (
                  <AIResultPanel
                    result={result}
                    questionText={`${active.title} ${sub.label} ${sub.text}`}
                    onToggleSolution={() => undefined}
                    mode={showScores ? "exam" : "practice"}
                  />
                ) : failed ? (
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-red-800">
                    <AlertTriangle size={14} aria-hidden="true" /> This part could not be graded.
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-[13px] text-gray-700">
                    <Sparkles size={12} aria-hidden="true" /> Not graded.
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Question-level reference: stored explanation + mark scheme + AI help */}
          {active.explanation && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-green-900">
                <Sparkles size={13} aria-hidden="true" /> Explanation
              </p>
              <MarkdownContent text={active.explanation} className="!text-[13px] !leading-relaxed" />
            </div>
          )}

          {active.modelAnswer && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowModel((prev) => ({ ...prev, [active.id]: !prev[active.id] }))}
                aria-expanded={!!showModel[active.id]}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-green-900">
                <BookOpen size={14} aria-hidden="true" />
                {showModel[active.id] ? "Hide model answer" : "Show model answer"}
                {showModel[active.id] ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
              </button>
              {showModel[active.id] && (
                <div className="mt-2 rounded-lg border border-green-200 bg-white p-3">
                  <MarkdownContent text={active.modelAnswer} className="!text-[13px] !leading-relaxed" />
                </div>
              )}
            </div>
          )}

          {active.questionId && (
            <div className="mt-4">
              {/* key = this question's id → its AI state is independent of every other question */}
              <ExplainWithAiButton
                key={active.id}
                questionText={`${active.title}: ${active.questionText}`}
                label={active.explanation ? "Explain more with Sabi" : "Explain with Sabi"}
                request={async () =>
                  (await explainMcqQuestion(active.questionId!, undefined, "standard")).explanation
                }
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
