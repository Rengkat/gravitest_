import { apiClient } from "./client";

export type BackendQuestionType = "mcq" | "theory" | "practical" | "true_false" | "fill_blanks" | "matching";
export type BackendExamMode = "practice" | "mock";
export type BackendDifficulty = "easy" | "medium" | "hard";

export interface SessionQuestionOption {
  id: string;
  label: string;
  text: string;
  imageUrl: string | null;
  order: number;
}

export interface SessionQuestionPassage {
  id: string;
  title: string | null;
  instructions: string | null;
  passageText: string | null;
  passageImageUrl: string | null;
}

// Nested theory/practical part tree (mirrors backend EssayPart). Contains no answers.
export interface EssayPart {
  label: string;
  text?: string | null;
  imageUrl?: string | null;
  table?: string[][] | null;
  maxScore?: number | null;
  children?: EssayPart[];
}

export interface PartAnswerPayload {
  path: string; // dot-path of the leaf within the question's structure
  essayText?: string;
  essayImageUrls?: string[];
}

export interface PartScore {
  path: string;
  awardedScore: number;
  maxScore: number;
  confidence: number;
  aiEssayScoreId: string | null;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface SessionQuestionDto {
  sessionQuestionId: string;
  id: string; // questionId
  questionNumber: string | null;
  examType: string | null;
  subject: string;
  year: number;
  questionText: string;
  questionImageUrl: string | null;
  difficulty: BackendDifficulty;
  type: BackendQuestionType;
  topic: string | null;
  maxScore: number | null;
  structure?: EssayPart[] | null;
  options?: SessionQuestionOption[];
  passage?: SessionQuestionPassage | null;
  isAnswered?: boolean;
  isFlagged?: boolean;
}

export interface ExamSessionDto {
  id: string;
  studentProfileId: string;
  examType: string | null;
  subjects: string[];
  topic: string | null;
  questionType: BackendQuestionType;
  mode: BackendExamMode;
  difficulty: BackendDifficulty | null;
  sessionTitle: string | null;
  startedAt: string;
  completedAt: string | null;
  timeSpentSeconds: number;
  allowedDurationSeconds: number | null;
  status: "in_progress" | "completed" | "submitted" | "timed_out" | "abandoned";
  totalQuestions: number;
  questionsAttempted: number;
  questionsCorrect: number;
  questionsSkipped: number;
  percentage: number;
  scaledScore: number | null;
  xpEarned: number;
  topicBreakdown: { topic: string; total: number; correct: number; score: number }[] | null;
  subjectScores: { subject: string; score: number; total: number; percentage: number }[] | null;
}

export interface StartExamSessionPayload {
  examType?: string;
  // "school" or "private" — only meaningful when examType is waec/neco/
  // nabteb/bece/junior_neco. Omit to draw from both streams.
  candidateType?: "school" | "private";
  subjects: string[];
  topic?: string;
  questionType?: BackendQuestionType;
  mode: BackendExamMode;
  difficulty?: BackendDifficulty;
  sessionTitle?: string;
  questionCount: number;
  // Mixed MCQ+theory session: questionCount MCQs PLUS this many theory questions
  theoryQuestionCount?: number;
  durationMinutes?: number;
  year?: number;
}

export async function startExamSession(payload: StartExamSessionPayload) {
  const { data } = await apiClient.post<{ session: ExamSessionDto; questions: SessionQuestionDto[] }>(
    "/exams/sessions",
    payload,
  );
  return data;
}

export async function getExamSession(sessionId: string) {
  const { data } = await apiClient.get<{ session: ExamSessionDto; questions: SessionQuestionDto[] }>(
    `/exams/sessions/${sessionId}`,
  );
  return data;
}

export interface SubmitAnswerPayload {
  sessionQuestionId: string;
  selectedLabel?: string;
  essayText?: string;
  essayImageUrls?: string[]; // R2 URLs — upload via uploadLibraryFile first, folder "documents"
  // Structured (nested) questions: one entry per answerable part. Takes
  // precedence over essayText/essayImageUrls on the backend.
  partAnswers?: PartAnswerPayload[];
  timeSpentSeconds?: number;
}

export async function submitAnswer(sessionId: string, payload: SubmitAnswerPayload) {
  const { data } = await apiClient.post<{
    saved: true;
    isCorrect?: boolean;
    correctLabel?: string;
    explanation?: string;
  }>(`/exams/sessions/${sessionId}/answers`, payload);
  return data;
}

export async function flagQuestion(sessionId: string, sessionQuestionId: string) {
  const { data } = await apiClient.post<{ isFlagged: boolean }>(`/exams/sessions/${sessionId}/flag`, {
    sessionQuestionId,
  });
  return data;
}

export async function completeExamSession(sessionId: string) {
  const { data } = await apiClient.post<ExamSessionDto>(`/exams/sessions/${sessionId}/complete`, {});
  return data;
}

export interface ResultsBreakdownItem {
  sessionQuestionId: string;
  question: {
    id?: string;
    questionText?: string;
    questionImageUrl?: string | null;
    type?: BackendQuestionType;
    subject?: string;
    options?: SessionQuestionOption[];
    correctLabel?: string;
    explanations?: { text: string }[];
    maxScore?: number | null;
    structure?: EssayPart[] | null;
  };
  yourAnswer: {
    selectedLabel: string | null;
    essayText: string | null;
    essayImageUrls: string[];
    isCorrect: boolean;
    awardedScore: number | null;
    maxScore: number | null;
    scoringStatus: "not_applicable" | "pending" | "scored" | "needs_review";
    aiEssayScoreId: string | null;
    aiFeedback?: string;
    aiStrengths?: string[];
    aiImprovements?: string[];
    partAnswers?: { path: string; essayText: string; essayImageUrls: string[] }[] | null;
    partScores?: PartScore[] | null;
  } | null;
}

export async function getExamResults(sessionId: string) {
  const { data } = await apiClient.get<{ session: ExamSessionDto; breakdown: ResultsBreakdownItem[] }>(
    `/exams/sessions/${sessionId}/results`,
  );
  return data;
}

export async function scoreAnswerNow(sessionId: string, sessionQuestionId: string) {
  const { data } = await apiClient.post<{
    // null for structured questions (no single AiEssayScore row — see parts)
    id: string | null;
    // Structured questions: per-part results. aiScore/maxScore are the sums.
    parts?: PartScore[];
    aiScore: number;
    maxScore: number;
    aiFeedback: string;
    strengths: string[];
    improvements: string[];
    confidence: number;
  }>(`/exams/sessions/${sessionId}/answers/${sessionQuestionId}/score`, {});
  return data;
}

export async function listMyExamSessions() {
  const { data } = await apiClient.get<ExamSessionDto[]>("/exams/sessions");
  return data;
}

export interface AvailableCountParams {
  examType?: string;
  candidateType?: string;
  subjects: string[];
  year?: number;
  questionType?: BackendQuestionType;
}

/** How many questions a session with these filters could draw from. */
export async function getAvailableQuestionCount(
  params: AvailableCountParams,
  signal?: AbortSignal,
): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>("/exams/available-count", {
    params: {
      examType: params.examType,
      candidateType: params.candidateType,
      subjects: params.subjects.join(","),
      year: params.year,
      questionType: params.questionType,
    },
    signal,
  });
  return data.count;
}
