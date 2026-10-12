// Glue between /dashboard/practice (config wizard) and /cbt/mcq, /cbt/theory
// (the players). Originally sessionStorage-only mock; now backed by the
// real /exams API (see lib/api/exams.ts) — the session is created ONCE on
// the real backend and its full question set cached here so the two
// player pages can read synchronously the way they were built to.
//
// Mixed sessions (plan = ["mcq","theory"]) use ONE real backend session
// (sent with theoryQuestionCount, so the API returns numQuestions MCQs plus
// that many theory questions in one list) rather than two separate backend sessions — this matches how
// ExamsService actually models a session, and lets "finish MCQ part, move
// to theory part, THEN complete" work without re-creating anything.

import { PracticeConfig } from "@/types/practice";
import {
  startExamSession,
  getExamSession,
  submitAnswer as apiSubmitAnswer,
  completeExamSession,
  type ExamSessionDto,
  type SessionQuestionDto,
  type BackendExamMode,
  type BackendQuestionType,
  type PartAnswerPayload,
} from "@/lib/api/exams";

export type CbtPart = "mcq" | "theory";
export type SessionMode = "practice" | "exam";

export interface PartResult {
  completedAt: string;
  score?: number;
  totalQuestions?: number;
  totalScore?: number;
  maxScore?: number;
  raw?: unknown;
}

export interface PracticeSession {
  id: string; // real backend ExamSession id
  config: PracticeConfig;
  mode: SessionMode;
  plan: CbtPart[];
  currentPartIndex: number;
  results: Partial<Record<CbtPart, PartResult>>;
  createdAt: string;
  // Real data from the backend — this is what players should actually render.
  backendSession: ExamSessionDto;
  questions: SessionQuestionDto[];
}

const STORAGE_PREFIX = "practice-session:";
const key = (id: string) => `${STORAGE_PREFIX}${id}`;

function persist(session: PracticeSession) {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(key(session.id), JSON.stringify(session));
  }
}

function toBackendMode(mode: SessionMode): BackendExamMode {
  return mode === "exam" ? "mock" : "practice";
}

function toBackendExamType(config: PracticeConfig): string | undefined {
  if (config.examType === "PROFESSIONAL") return config.professionalExam?.toLowerCase();
  return config.examType?.toLowerCase();
}

function toBackendCandidateType(config: PracticeConfig): "school" | "private" | undefined {
  return config.candidateType?.toLowerCase() as "school" | "private" | undefined;
}

/**
 * The filters a session for this config draws its questions from —
 * shared by session creation and the wizard's "how many are available"
 * count so the two can't disagree.
 */
export function buildPoolFilters(config: PracticeConfig) {
  return {
    examType: toBackendExamType(config),
    candidateType: toBackendCandidateType(config),
    subjects: toBackendSubjects(config),
    year: config.year ? parseInt(config.year, 10) : undefined,
  };
}

function toBackendSubjects(config: PracticeConfig): string[] {
  const subjects = config.subjects?.length
    ? config.subjects
    : config.subject
      ? [config.subject]
      : [];
  return subjects.map((s) => s.toLowerCase());
}

/**
 * Creates the session on the real backend (one call, covers the whole
 * plan) and caches the full response locally. Async — callers (button
 * handlers) must await this now.
 */
export async function createPracticeSession(
  config: PracticeConfig & { topics?: string[] },
  plan: CbtPart[],
  mode: SessionMode,
): Promise<string> {
  // plan[0] is the CBT *part/route* ("mcq" | "theory") — Practical reuses
  // the theory part/page, so it collapses to "theory" here too. The
  // backend *question filter* still needs to distinguish them, which is
  // why this checks config.questionType (what the student actually
  // picked) rather than just the plan/part.
  const isMixed = plan.length > 1;
  const questionType: BackendQuestionType | undefined =
    isMixed
      ? "mcq" // ignored by the backend for a mixed session (MCQ + theory)
      : plan[0] === "mcq"
        ? "mcq"
        : config.questionType === "PRACTICAL"
          ? "practical"
          : "theory";

  const { session, questions } = await startExamSession({
    examType: toBackendExamType(config),
    candidateType: toBackendCandidateType(config),
    subjects: toBackendSubjects(config),
    topic: config.topics?.[0],
    questionType,
    mode: toBackendMode(mode),
    questionCount: config.numQuestions || 40,
    theoryQuestionCount: isMixed ? config.numTheoryQuestions || 5 : undefined,
    durationMinutes: config.timeLimit,
    year: config.year ? parseInt(config.year, 10) : undefined,
  });

  const practiceSession: PracticeSession = {
    id: session.id,
    config,
    mode,
    plan,
    currentPartIndex: 0,
    results: {},
    createdAt: new Date().toISOString(),
    backendSession: session,
    questions,
  };
  persist(practiceSession);
  return session.id;
}

