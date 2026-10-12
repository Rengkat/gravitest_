import { apiClient } from "./client";
import type {
  Question,
  ExamType,
  CandidateType,
  QuestionType,
  DifficultyLevel,
  QuestionOption,
  EssayPart,
} from "@/types/questions";

// GET /questions and GET /questions/:id are admin+super_admin only (see
// questions.controller.ts) — they include the full answer key, which
// must never reach a student; students get questions via the separate,
// answer-stripped POST /questions/session-pool instead.

interface PaginatedMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}
interface Paginated<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface QuestionListParams {
  examType?: ExamType;
  // "" / undefined = no filter. Passing a value returns questions
  // tagged for that stream PLUS untagged (applies-to-both) ones — see
  // QuestionsService.findAll on the backend.
  candidateType?: CandidateType;
  subject?: string;
  year?: number;
  difficulty?: DifficultyLevel;
  type?: QuestionType;
  topic?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export async function listQuestions(params: QuestionListParams): Promise<Paginated<Question>> {
  const { data } = await apiClient.get("/questions", { params });
  return data;
}

export async function getQuestion(id: string): Promise<Question> {
  const { data } = await apiClient.get(`/questions/${id}`);
  return data;
}

// Matches CreateQuestionDto exactly (questions/dto/create-question.dto.ts).
// options/answer only apply to MCQ-like types (mcq, true_false,
// objective) — omit both for theory/essay/practical/fill_blanks/matching.
export interface CreateQuestionPayload {
  questionNumber?: string;
  examType: ExamType;
  // Only set for WAEC/NECO/NABTEB/BECE/Junior NECO when a paper genuinely
  // differs between streams. null/omitted = applies to both.
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
  isActive?: boolean;
  passageId?: string | null;
  structure?: EssayPart[] | null;
  options?: {
    label: "A" | "B" | "C" | "D";
    text: string;
    imageUrl?: string | null;
    order: number;
  }[];
  answer?: { correctLabel: string };
  explanations?: { text: string; imageUrl?: string | null; videoUrl?: string | null }[];
}

export async function createQuestion(payload: CreateQuestionPayload): Promise<Question> {
  const { data } = await apiClient.post("/questions", payload);
  return data;
}

export type UpdateQuestionPayload = Partial<CreateQuestionPayload>;

export async function updateQuestion(
  id: string,
  payload: UpdateQuestionPayload,
): Promise<Question> {
  const { data } = await apiClient.patch(`/questions/${id}`, payload);
  return data;
}

export async function deleteQuestion(id: string): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/questions/${id}`);
  return data;
}

export async function publishQuestion(id: string): Promise<Question> {
  const { data } = await apiClient.patch(`/questions/${id}/publish`, {});
  return data;
}

export async function unpublishQuestion(id: string): Promise<Question> {
  const { data } = await apiClient.patch(`/questions/${id}/unpublish`, {});
  return data;
}

export async function duplicateQuestion(id: string): Promise<Question> {
  const { data } = await apiClient.post(`/questions/${id}/duplicate`, {});
  return data;
}

export async function bulkSetActive(
  ids: string[],
  isActive: boolean,
): Promise<{ message: string }> {
  const { data } = await apiClient.patch("/questions/bulk/active", { ids, isActive });
  return data;
}

export async function bulkDeleteQuestions(ids: string[]): Promise<{ message: string }> {
  const { data } = await apiClient.delete("/questions/bulk", { data: { ids } });
  return data;
}

export interface BulkImportResult {
  imported: number;
  failed: number;
  errors: { row: number; reason: string }[];
  passagesCreated?: number;
  dryRun?: boolean;
  // Total rows that passed validation and would import on a real commit.
  // Not the same as preview.length (capped to 10 rows for display) —
  // use this, not preview.length, to answer "how many would import?".
  wouldImport?: number;
  preview?: CreateQuestionPayload[];
}

export async function bulkImportQuestions(
  questions: CreateQuestionPayload[],
): Promise<BulkImportResult> {
  const { data } = await apiClient.post("/questions/bulk/import", { questions });
  return data;
}

// The actual "upload a spreadsheet" workflow — bulkImportQuestions() above
// only accepts pre-formed JSON. This posts a real .csv or .json file plus
// optional shared defaults (examType/subject/year/difficulty/type) that
// apply to any row that doesn't specify its own — the same fields as the
// single "Add Question" form. dryRun=true validates + previews without
// saving anything.
export interface BulkImportDefaults {
  examType?: ExamType;
  // Tags the whole file as school- or private-candidate-only instead of
  // repeating it per row (WAEC/NECO/NABTEB/BECE/Junior NECO only).
  candidateType?: CandidateType;
  subject?: string;
  year?: number;
  difficulty?: DifficultyLevel;
  type?: QuestionType;
}

export async function bulkImportQuestionsFile(
  file: File,
  defaults: BulkImportDefaults,
  dryRun: boolean,
): Promise<BulkImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post("/questions/bulk/import-file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    params: { dryRun: dryRun ? "true" : "false", ...defaults },
  });
  return data;
}

export type { Question, QuestionOption };
