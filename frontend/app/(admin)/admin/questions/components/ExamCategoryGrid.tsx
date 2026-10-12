"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, GraduationCap, Briefcase, Loader2 } from "lucide-react";
import type { ExamType } from "@/types/questions";
import {
  EXAM_CONFIG,
  EXAM_LABELS,
  MCQ_ONLY_EXAMS,
  SECONDARY_EXAM_TYPES,
  PROFESSIONAL_EXAM_TYPES,
  formatNumber,
} from "@/utils/config";
import * as adminApi from "@/lib/api/admin-dashboard";

// Per-format mini-stats, per-exam "years covered"/"avg quality score",
// and subject lists used to come from a hardcoded mock with invented
// numbers. The backend's /questions/stats only gives flat, global
// byExamType/bySubject/byType breakdowns (no cross-tabulation), so this
// now shows real totals per exam type — no fabricated year-coverage or
// quality-score metrics that have no backend source.
export default function ExamCategoryGrid() {
  const [expandedExam, setExpandedExam] = useState<ExamType | null>(null);
  const [stats, setStats] = useState<adminApi.QuestionBankStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getQuestionBankStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={22} className="animate-spin text-green-700" />
      </div>
    );
  }

  if (!stats) return null;

  const categories: { id: "secondary" | "professional"; name: string; examTypes: ExamType[] }[] = [
    { id: "secondary", name: "Secondary School", examTypes: SECONDARY_EXAM_TYPES },
    { id: "professional", name: "Professional Exams", examTypes: PROFESSIONAL_EXAM_TYPES },
  ];

  return (
    <div className="mb-8">
      <h2 className="font-serif text-xl text-green-900 mb-4">Exam Categories</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((category) => {
          const CatIcon = category.id === "secondary" ? GraduationCap : Briefcase;
          const catGrad =
            category.id === "secondary"
              ? "from-green-500 to-emerald-600"
              : "from-purple-500 to-violet-600";
          const categoryTotal = category.examTypes.reduce(
            (sum, et) => sum + (stats.byExamType[et] ?? 0),
            0,
          );

          return (
            <div
              key={category.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-r ${catGrad} p-5`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <CatIcon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-white">{category.name}</h3>
                    <p className="text-[12px] text-white/70">
                      {category.examTypes.length} exam types · {formatNumber(categoryTotal)} questions
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 space-y-1">
                {category.examTypes.map((examType) => {
                  const label = EXAM_LABELS[examType];
                  const cfg = EXAM_CONFIG[examType];
                  const Icon = cfg.icon;
                  const isExpanded = expandedExam === examType;
                  const count = stats.byExamType[examType] ?? 0;

                  return (
                    <div key={examType}>
                      <button
                        onClick={() => setExpandedExam(isExpanded ? null : examType)}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all ${
                          isExpanded
                            ? "bg-green-50 border border-green-100"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${cfg.color}18` }}>
                            <Icon size={17} style={{ color: cfg.color }} />
                          </div>
                          <div className="text-left">
                            <div className="text-[14px] font-semibold text-green-900">
                              {label.name}
                              {MCQ_ONLY_EXAMS.has(examType) && (
                                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                  MCQ Only
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500">{label.fullName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[13px] font-bold text-green-900">
                            {formatNumber(count)}
                          </span>
                          <ChevronRight
                            size={15}
                            className={`text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mx-3 mb-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-[13px] text-gray-600 mb-3">
                            {formatNumber(count)} question{count === 1 ? "" : "s"} in the bank for{" "}
                            {label.name}.
                          </p>
                          <Link
                            href={`/admin/questions/${examType}`}
                            className="block w-full py-2 rounded-lg bg-green-800 text-white text-[13px] font-semibold hover:bg-green-700 transition-colors text-center">
                            Browse {label.name} Questions →
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
