export type AnswerType = "type" | "whiteboard" | "upload" | "graph" | "construction";

export type Answer = {
  subQuestionId: string;
  type: AnswerType;
  content: string;
  whiteboardData?: string;
  graphData?: string;
  constructionData?: string;
  uploadData?: { name: string; data: string; type: string } | null;
};
export type ExamMode = "practice" | "exam"; // ← NEW

export type SubQuestion = {
  // Unique per answerable part: `${sessionQuestionId}__${path}`. Used as the
  // key for local answer/AI-result state — NOT the backend id.
  id: string;
  // The real backend session-question row. Every part of one nested
  // question shares it; answers are submitted/scored per row.
  sessionQuestionId: string;
  // Dot-path within the question's `structure` ("" for a plain,
  // non-nested question). Sent to the backend as partAnswers[].path.
  path: string;
  // Ancestor section headings (e.g. "(a) Radioactivity…") shown above this
  // part when they differ from the previous part's.
  headingTrail?: { label: string; text?: string }[];
  label: string;
  text: string;
  marks?: number;
  imageUrl?: string; // ← NEW: optional image for sub-question
  modelAnswer?: string; // ← NEW: official solution (shown in exam after submit, or after AI score in practice)
};

export type Question = {
  id: number;
  title: string;
  imageUrl?: string; // ← NEW: optional question-level image
  // Instruction line under the card title, e.g. "Answer all subquestions in Question 1."
  instructions?: string;
  subQuestions: SubQuestion[];
  // Comprehension passage this question group refers back to (e.g. WAEC
  // English "Read the passage and summarize it"), if any.
  passage?: {
    title?: string | null;
    instructions?: string | null;
    passageText?: string | null;
    passageImageUrl?: string | null;
  } | null;
};

// ← NEW: per-sub-question AI result
export type AIResult = {
  // The real AiEssayScore row id — needed to request a deeper elaboration
  // (see AIResultPanel's "Explain more" button / elaborateEssayScore()).
  id?: string;
  score: number;
  maxScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  showSolution: boolean;
  detailedFeedback?: string | null;
};
