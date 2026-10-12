"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, PenLine, Sparkles, BookOpen } from "lucide-react";
import { AIResult, SubQuestion } from "@/types/examsTypes";

export interface TheoryQuestionResult {
  id: number | string;
  title: string;
  marksGot: number;
  marksTotal: number;
  subQuestions: { sub: SubQuestion; result?: AIResult }[];
}

interface Props {
  totalScore: number;
  maxScore: number;
  percentage: number;
  questions: TheoryQuestionResult[];
}

function bandColor(pct: number) {
  if (pct >= 70) return "bg-green-600 text-white";
  if (pct >= 50) return "bg-amber-500 text-white";
  return "bg-red-500 text-white";
}

export default function TheoryResultSection({ totalScore, maxScore, percentage, questions }: Props) {
  const [activeId, setActiveId] = useState<number | string | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState<Record<string, boolean>>({});

  const active = questions.find((q) => q.id === activeId);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
            <PenLine size={18} className="text-violet-600" />
          </div>
          <h3 className="text-[16px] font-bold text-gray-800">Theory / Practical</h3>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-extrabold text-gray-800 leading-none">
            {totalScore}
            <span className="text-gray-400 text-base font-semibold">/{maxScore}</span>
          </p>
          <p className="text-[12px] font-bold text-violet-600">{percentage}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
        {questions.map((q) => {
          const pct = q.marksTotal ? Math.round((q.marksGot / q.marksTotal) * 100) : 0;
          const isActive = activeId === q.id;
          return (
            <button
              key={q.id}
              onClick={() => setActiveId(q.id)}
              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${isActive ? "border-gray-800" : "border-gray-100 hover:border-gray-200"}`}>
              <span className="text-[13px] font-semibold text-gray-700">Question {q.id}</span>
              <span className={`text-[12px] font-bold px-2.5 py-1 rounded-md ${bandColor(pct)}`}>
                {q.marksGot}/{q.marksTotal} · {pct}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      {active && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-[13px] font-bold text-gray-800 mb-3">
            Question {active.id} — {active.title}
          </p>
          <div className="space-y-4">
            {active.subQuestions.map(({ sub, result }) => (
              <div key={sub.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold text-gray-600">{sub.label}</span>
                  {result && (
                    <span className="text-[12px] font-bold text-gray-800">
                      {result.score}/{result.maxScore}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-gray-700 mb-3">{sub.text}</p>

                {result ? (
                  <>
                    {result.feedback && (
                      <p className="text-[12px] text-gray-600 leading-relaxed mb-2">
                        {result.feedback}
                      </p>
                    )}
                    {result.strengths?.length > 0 && (
                      <ul className="mb-2 space-y-1">
                        {result.strengths.map((s, i) => (
                          <li key={i} className="flex gap-2 text-[11px] text-gray-600">
                            <span className="text-green-600 shrink-0">✓</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                    {result.improvements?.length > 0 && (
                      <ul className="mb-2 space-y-1">
                        {result.improvements.map((s, i) => (
                          <li key={i} className="flex gap-2 text-[11px] text-gray-600">
                            <span className="text-orange-500 shrink-0">→</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                    {sub.modelAnswer && (
                      <div>
                        <button
                          onClick={() =>
                            setShowModelAnswer((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }))
                          }
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-green-800">
                          <BookOpen size={12} />
                          {showModelAnswer[sub.id] ? "Hide Model Answer" : "Show Model Answer"}
                          {showModelAnswer[sub.id] ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          )}
                        </button>
                        {showModelAnswer[sub.id] && (
                          <pre className="mt-2 text-[12px] text-gray-700 whitespace-pre-wrap font-sans bg-white p-3 rounded-lg border border-gray-200">
                            {sub.modelAnswer}
                          </pre>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[12px] text-gray-400 flex items-center gap-1.5">
                    <Sparkles size={12} /> Not scored.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
