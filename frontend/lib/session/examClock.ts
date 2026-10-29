// Pure countdown helpers. The deadline is derived from the SERVER's view of the
// session (remainingSeconds at load), not from a counter that starts at page
// load — so refreshing, reopening the tab or throttled background timers can
// never give the student extra time.

/** Client-clock instant (epoch ms) at which the exam ends, or null when untimed. */
export function deadlineFromRemaining(
  remainingSeconds: number | null | undefined,
  clientNowMs: number,
): number | null {
  if (remainingSeconds === null || remainingSeconds === undefined) return null;
  return clientNowMs + Math.max(0, remainingSeconds) * 1000;
}

/** Whole seconds left (never negative). */
export function secondsLeft(deadlineMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}

export type TimerView = { visible: false } | { visible: true; seconds: number; isLow: boolean };

/** Practice = no timer at all; Exam = visible countdown (turns "low" under 5 minutes). */
export function timerView(
  mode: "practice" | "exam",
  deadlineMs: number | null,
  nowMs: number,
): TimerView {
  if (mode !== "exam" || deadlineMs === null) return { visible: false };
  const seconds = secondsLeft(deadlineMs, nowMs);
  return { visible: true, seconds, isLow: seconds < 300 };
}
