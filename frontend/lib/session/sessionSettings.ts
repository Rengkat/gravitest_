// ONE place that turns the wizard's PracticeConfig into the concrete numbers a
// session is created with. The wizard summary, createPracticeSession and (via
// the backend session) the instructions page / timer / results all read these,
// so they can never disagree. Previously the wizard showed "60 min", the
// session was created with no duration, and the player timer used 120.

import type { PracticeConfig } from "@/types/practice";

export const DEFAULT_QUESTION_COUNT = 40;
export const DEFAULT_THEORY_QUESTION_COUNT = 5;
/** Default Exam-mode duration offered by the wizard (minutes). Practice has none. */
export const DEFAULT_EXAM_MINUTES = 60;

export type SessionMode = "practice" | "exam";

export interface ResolvedSessionSettings {
  questionCount: number;
  /** Only for mixed (MCQ + theory) sessions. */
  theoryQuestionCount: number | null;
  /** Exam mode only — practice is untimed, so this is always null there. */
  durationMinutes: number | null;
}

export function resolveSessionSettings(
  config: Pick<PracticeConfig, "numQuestions" | "numTheoryQuestions" | "timeLimit" | "questionType">,
  mode: SessionMode,
): ResolvedSessionSettings {
  const isMixed = config.questionType === "ALL" && !!config.numTheoryQuestions;
  return {
    questionCount: config.numQuestions || DEFAULT_QUESTION_COUNT,
    theoryQuestionCount: isMixed ? (config.numTheoryQuestions ?? DEFAULT_THEORY_QUESTION_COUNT) : null,
    durationMinutes: mode === "exam" ? config.timeLimit || DEFAULT_EXAM_MINUTES : null,
  };
}
