"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  FilterX,
  ChevronRight,
  Home,
  Loader2,
  AlertTriangle,
  Check,
  UserCheck,
  UserX,
  Trash2,
  X,
} from "lucide-react";
import type { ExamType, Question } from "@/types/questions";
import {
  EXAM_CONFIG,
  EXAM_LABELS,
  TYPE_CONFIG,
  DIFFICULTY_CONFIG,
  MCQ_ONLY_EXAMS,
  CANDIDATE_TYPE_CONFIG,
  isCandidateTypeExam,
} from "@/utils/config";
import { ALL_SUBJECTS } from "@/lib/constants/subjects";
import { useExamQuestions } from "./useExamQuestions";
import { QuestionRow } from "./components/QuestionRow";
import { ViewModal } from "./components/ViewModal";
import { EditModal } from "./components/EditModal";

// This page used to be 3 separate nested route levels (exam type → year
// → subject), each with its own copy of the table and its own
// hardcoded mock data, and none of it called the real API. Consolidated
// into one page: year/subject/difficulty/type/status are now filters on
// a single real, paginated, fully-CRUD table — a cleaner and more
// capable admin experience than click-through navigation, and one that
// can actually be built on what GET /questions really supports
// (flat filtering, no precomputed nested counts).
export default function ExamQuestionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const examType = params.examType as ExamType;
  const cfg = EXAM_CONFIG[examType];
  const label = EXAM_LABELS[examType];

  const {
    questions,
    total,
    totalPages,
    page,
    setPage,
    loading,
    error,
    filters,
    setFilters,
    selected,
    toggleSelect,
    clearSelection,
    selectAll,
    togglePublish,
    duplicate,
    remove,
    bulkActivate,
    bulkDelete,
    refresh,
  } = useExamQuestions(examType, {
    year: searchParams.get("year") ?? "",
    subject: searchParams.get("subject") ?? "",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [viewing, setViewing] = useState<Question | null>(null);
  const [editing, setEditing] = useState<Question | null>(null);
  const [bulkBusy, setBulkBusy] = useState<string | null>(null);

  if (!cfg || !label) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center text-text-muted">
        Unknown exam type &quot;{examType}&quot;.
      </div>
    );
  }

  const Icon = cfg.icon;
  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== "searchQuery" && v !== "" && !(k === "candidateType" && v === "all"),
  ).length;

  async function runBulk(action: string, fn: () => Promise<void>) {
    setBulkBusy(action);
    try {
      await fn();
    } finally {
      setBulkBusy(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px] mb-6">
        <Link href="/admin/questions" className="text-gray-400 hover:text-green-700 flex items-center gap-1">
          <Home size={13} /> Question Bank
        </Link>
        <ChevronRight size={13} className="text-gray-300" />
        <span className="text-green-800 font-semibold">{label.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cfg.bg} flex items-center justify-center`}>
            <Icon size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-green-900">{label.name} Questions</h1>
            <p className="text-[13px] text-text-muted">{label.fullName}</p>
          </div>
        </div>
        <Link
          href={`/admin/questions/create?examType=${examType}`}
          className="flex items-center gap-2 px-5 py-3 bg-green-800 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl font-semibold text-sm">
          <Plus size={18} /> Add Question
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border p-4 mb-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search question text…"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-[14px] font-medium ${
                showFilters || activeFilterCount > 0
                  ? "bg-green-800 text-white border-green-800"
                  : "bg-white text-text-muted border-gray-200 hover:border-green-800/30"
              }`}>
              <Filter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-yellow-400 text-green-900 text-[11px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters({ ...filters, candidateType: "all", year: "", subject: "", topic: "", type: "", difficulty: "", status: "" })}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all text-[14px] font-medium">
                <FilterX size={16} /> Clear
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            {isCandidateTypeExam(examType) && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">
                  Candidate Type
                </label>
                <select
                  title="candidate type"
                  value={filters.candidateType}
                  onChange={(e) => setFilters({ ...filters, candidateType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none">
                  <option value="all">All (School &amp; Private)</option>
                  {(Object.keys(CANDIDATE_TYPE_CONFIG) as (keyof typeof CANDIDATE_TYPE_CONFIG)[]).map(
                    (ct) => (
                      <option key={ct} value={ct}>
                        {CANDIDATE_TYPE_CONFIG[ct].label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Year</label>
              <input
                type="number"
                placeholder="e.g. 2023"
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Subject</label>
              <select
                title="subject"
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none">
                <option value="">All Subjects</option>
                {ALL_SUBJECTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Type</label>
              <select
                title="type"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none">
                <option value="">All Types</option>
                {(MCQ_ONLY_EXAMS.has(examType)
                  ? [["mcq", TYPE_CONFIG.mcq]]
                  : Object.entries(TYPE_CONFIG)
                ).map(([k, c]: any) => (
                  <option key={k} value={k}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Difficulty</label>
              <select
                title="difficulty"
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none">
                <option value="">All Levels</option>
                {Object.entries(DIFFICULTY_CONFIG).map(([k, c]) => (
                  <option key={k} value={k}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Status</label>
              <select
                title="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none">
                <option value="">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        )}

        <p className="text-[13px] text-text-muted mt-3">
          Showing <span className="font-semibold text-green-900">{total.toLocaleString()}</span> question
          {total === 1 ? "" : "s"}
        </p>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mb-4 p-4 rounded-2xl bg-green-800 text-white flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Check size={18} />
            <span className="text-[14px] font-semibold">{selected.size} selected</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => runBulk("activate", () => bulkActivate(true))}
              disabled={bulkBusy !== null}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-[13px] font-medium disabled:opacity-50">
              {bulkBusy === "activate" ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
              Activate
            </button>
            <button
              onClick={() => runBulk("deactivate", () => bulkActivate(false))}
              disabled={bulkBusy !== null}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 transition-colors text-[13px] font-medium disabled:opacity-50">
              {bulkBusy === "deactivate" ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
              Deactivate
            </button>
            <button
              onClick={() => runBulk("delete", bulkDelete)}
              disabled={bulkBusy !== null}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/30 hover:bg-red-500/50 transition-colors text-[13px] font-medium disabled:opacity-50">
              {bulkBusy === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </button>
            <button
              onClick={clearSelection}
              className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-[13px] font-medium">
              <X size={14} /> Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-green-800" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <AlertTriangle size={28} className="mx-auto mb-3 text-red-400" />
          <p className="text-text-muted">Couldn&apos;t load questions ({error}).</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 text-text-muted text-[14px]">
          No questions match your current filters.
        </div>
      ) : (
        <>
          {questions.length > 0 && (
            <div className="flex items-center gap-3 mb-3 text-[13px] text-text-muted">
              <input
                title="select all"
                type="checkbox"
                checked={selected.size === questions.length}
                onChange={() => (selected.size === questions.length ? clearSelection() : selectAll())}
                className="w-4 h-4 rounded border-gray-300 text-green-800"
              />
              <span>{selected.size > 0 ? `${selected.size} selected` : "Select all on this page"}</span>
            </div>
          )}
          <div className="space-y-3">
            {questions.map((q) => (
              <QuestionRow
                key={q.id}
                question={q}
                isSelected={selected.has(q.id)}
                onToggleSelect={toggleSelect}
                onView={() => setViewing(q)}
                onEdit={() => setEditing(q)}
                onTogglePublish={() => togglePublish(q)}
                onDuplicate={() => duplicate(q.id)}
                onDelete={() => remove(q.id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg border border-gray-200 text-[13px] disabled:opacity-40">
                Previous
              </button>
              <span className="text-[13px] text-text-muted px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-200 text-[13px] disabled:opacity-40">
                Next
              </button>
            </div>
          )}
        </>
      )}

      {viewing && <ViewModal question={viewing} onClose={() => setViewing(null)} />}
      {editing && (
        <EditModal
          question={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
