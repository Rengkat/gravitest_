import { SUBMIT_GRACE_SECONDS, getDeadlineMs, isPastDeadline, remainingSeconds } from './exam-timing.util';

const START = new Date('2026-01-01T10:00:00.000Z');
const exam = { startedAt: START, allowedDurationSeconds: 3600 };
const at = (secondsAfterStart: number) => START.getTime() + secondsAfterStart * 1000;

describe('exam timing', () => {
  it('has no deadline for an untimed (practice) session', () => {
    const practice = { startedAt: START, allowedDurationSeconds: null };
    expect(getDeadlineMs(practice)).toBeNull();
    expect(remainingSeconds(practice, at(99999))).toBeNull();
    expect(isPastDeadline(practice, at(99999))).toBe(false);
  });

  it('computes the deadline from startedAt + allowed duration', () => {
    expect(getDeadlineMs(exam)).toBe(at(3600));
  });

  it('reports remaining seconds and never goes negative', () => {
    expect(remainingSeconds(exam, at(0))).toBe(3600);
    expect(remainingSeconds(exam, at(3599.5))).toBe(1);
    expect(remainingSeconds(exam, at(4000))).toBe(0);
  });

  it('resumes from the server clock after a refresh (remaining is derived, not reset)', () => {
    expect(remainingSeconds(exam, at(1800))).toBe(1800);
  });

  it('accepts answers inside the grace window and rejects them after it', () => {
    expect(isPastDeadline(exam, at(3600))).toBe(false);
    expect(isPastDeadline(exam, at(3600 + SUBMIT_GRACE_SECONDS))).toBe(false);
    expect(isPastDeadline(exam, at(3600 + SUBMIT_GRACE_SECONDS + 1))).toBe(true);
  });

  it('treats a zero/negative duration as untimed', () => {
    expect(getDeadlineMs({ startedAt: START, allowedDurationSeconds: 0 })).toBeNull();
  });
});
