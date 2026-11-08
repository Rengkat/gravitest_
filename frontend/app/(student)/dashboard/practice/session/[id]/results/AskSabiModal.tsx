"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import type { Question } from "@/lib/constants/mcq";
import { explainMcqQuestion } from "@/lib/api/aiExplain";
import { explainFailure, type ExplainFailure } from "@/lib/api/aiExplain";
import RichContent from "@/Components/content/RichContent";
import MathText from "@/Components/content/MathText";
import { accessErrorDecision, parseAccessError, type AccessError } from "@/lib/billing/errors";
import { UpgradePrompt } from "@/Components/billing/FeatureGate";

interface AskSabiModalProps {
  question: Question | null;
  studentAnswerLabel?: string | null;
  onClose: () => void;
}

export default function AskSabiModal({ question, studentAnswerLabel, onClose }: AskSabiModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [detailedExplanation, setDetailedExplanation] = useState<string | null>(null);
  // Each AI step has its own admin rule, so each can be locked independently.
  const [locked, setLocked] = useState<AccessError | null>(null);
  const [moreLocked, setMoreLocked] = useState<AccessError | null>(null);
  const [error, setError] = useState<ExplainFailure | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!question?.questionId) return;
    let cancelled = false;
    setLoading(true);
    setExplanation(null);
    setDetailedExplanation(null);
    setLocked(null);
    setMoreLocked(null);
    setError(null);

    explainMcqQuestion(question.questionId, studentAnswerLabel ?? undefined)
      .then((res) => {
        if (!cancelled) setExplanation(res.explanation);
      })
      .catch((err) => {
        if (cancelled) return;
        // The admin-configured access rule answers 403 with a code: needs a
        // plan / free allowance used up / temporarily off. Show the real reason.
        const access = parseAccessError(err);
        if (access) setLocked(access);
        else setError(explainFailure(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [question?.questionId, studentAnswerLabel, attempt]);

  function handleExplainMore() {
    if (!question?.questionId || loadingMore || detailedExplanation) return;
    setLoadingMore(true);
    setError(null);
    setMoreLocked(null);
    explainMcqQuestion(question.questionId, studentAnswerLabel ?? undefined, "detailed")
      .then((res) => setDetailedExplanation(res.explanation))
      .catch((err) => {
        const access = parseAccessError(err);
        if (access) setMoreLocked(access);
        else setError(explainFailure(err));
      })
      .finally(() => setLoadingMore(false));
  }

  if (!question) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ask-sabi-title">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-green-700" />
            <h2 id="ask-sabi-title" className="text-[15px] font-bold text-gray-800">
              Sabi-AI Explains
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <MathText as="p" text={question.text} className="mb-4 block text-[13px] text-gray-500 leading-relaxed" />

          {loading && (
            <div className="flex items-center gap-2 text-green-700 text-sm py-6 justify-center">
              <Loader2 size={18} className="animate-spin" />
              Sabi is thinking…
            </div>
          )}

          {locked && (
            <UpgradePrompt
              decision={accessErrorDecision(locked)}
              upgradeHref="/dashboard/billing"
              featureLabel="AI Explain"
            />
          )}

          {error && (
            <div role="alert" className="text-center py-6 text-[13px] text-red-600">
              <p className="mb-3">{error.message}</p>
              {error.retryable && (
                <button
                  onClick={() => setAttempt((n) => n + 1)}
                  className="rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                  Try again
                </button>
              )}
            </div>
          )}

          {explanation && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <RichContent text={explanation} className="!text-[13px] !leading-relaxed" />
            </div>
          )}

          {explanation && !detailedExplanation && (
            <button
              onClick={handleExplainMore}
              disabled={loadingMore}
              className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-green-700 hover:text-green-800 bg-transparent border-none cursor-pointer disabled:opacity-50">
              {loadingMore ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Getting a deeper explanation…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Explain more
                </>
              )}
            </button>
          )}

          {moreLocked && (
            <div className="mt-3">
              <UpgradePrompt
                decision={accessErrorDecision(moreLocked)}
                upgradeHref="/dashboard/billing"
                featureLabel="The deeper explanation"
              />
            </div>
          )}

          {detailedExplanation && (
            <div className="mt-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-1.5">
                In more detail
              </p>
              <RichContent text={detailedExplanation} className="!text-[13px] !leading-relaxed" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
