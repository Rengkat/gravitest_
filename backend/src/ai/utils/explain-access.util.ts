// Decides whether a student may request an AI explanation for a question,
// given the in-progress sessions that contain that question. The explanation
// reveals the correct answer, so this is the server-side backstop for the
// "no answers during an exam / not before an attempt in practice" rules —
// hiding the button in the UI alone is not enough.
//
// The three states a student can be in:
//   1. NOT ATTEMPTED  → locked  (`attempt_first`)
//   2. ATTEMPTED      → allowed (the caller then runs the AI; failures there are a separate, retryable error)
//   3. EXAM RUNNING   → locked  (`exam_in_progress`)

import { isWithinLiveExamWindow } from 'src/exams/utils/exam-timing.util';

export interface OpenSessionUse {
  /** 'mock' = Exam Mode, 'practice' = Practice Mode (backend mode values). */
  mode: 'mock' | 'practice';
  /** The student has already submitted an answer to this question in that session. */
  answered: boolean;
  startedAt: Date | string;
  allowedDurationSeconds?: number | null;
}

export type ExplainAccessDecision =
  | { allowed: true }
  | { allowed: false; reason: 'exam_in_progress' | 'attempt_first'; message: string };

export function decideExplainAccess(
  openSessions: OpenSessionUse[],
  nowMs: number = Date.now(),
): ExplainAccessDecision {
  // An exam only blocks while it is genuinely being sat (deadline-aware). An exam that was started and
  // abandoned must not lock the student out of this question forever.
  const liveExam = openSessions.some(
    (s) =>
      s.mode === 'mock' &&
      isWithinLiveExamWindow({ startedAt: s.startedAt, allowedDurationSeconds: s.allowedDurationSeconds ?? null }, nowMs),
  );
  if (liveExam) {
    return {
      allowed: false,
      reason: 'exam_in_progress',
      message: 'AI explanations are unavailable while an exam containing this question is in progress.',
    };
  }

  // Practice: the student's CURRENT attempt decides — the most recently started open practice session that
  // contains this question. An older, abandoned session where the question was never answered must not block
  // someone who has just answered it in the session they are actually working in.
  const practice = openSessions
    .filter((s) => s.mode === 'practice')
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  if (practice.length > 0 && !practice[0].answered) {
    return {
      allowed: false,
      reason: 'attempt_first',
      message: 'Answer this question first — the explanation unlocks after you attempt it.',
    };
  }
  return { allowed: true };
}
