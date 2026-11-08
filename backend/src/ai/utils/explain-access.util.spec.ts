import { decideExplainAccess, OpenSessionUse } from './explain-access.util';

const NOW = Date.parse('2026-11-08T12:00:00Z');
const at = (minutesAgo: number) => new Date(NOW - minutesAgo * 60_000);
const practice = (answered: boolean, minutesAgo = 5): OpenSessionUse => ({ mode: 'practice', answered, startedAt: at(minutesAgo) });
const mock = (minutesAgo = 5, durationSeconds: number | null = 3600): OpenSessionUse => ({
  mode: 'mock', answered: true, startedAt: at(minutesAgo), allowedDurationSeconds: durationSeconds,
});

describe('decideExplainAccess', () => {
  it('allows explanations when the question is in no open session (e.g. the results page)', () => {
    expect(decideExplainAccess([], NOW)).toEqual({ allowed: true });
  });

  describe('state 1 — not attempted', () => {
    it('locks a practice question that has not been attempted', () => {
      const d = decideExplainAccess([practice(false)], NOW);
      expect(d).toMatchObject({ allowed: false, reason: 'attempt_first' });
      if (!d.allowed) expect(d.message).toMatch(/answer this question first/i);
    });
  });

  describe('state 2 — attempted', () => {
    it('unlocks after an attempt', () => {
      expect(decideExplainAccess([practice(true)], NOW)).toEqual({ allowed: true });
    });

    it('REGRESSION: a stale, abandoned practice session where it was never answered does not block the session the student just answered it in', () => {
      const d = decideExplainAccess([practice(false, 60 * 24 * 3), practice(true, 2)], NOW);
      expect(d).toEqual({ allowed: true });
    });

    it('…and several stale unanswered sessions still do not block', () => {
      const d = decideExplainAccess([practice(false, 5000), practice(false, 4000), practice(true, 1), practice(false, 3000)], NOW);
      expect(d).toEqual({ allowed: true });
    });

    it('but a NEWER session where it has not been answered yet is locked (a fresh attempt is required)', () => {
      const d = decideExplainAccess([practice(true, 600), practice(false, 1)], NOW);
      expect(d).toMatchObject({ allowed: false, reason: 'attempt_first' });
    });
  });

  describe('exam mode', () => {
    it('blocks while an exam containing the question is genuinely in progress', () => {
      expect(decideExplainAccess([mock(5)], NOW)).toMatchObject({ allowed: false, reason: 'exam_in_progress' });
    });

    it('exam restriction wins over an answered practice session', () => {
      expect(decideExplainAccess([practice(true), mock(5)], NOW)).toMatchObject({ allowed: false, reason: 'exam_in_progress' });
    });

    it('stays blocked through the submit grace period, then stops blocking once the exam is long over', () => {
      expect(decideExplainAccess([mock(60, 3600)], NOW).allowed).toBe(false); // exactly at the deadline
      expect(decideExplainAccess([mock(61, 3600)], NOW).allowed).toBe(true); // well past deadline + grace
    });

    it('an untimed exam abandoned for over 12 hours does not lock the question forever', () => {
      expect(decideExplainAccess([mock(60, null)], NOW).allowed).toBe(false);
      expect(decideExplainAccess([mock(13 * 60, null)], NOW).allowed).toBe(true);
    });
  });
});
