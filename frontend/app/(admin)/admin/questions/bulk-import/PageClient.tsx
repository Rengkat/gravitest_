"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Download,
  ChevronDown,
  FileSpreadsheet,
  PenLine,
  Sparkles,
} from "lucide-react";
import type { ExamType, CandidateType, QuestionType, DifficultyLevel } from "@/types/questions";
import { EXAM_LABELS, DIFFICULTY_CONFIG, TYPE_CONFIG, CANDIDATE_TYPE_CONFIG, isCandidateTypeExam } from "@/utils/config";
import { ALL_SUBJECTS } from "@/lib/constants/subjects";
import * as questionsApi from "@/lib/api/questions";
import { extractErrorMessage } from "@/lib/api/client";

// ─── CSV helpers ────────────────────────────────────────────────────────────
// Every template below is built from arrays run through these two helpers
// instead of hand-typed comma strings. That matters most for the essay
// template, where the `structure` column holds a JSON string full of its
// own commas and quotes — hand-typing that as a CSV literal is exactly how
// you end up with a file that silently misaligns columns. This guarantees
// RFC4180-correct output that matches what
// BulkImportParserProvider.tokenizeCsv() on the backend expects to read
// back (quote the field, double any internal quotes, only when needed).
function csvField(value: string | number): string {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(fields: (string | number)[]): string {
  return fields.map(csvField).join(",");
}

function buildCsv(header: string[], rows: (string | number)[][]): string {
  return [csvRow(header), ...rows.map(csvRow)].join("\n");
}

// ─── MCQ / objective / true-false template ─────────────────────────────────
// Column names below are exactly the aliases BulkImportParserProvider's
// COLUMN_ALIASES recognizes (case/space/underscore-insensitive) — nothing
// here is decorative. Six example rows spanning three different exam
// bodies (WAEC, NECO, ICAN) so it's clear examType/subject/type can be
// set per-row and don't have to match whatever's picked in "Shared
// defaults" above. Rows 2–3 share one passageText+passageTitle to show
// how a comprehension set groups into a single Passage automatically.
// `candidateType` is only meaningful for WAEC/NECO/NABTEB/BECE/Junior
// NECO ("school"/"internal" or "private"/"external") — leave it blank
// to apply to both streams, which is what most rows should do. Rows 4–5
// show it actually being set, since ICAN (row 6) has no such distinction.
const MCQ_TEMPLATE_HEADER = [
  "examType",
  "candidateType",
  "subject",
  "year",
  "difficulty",
  "type",
  "questionText",
  "questionImageUrl",
  "optionA",
  "optionAImage",
  "optionB",
  "optionBImage",
  "optionC",
  "optionCImage",
  "optionD",
  "optionDImage",
  "correctLabel",
  "explanation",
  "explanationImageUrl",
  "topic",
  "passageText",
  "passageTitle",
];

function buildMcqCsvTemplate(): string {
  const sharedPassage =
    "Paste the shared WAEC comprehension passage here — every row using the same passageText + passageTitle for this exam/subject/year gets grouped into one Passage automatically.";

  const rows: (string | number)[][] = [
    // WAEC — standalone MCQ (candidateType left blank = applies to both)
    [
      "waec",
      "",
      "mathematics",
      2023,
      "medium",
      "mcq",
      "A trader bought 120 oranges for ₦3,600 and sold them at ₦40 each. What is the percentage profit?",
      "",
      "25%",
      "",
      "30%",
      "",
      "33⅓%",
      "",
      "40%",
      "",
      "C",
      "Cost price per orange = ₦30, selling price = ₦40, profit = ₦10 → (10/30)×100 = 33⅓%.",
      "",
      "Percentages",
      "",
      "",
    ],
    // WAEC — comprehension pair, row 1 of 2 (shares passage with next row)
    [
      "waec",
      "",
      "english",
      2023,
      "medium",
      "mcq",
      "According to the passage, what was the writer's main reason for returning to the village?",
      "",
      "To attend a wedding",
      "",
      "To visit his ailing grandmother",
      "",
      "To sell his father's farmland",
      "",
      "To campaign for local office",
      "",
      "B",
      "The second paragraph states he travelled home on hearing his grandmother had fallen ill.",
      "",
      "Comprehension",
      sharedPassage,
      "Passage 1",
    ],
    // WAEC — comprehension pair, row 2 of 2 (same passageText + passageTitle as above)
    [
      "waec",
      "",
      "english",
      2023,
      "medium",
      "mcq",
      'The phrase "a knot tightened in his chest" as used in the passage is an example of which literary device?',
      "",
      "Simile",
      "",
      "Metaphor",
      "",
      "Hyperbole",
      "",
      "Onomatopoeia",
      "",
      "B",
      'It compares an emotion to a physical sensation without using "like" or "as", which is metaphor.',
      "",
      "Comprehension",
      sharedPassage,
      "Passage 1",
    ],
    // NECO — true/false, tagged private-candidate-only (demonstrates the column actually being set)
    [
      "neco",
      "private",
      "civic_education",
      2022,
      "easy",
      "true_false",
      "The Independent National Electoral Commission (INEC) is responsible for conducting local government elections in all 36 states.",
      "",
      "True",
      "",
      "False",
      "",
      "",
      "",
      "",
      "",
      "B",
      "INEC conducts federal and state elections; local government elections are conducted by each state's Independent Electoral Commission (SIEC).",
      "",
      "Elections",
      "",
      "",
    ],
    // NECO — standard MCQ, tagged school-candidate-only (demonstrates the column actually being set)
    [
      "neco",
      "school",
      "economics",
      2023,
      "medium",
      "mcq",
      "Which of the following best describes an economy where the government makes all decisions on production, pricing and distribution?",
      "",
      "Free market economy",
      "",
      "Mixed economy",
      "",
      "Command economy",
      "",
      "Traditional economy",
      "",
      "C",
      "A command economy is centrally planned and controlled by the government.",
      "",
      "Economic systems",
      "",
      "",
    ],
    // ICAN — objective (professional-body variant of MCQ). candidateType left
    // blank since ICAN has no school/private candidate distinction.
    [
      "ican",
      "",
      "financial_accounting",
      2023,
      "hard",
      "objective",
      "Under IFRS, which of the following is NOT one of the qualitative characteristics that enhance the usefulness of financial information?",
      "",
      "Comparability",
      "",
      "Verifiability",
      "",
      "Profitability",
      "",
      "Timeliness",
      "",
      "C",
      "The four enhancing qualitative characteristics under the IFRS Conceptual Framework are comparability, verifiability, timeliness and understandability — profitability is not one of them.",
      "",
      "Conceptual framework",
      "",
      "",
    ],
  ];

  return buildCsv(MCQ_TEMPLATE_HEADER, rows);
}

// ─── Essay / theory template ────────────────────────────────────────────────
// This is CSV, not JSON — the app's file input only reliably drives CSV
// through the bulk-import flow, so essay questions go through the same
// path as MCQ rows. The one field worth explaining is `structure`: it's a
// single CSV cell holding a JSON-stringified array that matches the
// backend's EssayPart shape exactly (src/questions/types/essay-part.interface.ts:
// { label, text?, imageUrl?, table?, maxScore?, children? }), parsed with
// JSON.parse() by BulkImportParserProvider and validated recursively via
// EssayPartDto. It's what gives you numbered sub-parts like 1 → (a) → (i),
// optional tables, and per-part marks. `structure` is entirely optional —
// row 1 below shows a plain essay question with no structure column at
// all, just a mark scheme in modelAnswer.
const ESSAY_TEMPLATE_HEADER = [
  "examType",
  "candidateType",
  "subject",
  "year",
  "difficulty",
  "type",
  "questionNumber",
  "questionText",
  "questionImageUrl",
  "maxScore",
  "modelAnswer",
  "structure",
  "topic",
];

function buildEssayCsvTemplate(): string {
  // WAEC — nested sub-parts plus a table, shown inline in part 1.
  const waecStructure = JSON.stringify([
    {
      label: "1",
      text: "The table below shows Nigeria's GDP growth rate for three consecutive years.",
      table: [
        ["Year", "GDP Growth (%)"],
        ["2021", "3.4"],
        ["2022", "3.1"],
        ["2023", "2.9"],
      ],
      maxScore: 20,
      children: [
        {
          label: "(a)",
          text: "State two possible reasons for the decline in GDP growth between 2021 and 2023.",
          maxScore: 8,
        },
        {
          label: "(b)",
          text: "Explain one fiscal policy the government could adopt to reverse this trend.",
          maxScore: 12,
        },
      ],
    },
  ]);

  // ICAN — two-level nesting (1 → (a)/(b) → (i)/(ii)), no table.
  const icanStructure = JSON.stringify([
    {
      label: "1",
      text: "ABC Nigeria Ltd's trial balance as at 31 December 2023 is provided below (attach the figures as a questionImageUrl, or describe them in questionText).",
      maxScore: 20,
      children: [
        {
          label: "(a)",
          text: "Prepare the Statement of Profit or Loss for the year ended 31 December 2023.",
          maxScore: 10,
        },
        {
          label: "(b)",
          text: "Prepare the Statement of Financial Position as at 31 December 2023.",
          maxScore: 10,
          children: [
            { label: "(i)", text: "Show non-current assets.", maxScore: 4 },
            { label: "(ii)", text: "Show current assets and liabilities.", maxScore: 6 },
          ],
        },
      ],
    },
  ]);

  const rows: (string | number)[][] = [
    // NECO — plain essay, no structure column, just a mark scheme.
    // candidateType left blank = applies to both streams.
    [
      "neco",
      "",
      "history",
      2022,
      "hard",
      "theory",
      "1",
      "Discuss the causes and effects of the Nigerian Civil War (1967-1970).",
      "",
      20,
      "Causes (10 marks): military coups of 1966, ethnic distrust, Biafran secession. Effects (10 marks): loss of lives, economic disruption, post-war reconciliation policy (the 3Rs).",
      "",
      "Nigerian history",
    ],
    // WAEC — nested structure with a table, tagged school-candidate-only
    // (demonstrates the column actually being set)
    [
      "waec",
      "school",
      "economics",
      2023,
      "hard",
      "theory",
      "1",
      "Study the table below on Nigeria's GDP growth and answer the questions that follow.",
      "",
      20,
      "",
      waecStructure,
      "Economic growth",
    ],
    // ICAN — nested structure, no table. candidateType left blank since
    // ICAN has no school/private candidate distinction.
    [
      "ican",
      "",
      "financial_accounting",
      2023,
      "hard",
      "theory",
      "1",
      "ABC Nigeria Ltd's trial balance as at 31 December 2023 is provided below.",
      "",
      20,
      "",
      icanStructure,
      "Financial statements",
    ],
  ];

  return buildCsv(ESSAY_TEMPLATE_HEADER, rows);
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function TemplateDownloadMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function chooseMcq(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(false);
    downloadBlob(
      buildMcqCsvTemplate(),
      "gravitest-mcq-question-import-template.csv",
      "text/csv;charset=utf-8;",
    );
  }

  function chooseEssay(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(false);
    downloadBlob(
      buildEssayCsvTemplate(),
      "gravitest-theory-question-import-template.csv",
      "text/csv;charset=utf-8;",
    );
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded-lg px-3 py-1.5 transition-all">
        <Download size={14} />
        Download template
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-1.5 w-72 rounded-xl border border-gray-100 bg-white shadow-lg py-1.5 overflow-hidden">
          <p className="px-3 py-1.5 text-[11px] text-text-muted border-b border-gray-100">
            Both are CSV files with sample rows from WAEC, NECO and ICAN, including a{" "}
            <code className="px-1 py-0.5 rounded bg-gray-100">candidateType</code> column for
            school/private-specific papers — edit or delete the examples, keep the header row.
          </p>
          <button
            type="button"
            onClick={chooseMcq}
            className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-all">
            <FileSpreadsheet size={16} className="text-green-700 mt-0.5 shrink-0" />
            <span>
              <span className="block text-[13px] font-medium text-green-900">
                MCQ / Objective / True-False
              </span>
              <span className="block text-[11px] text-text-muted">
                Options, correct answer, optional comprehension passage
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={chooseEssay}
            className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-all">
            <PenLine size={16} className="text-green-700 mt-0.5 shrink-0" />
            <span>
              <span className="block text-[13px] font-medium text-green-900">Theory / Practical</span>
              <span className="block text-[11px] text-text-muted">
                Mark scheme, or numbered sub-parts (1 → (a) → (i)) with marks and tables
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function BulkImportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetExamType = (searchParams.get("examType") as ExamType) ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [defaults, setDefaults] = useState({
    examType: presetExamType,
    candidateType: "" as CandidateType | "",
    subject: "",
    year: new Date().getFullYear(),
    difficulty: "" as DifficultyLevel | "",
    type: "" as QuestionType | "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"preview" | "commit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<questionsApi.BulkImportResult | null>(null);
  const [committed, setCommitted] = useState<questionsApi.BulkImportResult | null>(null);

  const buildDefaults = () => ({
    examType: defaults.examType || undefined,
    candidateType: defaults.candidateType || undefined,
    subject: defaults.subject || undefined,
    year: defaults.year || undefined,
    difficulty: defaults.difficulty || undefined,
    type: defaults.type || undefined,
  });

  async function handlePreview() {
    if (!file) return;
    setBusy("preview");
    setError(null);
    setCommitted(null);
    try {
      const result = await questionsApi.bulkImportQuestionsFile(file, buildDefaults(), true);
      setPreview(result);
    } catch (err) {
      setError(extractErrorMessage(err));
      setPreview(null);
    } finally {
      setBusy(null);
    }
  }

  async function handleCommit() {
    if (!file) return;
    setBusy("commit");
    setError(null);
    try {
      const result = await questionsApi.bulkImportQuestionsFile(file, buildDefaults(), false);
      setCommitted(result);
      setPreview(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setCommitted(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const selectCls =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all bg-white";

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link
        href="/admin/questions"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-green-800 mb-6 no-underline">
        <ArrowLeft size={15} /> Back to Question Bank
      </Link>

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-green-100 rounded-xl">
            <Upload size={22} className="text-green-700" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-green-900">Bulk Import Questions</h1>
            <p className="text-[13px] text-text-muted">
              Upload a CSV file — comprehension sets and essay/theory structure both supported.
            </p>
          </div>
        </div>
        <TemplateDownloadMenu />
      </div>

      {committed ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-green-600" />
          </div>
          <h2 className="font-serif text-xl text-green-900 mb-1">Import complete</h2>
          <p className="text-[13px] text-text-muted mb-4">
            {committed.imported} question{committed.imported === 1 ? "" : "s"} imported
            {committed.passagesCreated
              ? `, ${committed.passagesCreated} passage${committed.passagesCreated === 1 ? "" : "s"} created`
              : ""}
            {committed.failed
              ? `, ${committed.failed} row${committed.failed === 1 ? "" : "s"} failed`
              : ""}
            . Imported questions land as drafts — review and publish them from the question bank.
          </p>
          {committed.errors.length > 0 && <ErrorList errors={committed.errors} />}
          <div className="flex gap-3 justify-center mt-5">
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[13px] font-semibold text-text-muted hover:bg-gray-50">
              Import Another File
            </button>
            <button
              onClick={() =>
                router.push(
                  defaults.examType ? `/admin/questions/${defaults.examType}` : "/admin/questions",
                )
              }
              className="px-5 py-2.5 rounded-xl bg-green-800 text-white text-[13px] font-semibold hover:bg-green-700">
              Go to Question Bank
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-[13px] font-bold text-green-900 mb-1">
            Shared defaults{" "}
            <span className="font-normal text-text-muted">
              (optional — fill in what most rows have in common)
            </span>
          </h3>
          <p className="text-[12px] text-text-muted mb-4">
            Any row in your file can override these; rows without their own value fall back to what
            you set here. For WAEC/NECO/NABTEB/BECE/Junior NECO, an optional{" "}
            <code className="px-1 py-0.5 rounded bg-gray-100 text-[11px]">candidateType</code>{" "}
            column ("school"/"internal" or "private"/"external") is also recognized — leave it
            blank to apply to both.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <select
              title="Exam type"
              value={defaults.examType}
              onChange={(e) => setDefaults((d) => ({ ...d, examType: e.target.value as ExamType, candidateType: isCandidateTypeExam(e.target.value as ExamType) ? d.candidateType : "" }))}
              className={selectCls}>
              <option value="">Exam type…</option>
              {Object.entries(EXAM_LABELS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.name}
                </option>
              ))}
            </select>

            {isCandidateTypeExam(defaults.examType as ExamType) && (
              <select
                title="Candidate type"
                value={defaults.candidateType}
                onChange={(e) =>
                  setDefaults((d) => ({ ...d, candidateType: e.target.value as CandidateType }))
                }
                className={selectCls}>
                <option value="">Candidate type… (default: both)</option>
                {(Object.keys(CANDIDATE_TYPE_CONFIG) as CandidateType[]).map((ct) => (
                  <option key={ct} value={ct}>
                    {CANDIDATE_TYPE_CONFIG[ct].label}
                  </option>
                ))}
              </select>
            )}

            <select
              title="Subject"
              value={defaults.subject}
              onChange={(e) => setDefaults((d) => ({ ...d, subject: e.target.value }))}
              className={selectCls}>
              <option value="">Subject…</option>
              {ALL_SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Year"
              value={defaults.year}
              onChange={(e) =>
                setDefaults((d) => ({ ...d, year: parseInt(e.target.value, 10) || d.year }))
              }
              className={selectCls}
            />

            <select
              title="Difficulty"
              value={defaults.difficulty}
              onChange={(e) =>
                setDefaults((d) => ({ ...d, difficulty: e.target.value as DifficultyLevel }))
              }
              className={selectCls}>
              <option value="">Difficulty…</option>
              {Object.entries(DIFFICULTY_CONFIG).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>

            <select
              title="Question type"
              value={defaults.type}
              onChange={(e) => setDefaults((d) => ({ ...d, type: e.target.value as QuestionType }))}
              className={selectCls}>
              <option value="">Type… (default MCQ)</option>
              {Object.entries(TYPE_CONFIG).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          <h3 className="text-[13px] font-bold text-green-900 mb-2">File</h3>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-8 cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-all">
            <FileText size={28} className="text-green-700/60" />
            <span className="text-[13px] font-medium text-green-900">
              {file ? file.name : "Click to choose a .csv file"}
            </span>
            <span className="text-[11px] text-text-muted">Max 10MB</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setPreview(null);
              }}
            />
          </label>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-[13px] bg-red-50 border border-red-100 rounded-xl px-4 py-3 mt-4">
              <AlertTriangle size={16} strokeWidth={2.5} className="shrink-0" />
              {error}
            </div>
          )}

          {preview && (
            <div className="mt-5 border border-amber-200 bg-amber-50/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={15} className="text-amber-600" />
                <span className="text-[13px] font-bold text-green-900">
                  Preview (nothing saved yet)
                </span>
              </div>
              <p className="text-[13px] text-text-muted mb-2">
                {preview.imported === 0 && preview.failed === 0
                  ? "No valid rows found."
                  : `Would import ${(preview.preview?.length ?? 0) > 0 ? "questions" : "0 questions"} — ${
                      preview.errors.length
                    } row(s) have errors${preview.passagesCreated ? `, ${preview.passagesCreated} passage(s) would be created` : ""}.`}
              </p>
              {preview.errors.length > 0 && <ErrorList errors={preview.errors} />}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handlePreview}
              disabled={!file || busy !== null}
              className="flex-1 py-3 rounded-xl border-2 border-green-800 text-green-800 font-semibold text-[13px] hover:bg-green-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {busy === "preview" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              Preview
            </button>
            <button
              onClick={handleCommit}
              disabled={!file || busy !== null}
              className="flex-1 py-3 rounded-xl bg-green-800 text-white font-semibold text-[13px] hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {busy === "commit" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              Import Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ErrorList({ errors }: { errors: { row: number; reason: string }[] }) {
  return (
    <div className="max-h-48 overflow-y-auto text-left space-y-1.5 mt-2">
      {errors.slice(0, 25).map((e, i) => (
        <div key={i} className="text-[12px] bg-white rounded-lg border border-red-100 px-3 py-1.5">
          <span className="font-semibold text-red-600">Row {e.row || "—"}:</span>{" "}
          <span className="text-text-muted">{e.reason}</span>
        </div>
      ))}
      {errors.length > 25 && (
        <p className="text-[11px] text-text-muted">…and {errors.length - 25} more</p>
      )}
    </div>
  );
}
