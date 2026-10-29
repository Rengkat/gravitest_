import { decideExplainAccess } from './explain-access.util';

describe('decideExplainAccess', () => {
  it('allows explanations when the question is in no open session (e.g. results page)', () => {
    expect(decideExplainAccess([])).toEqual({ allowed: true });
  });

  it('blocks while an Exam-mode session containing the question is open', () => {
    const d = decideExplainAccess([{ mode: 'mock', answered: true }]);
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toBe('exam_in_progress');
  });

  it('blocks in Practice mode until the student has attempted the question', () => {
    const d = decideExplainAccess([{ mode: 'practice', answered: false }]);
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toBe('attempt_first');
  });

  it('allows in Practice mode after an attempt', () => {
    expect(decideExplainAccess([{ mode: 'practice', answered: true }])).toEqual({ allowed: true });
  });

  it('exam restriction wins when the question is in both an exam and a practice session', () => {
    const d = decideExplainAccess([
      { mode: 'practice', answered: true },
      { mode: 'mock', answered: false },
    ]);
    expect(d.allowed).toBe(false);
  });
});