export function getPracticeSession(id: string): PracticeSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(key(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PracticeSession;
  } catch {
    return null;
  }
}

/** Re-fetches the session from the backend (e.g. after a refresh mid-exam) and re-caches it. */
export async function refreshPracticeSession(id: string): Promise<PracticeSession | null> {
  const cached = getPracticeSession(id);
  if (!cached) return null;
  const { session, questions } = await getExamSession(id);
  const updated: PracticeSession = { ...cached, backendSession: session, questions };
  persist(updated);
  return updated;
}

export function updatePracticeSession(
  id: string,
  patch: Partial<PracticeSession>,
): PracticeSession | null {
  const existing = getPracticeSession(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  persist(updated);
  return updated;
}

export interface McqAnswerSubmission {
  sessionQuestionId: string;
  selectedLabel: string | null;
  timeSpentSeconds?: number;
}

export interface EssayAnswerSubmission {
  sessionQuestionId: string;
  essayText: string;
  essayImageUrls?: string[];
  // Nested questions: one entry per answerable part (see PartAnswerPayload)
  partAnswers?: PartAnswerPayload[];
  timeSpentSeconds?: number;
}

/**
 * Call when a player (mcq or theory) finishes: submits every answer for
 * that part to the real backend, and — only if this is the LAST part in
 * the plan — calls /complete to get the real, AI-graded final score.
 * Returns where to go next.
 */
export async function completePart(
  id: string,
  part: CbtPart,
  answers: McqAnswerSubmission[] | EssayAnswerSubmission[],
): Promise<{ nextPart: CbtPart | null; isLastPart: boolean; finalSession?: ExamSessionDto }> {
  const session = getPracticeSession(id);
  if (!session) return { nextPart: null, isLastPart: true };

  // Submit every answer for this part. Best-effort in parallel — a single
  // failed submission shouldn't block the rest from saving.
  await Promise.allSettled(
    answers.map((a) =>
      "selectedLabel" in a
        ? apiSubmitAnswer(id, {
            sessionQuestionId: a.sessionQuestionId,
            selectedLabel: a.selectedLabel ?? undefined,
            timeSpentSeconds: a.timeSpentSeconds,
          })
        : apiSubmitAnswer(id, {
            sessionQuestionId: a.sessionQuestionId,
            essayText: a.essayText,
            essayImageUrls: a.essayImageUrls,
            partAnswers: a.partAnswers,
            timeSpentSeconds: a.timeSpentSeconds,
          }),
    ),
  );

  const indexInPlan = session.plan.indexOf(part);
  const nextPart = session.plan[indexInPlan + 1] ?? null;

  const results = {
    ...session.results,
    [part]: { completedAt: new Date().toISOString() },
  };
  updatePracticeSession(id, {
    results,
    currentPartIndex: nextPart ? indexInPlan + 1 : session.currentPartIndex,
  });

  if (nextPart) {
    return { nextPart, isLastPart: false };
  }

  // Last part — actually submit the whole session for AI grading.
  const finalSession = await completeExamSession(id);
  updatePracticeSession(id, { backendSession: finalSession });
  return { nextPart: null, isLastPart: true, finalSession };
}

export function clearPracticeSession(id: string) {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(key(id));
  }
}

export function partRoute(part: CbtPart, sessionId: string): string {
  return `/cbt/${part}/${sessionId}`;
}

export function resultsRoute(sessionId: string): string {
  return `/dashboard/practice/session/${sessionId}/results`;
}
