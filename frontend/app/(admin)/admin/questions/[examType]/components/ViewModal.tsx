"use client";

import { X, CheckCircle2 } from "lucide-react";
import type { Question } from "@/types/questions";
import { TYPE_CONFIG, DIFFICULTY_CONFIG, MCQ_ONLY_EXAMS, CANDIDATE_TYPE_CONFIG } from "@/utils/config";
import { subjectLabel } from "@/lib/constants/subjects";

export function ViewModal({ question: q, onClose }: { question: Question; onClose: () => void }) {
  const typeCfg = TYPE_CONFIG[q.type];
  const diffCfg = DIFFICULTY_CONFIG[q.difficulty];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${typeCfg.bg} border ${typeCfg.border}`} style={{ color: typeCfg.color }}>
              {typeCfg.label}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${diffCfg.bg} border ${diffCfg.border}`} style={{ color: diffCfg.color }}>
              {diffCfg.label}
            </span>
            <span className="text-[12px] text-text-muted">
              {subjectLabel(q.subject)} · {q.year}
            </span>
            {q.candidateType && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {CANDIDATE_TYPE_CONFIG[q.candidateType].label} only
              </span>
            )}
          </div>
          <button title="close" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {q.questionImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.questionImageUrl} alt="" className="w-full rounded-xl mb-4 border border-gray-100" />
        )}

        <p className="text-[16px] text-green-900 leading-relaxed mb-5 whitespace-pre-line">
          {q.questionText}
        </p>

        {q.options && q.options.length > 0 && (
          <div className="space-y-2 mb-5">
            {q.options.map((opt) => {
              const isCorrect = q.answer?.correctLabel === opt.label;
              return (
                <div
                  key={opt.label}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isCorrect ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-100"
                  }`}>
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0 ${
                      isCorrect ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-500"
                    }`}>
                    {opt.label}
                  </span>
                  <span className="text-[14px] text-green-900 flex-1">{opt.text}</span>
                  {isCorrect && <CheckCircle2 size={16} className="text-green-600 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}

        {q.modelAnswer && (
          <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-1.5">
              Model Answer / Mark Scheme
            </p>
            <p className="text-[14px] text-blue-900 whitespace-pre-line">{q.modelAnswer}</p>
          </div>
        )}

        {q.explanations && q.explanations.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Explanations</p>
            {q.explanations.map((exp, i) => (
              <div key={i} className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-[13px] text-amber-900">
                {exp.text}
              </div>
            ))}
          </div>
        )}

        {q.topic && (
          <p className="text-[12px] text-text-muted mt-4">
            <span className="font-semibold">Topic:</span> {q.topic}
          </p>
        )}
        {q.maxScore && (
          <p className="text-[12px] text-text-muted mt-1">
            <span className="font-semibold">Max Score:</span> {q.maxScore}
          </p>
        )}
      </div>
    </div>
  );
}
