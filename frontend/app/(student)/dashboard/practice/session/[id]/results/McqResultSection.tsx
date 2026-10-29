"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Sparkles, CircleDot, CircleSlash } from "lucide-react";
import { Question } from "@/lib/constants/mcq";
import { McqSubject } from "@/lib/session/deriveMcqSubjects";
import MarkdownContent from "@/Components/shared/MarkdownContent";
import ExplainWithAiButton from "@/Components/shared/ExplainWithAiButton";
import { explainMcqQuestion } from "@/lib/api/aiExplain";

export interface McqSubjectResult {
  subject: McqSubject;
  questions: Question[];
  selected: (string | null)[];
}

interface Props {
  /** Exam mode shows score and percentage; Practice is a learning review with no formal score. */
  showScores: boolean;
  correct: number;
  total: number;
  percentage: number;
  subjects: McqSubjectResult[];
}

export default function McqResultSection({ showScores, correct, total, percentage, subjects }: Props) {
  // The open question is identified by its STABLE session-question id, not an array index.
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const activeData = (() => {
    if (!activeKey) return null;
    for (const subj of subjects) {
      const index = subj.questions.findIndex((q) => (q.sessionQuestionId ?? String(q.id)) === activeKey);
      if (index !== -1) return { subj, question: subj.questions[index], selected: subj.selected[index], index };
    }
    return null;
  })();

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" aria-labelledby="mcq-results-heading">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <CircleDot size={18} className="text-blue-700" aria-hidden="true" />
          </div>
          <h3 id="mcq-results-heading" className="text-[16px] font-bold text-gray-900">
            Objective (MCQ)
          </h3>
        </div>
        {showScores && (
          <div className="text-right">
            <p className="text-[22px] font-extrabold text-gray-900 leading-none">
              {correct}
              <span className="text-gray-600 text-base font-semibold">/{total}</span>
            </p>
            <p className="text-[12px] font-bold text-blue-700">{percentage}%</p>
          </div>
        )}
      </div>

      {subjects.map((subj) => (
        <div key={subj.subject.id} className="mb-5">
          <p className="text-[12px] font-bold text-gray-700 uppercase tracking-wide mb-2.5">{subj.subject.name}</p>
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
            {subj.questions.map((q, i) => {
              const key = q.sessionQuestionId ?? String(q.id);
              const sel = subj.selected[i];
              const isCorrect = !!sel && sel === q.correctAnswer;
              const isActive = activeKey === key;
              const state = isCorrect ? "correct" : sel ? "wrong" : "unanswered";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveKey(key)}
                  aria-pressed={isActive}
                  aria-label={`Question ${i + 1}, ${state}`}
                  className={`h-10 w-10 rounded-md text-[13px] font-extrabold flex items-center justify-center transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900 ${
                    isCorrect
                      ? "bg-green-700 text-white"
                      : sel
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-800"
                  } ${isActive ? "ring-2 ring-offset-2 ring-gray-900" : "hover:opacity-80"}`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 text-[12px] text-gray-700 mb-1 mt-2">
        <span className="flex items-center gap-1.5"><CheckCircle2 size={13} aria-hidden="true" /> Correct</span>
        <span className="flex items-center gap-1.5"><XCircle size={13} aria-hidden="true" /> Wrong</span>
        <span className="flex items-center gap-1.5"><CircleSlash size={13} aria-hidden="true" /> Unanswered</span>
      </div>

      {/* Detail for the chosen question — everything below belongs to THIS question only */}
      {activeData && (
        <div key={activeKey} className="mt-5 pt-5 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-extrabold text-gray-900">
              {activeData.subj.subject.name} — Question {activeData.index + 1}
            </p>
            {activeData.selected && activeData.selected === activeData.question.correctAnswer ? (
              <span className="flex items-center gap-1 text-[12px] font-bold text-green-800">
                <CheckCircle2 size={14} aria-hidden="true" /> Correct
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[12px] font-bold text-red-700">
                <XCircle size={14} aria-hidden="true" /> {activeData.selected ? "Wrong" : "Unanswered"}
              </span>
            )}
          </div>
          <p className="text-[14px] text-gray-900 mb-3">{activeData.question.text}</p>
          <div className="space-y-2 mb-3">
            {activeData.question.options.map((text, idx) => {
              const letter = String.fromCharCode(65 + idx); // A, B, C, … for however many options exist
              const isCorrectOpt = letter === activeData.question.correctAnswer;
              const isYourPick = letter === activeData.selected;
              return (
                <div
                  key={letter}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border text-[13px] ${
                    isCorrectOpt ? "border-green-700 bg-green-50" : isYourPick ? "border-red-500 bg-red-50" : "border-gray-200"
                  }`}>
                  <span className="font-bold text-gray-800 w-4">{letter}.</span>
                  <span className="flex-1 text-gray-900">{text}</span>
                  {isCorrectOpt && (
                    <>
                      <CheckCircle2 size={15} className="text-green-700 shrink-0" aria-hidden="true" />
                      <span className="sr-only">Correct answer</span>
                    </>
                  )}
                  {isYourPick && !isCorrectOpt && (
                    <>
                      <XCircle size={15} className="text-red-600 shrink-0" aria-hidden="true" />
                      <span className="sr-only">Your answer</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-[11px] font-bold text-green-900 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Sparkles size={13} aria-hidden="true" /> Explanation
            </p>
            {activeData.question.explanation ? (
              <MarkdownContent text={activeData.question.explanation} className="!text-[13px] !leading-relaxed" />
            ) : (
              <p className="text-[13px] text-gray-800">
                No explanation is stored for this question yet — use “Explain with Sabi” below.
              </p>
            )}
          </div>

          {activeData.question.questionId && (
            <div className="mt-3">
              <ExplainWithAiButton
                key={activeKey}
                questionText={activeData.question.text}
                label={activeData.question.explanation ? "Explain more with Sabi" : "Explain with Sabi"}
                request={async () =>
                  (await explainMcqQuestion(activeData.question.questionId!, activeData.selected ?? undefined, "standard"))
                    .explanation
                }
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
