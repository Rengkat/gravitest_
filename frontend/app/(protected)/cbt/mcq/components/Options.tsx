import { useCallback } from "react";
import { Question } from "@/lib/constants/mcq";
import { SessionMode } from "@/lib/session/practiceSession";
import { CheckCircle2, XCircle, Sparkles, Loader2 } from "lucide-react";
import Image from "next/image";
import MarkdownContent from "@/Components/shared/MarkdownContent";
import ExplainWithAiButton from "@/Components/shared/ExplainWithAiButton";
import { explainMcqQuestion } from "@/lib/api/aiExplain";

export interface McqFeedback {
  /** What the student chose when they checked. */
  selectedLabel: string;
  correctLabel: string;
  isCorrect: boolean;
}

interface OptionsProps {
  currentQuestion: Question;
  currentSelectedOption: string | null;
  handleSelectOption: (letter: string) => void;
  mode?: SessionMode;
  /** Practice only: feedback for THIS question once the student has checked it. */
  feedback?: McqFeedback | null;
  /** Practice only: submit the selected option and reveal feedback. */
  onCheckAnswer?: () => void;
  isChecking?: boolean;
}

const Options = ({
  currentQuestion,
  currentSelectedOption,
  handleSelectOption,
  mode = "exam",
  feedback = null,
  onCheckAnswer,
  isChecking = false,
}: OptionsProps) => {
  // Feedback can only ever exist in Practice mode; Exam mode never renders it,
  // even if a caller passed something by mistake.
  const showReveal = mode === "practice" && !!feedback;
  const options = currentQuestion.options ?? [];
  const questionId = currentQuestion.questionId;

  // Bound to THIS question and THIS student's answer — nothing from other questions.
  const requestExplanation = useCallback(
    async () => {
      if (!questionId) throw new Error("This question can't be explained right now.");
      // One request, standard level — the platform's stored explanation stays the authority.
      const res = await explainMcqQuestion(questionId, feedback?.selectedLabel, "standard");
      return res.explanation;
    },
    [questionId, feedback?.selectedLabel],
  );

  return (
    <div className="px-6 pb-6 space-y-3" role="radiogroup" aria-label="Answer options">
      {options.map((option) => {
        const letter = option.label;
        const isSelected = currentSelectedOption === letter;
        const isCorrectOption = showReveal && letter === feedback!.correctLabel;
        const isWrongSelected = showReveal && isSelected && letter !== feedback!.correctLabel;

        let borderCls = isSelected
          ? "border-green-600 bg-green-50"
          : "border-gray-200 hover:border-green-300 hover:bg-cream/50";
        if (showReveal) {
          if (isCorrectOption) borderCls = "border-green-600 bg-green-50";
          else if (isWrongSelected) borderCls = "border-red-400 bg-red-50";
          else borderCls = "border-gray-200";
        }

        return (
          <label
            key={letter}
            className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all outline-none focus-within:ring-2 focus-within:ring-green-500 ${showReveal ? "cursor-default" : "cursor-pointer"} ${borderCls}`}>
            <input
              type="radio"
              name={`option-${currentQuestion.sessionQuestionId ?? currentQuestion.id}`}
              value={letter}
              checked={isSelected}
              disabled={showReveal || isChecking}
              onChange={() => handleSelectOption(letter)}
              className="sr-only"
            />
            <div className="flex items-center gap-3 shrink-0">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? "border-green-600" : "border-gray-300"
                }`}
                aria-hidden="true">
                {isSelected && <div className="w-3 h-3 rounded-full bg-green-600" />}
              </div>
              <span className="font-bold text-green-800 w-6">{letter}.</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[14px] text-gray-700">{option.text}</span>
              {option.imageUrl && (
                <div className="mt-2">
                  <Image
                    src={option.imageUrl}
                    width={280}
                    height={200}
                    alt={`Option ${letter}`}
                    className="max-w-full rounded-lg border border-gray-200 max-h-48 object-contain"
                  />
                </div>
              )}
            </div>
            {isCorrectOption && (
              <>
                <CheckCircle2 size={18} className="text-green-600 shrink-0" aria-hidden="true" />
                <span className="sr-only">Correct answer</span>
              </>
            )}
            {isWrongSelected && (
              <>
                <XCircle size={18} className="text-red-500 shrink-0" aria-hidden="true" />
                <span className="sr-only">Your answer (incorrect)</span>
              </>
            )}
          </label>
        );
      })}

      {/* ── Practice: explicit Check Answer (nothing is revealed before an attempt) ── */}
      {mode === "practice" && !feedback && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onCheckAnswer}
            disabled={!currentSelectedOption || isChecking}
            className="inline-flex items-center gap-2 rounded-lg bg-green-800 px-5 py-2.5 text-[14px] font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">
            {isChecking ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
            {isChecking ? "Checking…" : "Check Answer"}
          </button>
          {!currentSelectedOption && (
            <span className="ml-3 text-[12px] text-gray-600">Choose an option first.</span>
          )}
        </div>
      )}

      {/* ── Practice: feedback, stored explanation, AI follow-up — all for THIS question ── */}
      {showReveal && feedback && (
        <div className="space-y-3" aria-live="polite">
          <div
            role="status"
            className={`flex items-center gap-2 rounded-xl border p-3 text-[14px] font-bold ${
              feedback.isCorrect
                ? "border-green-300 bg-green-50 text-green-900"
                : "border-red-300 bg-red-50 text-red-900"
            }`}>
            {feedback.isCorrect ? <CheckCircle2 size={18} aria-hidden="true" /> : <XCircle size={18} aria-hidden="true" />}
            {feedback.isCorrect
              ? "Correct! Well done."
              : `Not quite. The correct answer is ${feedback.correctLabel}.`}
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-4" role="note">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-green-900">
              <Sparkles size={13} aria-hidden="true" />
              Explanation
            </p>
            {currentQuestion.explanation ? (
              <MarkdownContent text={currentQuestion.explanation} className="!text-[14px] !leading-relaxed" />
            ) : (
              <p className="text-[13px] text-gray-700">
                No explanation is stored for this question yet — use “Explain with Sabi” below.
              </p>
            )}
          </div>

          <ExplainWithAiButton
            key={currentQuestion.sessionQuestionId ?? currentQuestion.id}
            questionText={currentQuestion.text}
            request={requestExplanation}
            label={currentQuestion.explanation ? "Explain more with Sabi" : "Explain with Sabi"}
          />
        </div>
      )}
    </div>
  );
};

export default Options;
