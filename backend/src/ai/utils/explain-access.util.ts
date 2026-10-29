// Decides whether a student may request an AI explanation for a question,
// given the in-progress sessions that contain that question. The explanation
// reveals the correct answer, so this is the server-side backstop for the
// "no answers during an exam / not before an attempt in practice" rules —
// hiding the button in the UI alone is not enough.

export interface OpenSessionUse {
  /** 'mock' = Exam Mode, 'practice' = Practice Mode (backend mode values). */
  mode: 'mock' | 'practice';
  /** The student has already submitted an answer to this question in that session. */
  answered: boolean;
}

export type ExplainAccessDecision =
  | { allowed: true }
  | { allowed: false; reason: 'exam_in_progress' | 'attempt_first'; message: string };

export function decideExplainAccess(openSessions: OpenSessionUse[]): ExplainAccessDecision {
  if (openSessions.some((s) => s.mode === 'mock')) {
    return {
      allowed: false,
      reason: 'exam_in_progress',
      message: 'AI explanations are unavailable while an exam containing this question is in progress.',
    };
  }
  if (openSessions.some((s) => s.mode === 'practice' && !s.answered)) {
    return {
      allowed: false,
      reason: 'attempt_first',
      message: 'Answer this question first — the explanation unlocks after you attempt it.',
    };
  }
  return { allowed: true };
}
