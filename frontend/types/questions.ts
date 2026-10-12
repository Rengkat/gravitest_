// Canonical types for the admin Question Bank — previously imported from
// a file (@/types/questions) that didn't exist anywhere in the project,
// which meant utils/config.ts (and everything downstream of it) failed
// to build at all. Values here match the real backend enums exactly
// (src/common/enums/enums.ts) rather than the old mock's invented casing
// and missing values (11 of the real 19 exam types, "ALL"/"draft"/
// "archived" states the backend has no concept of).

export type ExamType =
  | "jamb"
  | "waec"
  | "neco"
  | "nabteb"
  | "bece"
  | "junior_neco"
  | "post_utme"
  | "ican"
  | "nmcn"
  | "cipm"
  | "nim"
  | "niesv"
  | "cibn"
  | "nse"
  | "icen"
  | "niqs"
  | "arcon"
  | "mlscn"
  | "pcn"
  | "common_entrance";

export type ExamCategoryId = "secondary" | "professional";

// School (internal) vs private (external) candidate — only WAEC, NECO,
// NABTEB, BECE and Junior NECO actually register candidates this way;
// see CANDIDATE_TYPE_EXAM_TYPES below for exactly which examTypes show
// this as a selectable field anywhere in the app.
export type CandidateType = "school" | "private";
export type CandidateTypeFilter = CandidateType | "all";

export const CANDIDATE_TYPE_EXAM_TYPES: ExamType[] = [
  "waec",
  "neco",
  "nabteb",
  "bece",
  "junior_neco",
];

// The backend's real QuestionType enum (7 values) — the old mock only
// had MCQ/THEORY/PRACTICAL/ALL, so "ALL" was a UI-only filter value,
// never a real per-question type. Kept that convention: "all" here is
// filter-only too.
export type QuestionType =
  | "mcq"
  | "theory"
  | "practical"
  | "true_false"
  | "fill_blanks"
  | "matching"
  | "objective";
export type QuestionTypeFilter = QuestionType | "all";

export type DifficultyLevel = "easy" | "medium" | "hard";

// The backend only has isActive: boolean — no draft/archived states.
// "draft" here means isActive=false at creation time (a real, if
// simpler, concept: unpublished vs published), not a distinct DB state.
// "published"/"draft" mirrors the isActive boolean the rest of the app
// already uses this language for (togglePublish, publishQuestion/
// unpublishQuestion, "land as drafts for review"), rather than the
// disconnected "active/inactive" wording the Status filter used before.
export type QuestionStatus = "published" | "draft";

export interface ExamCategoryMeta {
  id: ExamCategoryId;
  name: string;
  examTypes: ExamType[];
}

export interface ExamMeta {
  examType: ExamType;
  name: string;
  fullName: string;
  category: ExamCategoryId;
  // JAMB is the one real exam where questions are MCQ-only — used to
  // hide the type selector and default straight to MCQ on create.
  isMultipleChoiceOnly: boolean;
}

// ── Data models (real backend shape) ──────────────────────────────────

export interface QuestionOption {
  id?: string;
  label: "A" | "B" | "C" | "D";
  text: string;
  imageUrl?: string | null;
  order: number;
}

export interface QuestionExplanation {
  id?: string;
  text: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

// Essay/theory structure — custom numbering (1 → (a) → (i)), sub-questions,
// per-part marks, tables, images. Mirrors the backend's EssayPart shape
// exactly (see src/questions/interfaces/essay-part.interface.ts).
export interface EssayPart {
  label: string;
  text?: string | null;
  imageUrl?: string | null;
  table?: string[][] | null;
  maxScore?: number | null;
  children?: EssayPart[];
}

export interface Passage {
  id: string;
  examType: ExamType;
  subject: string;
  year: number;
  title?: string | null;
  instructions?: string | null;
  passageText?: string | null;
  passageImageUrl?: string | null;
  isActive: boolean;
  questionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  questionNumber?: string | null;
  examType: ExamType;
  // null/undefined = applies to both school and private candidates
  // (the common case). Only ever meaningfully set for the exam types in
  // CANDIDATE_TYPE_EXAM_TYPES.
  candidateType?: CandidateType | null;
  subject: string;
  year: number;
  questionText: string;
  questionImageUrl?: string | null;
  difficulty: DifficultyLevel;
  type: QuestionType;
  topic?: string | null;
  maxScore?: number;
  modelAnswer?: string;
  isActive: boolean;
  passageId?: string | null;
  passage?: Passage | null;
  options?: QuestionOption[];
  answer?: { correctLabel: string; correctOptionId: string };
  explanations?: QuestionExplanation[];
  structure?: EssayPart[] | null;
  createdAt: string;
  updatedAt: string;
}

// ── Filter state ────────────────────────────────────────────────────────

export interface QuestionFilters {
  examType: ExamType | "";
  // "all" = no filter applied. Only relevant/shown when examType is one
  // of CANDIDATE_TYPE_EXAM_TYPES.
  candidateType: CandidateTypeFilter;
  year: string;
  subject: string;
  topic: string;
  type: QuestionTypeFilter | "";
  difficulty: DifficultyLevel | "";
  status: QuestionStatus | "";
  searchQuery: string;
}

export const DEFAULT_FILTERS: QuestionFilters = {
  examType: "",
  candidateType: "all",
  year: "",
  subject: "",
  topic: "",
  type: "",
  difficulty: "",
  status: "",
  searchQuery: "",
};

// Question types that use the options/answer MCQ-style structure.
export const MCQ_LIKE_TYPES: QuestionType[] = ["mcq", "true_false", "objective"];
