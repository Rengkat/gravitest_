"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Sparkles, CircleDot } from "lucide-react";
import { Question } from "@/lib/constants/mcq";
import { McqSubject } from "@/lib/session/deriveMcqSubjects";

export interface McqSubjectResult {
  subject: McqSubject;
  questions: Question[];
  selected: (string | null)[];
}

interface Props {
  correct: number;
  total: number;
  percentage: number;
  subjects: McqSubjectResult[];
  onAskSabi?: (question: Question, selectedLabel: string | null) => void;
}

export default function McqResultSection({
  correct,
  total,
  percentage,
  subjects,
  onAskSabi,
}: Props) {
  // { subjectId, index } of the question currently expanded below the grid
  const [active, setActive] = useState<{ subjectId: string; index: number } | null>(null);

  const activeData =
    active &&
    (() => {
      const subj = subjects.find((s) => s.subject.id === active.subjectId);
      if (!subj) return null;
      return {
        subj,
        question: subj.questions[active.index],
        selected: subj.selected[active.index],
      };
    })();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <CircleDot size={18} className="text-blue-600" />
          </div>
          <h3 className="text-[16px] font-bold text-gray-800">Objective (MCQ)</h3>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-extrabold text-gray-800 leading-none">
            {correct}
            <span className="text-gray-400 text-base font-semibold">/{total}</span>
          </p>
          <p className="text-[12px] font-bold text-blue-600">{percentage}%</p>
        </div>
      </div>

      {subjects.map((subj) => (
        <div key={subj.subject.id} className="mb-5">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2.5">
            {subj.subject.name}
          </p>
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
            {subj.questions.map((q, i) => {
              const sel = subj.selected[i];
              const isCorrect = sel === q.correctAnswer;
              const isActive = active?.subjectId === subj.subject.id && active?.index === i;
              return (
                <button
                  key={q.id}
                  onClick={() => setActive({ subjectId: subj.subject.id, index: i })}
                  title={`Question ${i + 1}`}
                  className={`h-10 w-10 rounded-md text-[12px] font-bold flex items-center justify-center transition-all ${
                    isCorrect
                      ? "bg-green-600 text-white"
                      : sel
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 text-gray-400"
                  } ${isActive ? "ring-2 ring-offset-2 ring-gray-800" : "hover:opacity-80"}`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 text-[11px] text-gray-500 mb-1 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-600 inline-block" /> Correct
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-500 inline-block" /> Wrong
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Unanswered
        </span>
      </div>

      {/* Detail panel for the clicked question */}
      {activeData && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-gray-800">
              {activeData.subj.subject.name} — Question{" "}
              {activeData.subj.questions.indexOf(activeData.question) + 1}
            </p>
            {activeData.selected === activeData.question.correctAnswer ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-green-700">
                <CheckCircle2 size={14} /> Correct
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold text-red-600">
                <XCircle size={14} /> Wrong
              </span>
            )}
          </div>
          <p className="text-[14px] text-gray-700 mb-3">{activeData.question.text}</p>
          <div className="space-y-2 mb-3">
            {(["A", "B", "C", "D"] as const).map((letter, idx) => {
              const isCorrectOpt = letter === activeData.question.correctAnswer;
              const isYourPick = letter === activeData.selected;
              return (
                <div
                  key={letter}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border text-[13px] ${
                    isCorrectOpt
                      ? "border-green-600 bg-green-50"
                      : isYourPick
                        ? "border-red-400 bg-red-50"
                        : "border-gray-100"
                  }`}>
                  <span className="font-bold text-gray-600 w-4">{letter}.</span>
                  <span className="flex-1 text-gray-700">{activeData.question.options[idx]}</span>
                  {isCorrectOpt && <CheckCircle2 size={15} className="text-green-600 shrink-0" />}
                  {isYourPick && !isCorrectOpt && (
                    <XCircle size={15} className="text-red-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
          {activeData.question.explanation && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-[11px] font-bold text-green-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Sparkles size={13} /> Explanation
              </p>
              <p className="text-[13px] text-gray-700 leading-relaxed mb-3">
                {activeData.question.explanation}
              </p>
              <button
                onClick={() => onAskSabi?.(activeData.question, activeData.selected)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-700 text-white text-[12px] font-bold hover:bg-green-800 transition-colors">
                <Sparkles size={13} />
                Ask Sabi-AI for more detail
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
