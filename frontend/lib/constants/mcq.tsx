/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
export type QuestionOption = {
  label: string;
  text: string;
  imageUrl?: string | null;
};

export type Question = {
  id: number;
  text: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
  hasDiagram?: boolean;
  diagramSvg?: string;
  subjectId: string;
  // Present only for real (backend-sourced) questions — the UUID used
  // for actual API calls, since `id` here stays a stable array index.
  sessionQuestionId?: string;
  questionId?: string; // real Question.id (distinct from sessionQuestionId) — needed for /ai/explain/mcq
  questionImageUrl?: string | null;
  // Comprehension/diagram set this question belongs to, if any.
  passage?: {
    title?: string | null;
    instructions?: string | null;
    passageText?: string | null;
    passageImageUrl?: string | null;
  } | null;
};

export type Answer = {
  selectedOption: string | null;
  isFlagged: boolean;
  isVisited: boolean;
};

// Answers keyed by subjectId so switching subjects never loses progress
export type SubjectId = string;
export type AllAnswers = Record<SubjectId, Answer[]>;


// Note: the mock BASE_QUESTIONS dataset and its buildQuestions() helper
// that used to live here were removed — the real CBT flow has used
// live backend data (see lib/session/practiceSession.ts, lib/mcq/mcqAdapter.ts)
// since before this cleanup; the mock data was unreferenced dead code.
