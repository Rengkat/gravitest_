// Pure helpers for server-side exam timing. Kept dependency-free so the rules
// (deadline, grace period, remaining time) can be unit tested in isolation and
// so every endpoint applies exactly the same definition of "time is up".

/** Network latency / clock-skew allowance for the final answer + submit call. */
export const SUBMIT_GRACE_SECONDS = 15;

export interface TimingInput {
  startedAt: Date | string;
  allowedDurationSeconds: number | null;
}

/** Epoch ms when the exam closes, or null when the session has no time limit. */
export function getDeadlineMs(session: TimingInput): number | null {
  if (!session.allowedDurationSeconds || session.allowedDurationSeconds <= 0) return null;
  return new Date(session.startedAt).getTime() + session.allowedDurationSeconds * 1000;
}

/** Whole seconds left (never negative), or null when untimed. */
export function remainingSeconds(session: TimingInput, nowMs: number): number | null {
  const deadline = getDeadlineMs(session);
  if (deadline === null) return null;
  return Math.max(0, Math.ceil((deadline - nowMs) / 1000));
}

/**
 * True once the deadline plus the grace window has passed. Answers arriving
 * after this are rejected and the session is auto-submitted.
 */
export function isPastDeadline(
  session: TimingInput,
  nowMs: number,
  graceSeconds: number = SUBMIT_GRACE_SECONDS,
): boolean {
  const deadline = getDeadlineMs(session);
  if (deadline === null) return false;
  return nowMs > deadline + graceSeconds * 1000;
}
