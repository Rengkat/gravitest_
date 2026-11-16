import { essayMaxMarks, percentOf, questionPoints, ScoreInput, tallySession, toBreakdowns } from './session-score.util';

const mcq = (o: Partial<ScoreInput> = {}): ScoreInput => ({
  subject: 'mathematics', topic: 'Algebra', isEssay: false, answered: true, isCorrect: true,
  awardedScore: null, answerMaxScore: null, questionMaxScore: null, ...o,
});
const essay = (awarded: number | null, max: number | null, o: Partial<ScoreInput> = {}): ScoreInput => ({
  subject: 'mathematics', topic: 'Probability', isEssay: true, answered: true, isCorrect: false,
  awardedScore: awarded, answerMaxScore: max, questionMaxScore: max, ...o,
});

describe('marks-based session scoring', () => {
  it('THE REPORTED BUG: a theory question scored 2/6 is 33% overall, not 0%', () => {
    const t = tallySession([essay(2, 6)]);
    expect(t.points).toBe(2);
    expect(t.maxPoints).toBe(6);
    expect(percentOf(t.points, t.maxPoints)).toBeCloseTo(33.33, 1);
  });

  it('an objective-only session is unchanged: correct ÷ total', () => {
    const t = tallySession([mcq(), mcq(), mcq({ isCorrect: false }), mcq({ answered: false, isCorrect: false })]);
    expect(t.points).toBe(2);
    expect(t.maxPoints).toBe(4);
    expect(percentOf(t.points, t.maxPoints)).toBe(50);
    expect(t.questionsCorrect).toBe(2);
    expect(t.questionsAttempted).toBe(3);
  });

  it('a mixed session adds marks: objective questions are 1 point each, theory is worth its marks', () => {
    const t = tallySession([mcq(), mcq({ isCorrect: false }), essay(4, 8)]);
    expect(t.points).toBe(1 + 0 + 4);
    expect(t.maxPoints).toBe(1 + 1 + 8);
    expect(percentOf(t.points, t.maxPoints)).toBe(50);
  });

  it('full marks is 100%, no marks is 0%', () => {
    expect(percentOf(...pair(tallySession([essay(10, 10)])))).toBe(100);
    expect(percentOf(...pair(tallySession([essay(0, 10)])))).toBe(0);
  });

  it('an unanswered theory question still counts as marks available (earning 0)', () => {
    const t = tallySession([essay(null, 6, { answered: false, awardedScore: null }), mcq()]);
    expect(t.points).toBe(1);
    expect(t.maxPoints).toBe(7);
    expect(t.questionsAttempted).toBe(1);
  });

  it('a theory answer still waiting to be graded earns nothing yet, but its marks are available', () => {
    const t = tallySession([essay(null, 6)]);
    expect(t.points).toBe(0);
    expect(t.maxPoints).toBe(6);
  });

  it('awarded marks are clamped to 0..max (a bad value can never exceed 100% or go negative)', () => {
    expect(questionPoints(essay(9, 6)).earned).toBe(6);
    expect(questionPoints(essay(-3, 6)).earned).toBe(0);
    expect(questionPoints(essay(Number.NaN, 6)).earned).toBe(0);
  });

  it('keeps the old 50% pass rule for the "questions correct" count (streaks/XP are built on it)', () => {
    expect(tallySession([essay(3, 6)]).questionsCorrect).toBe(1);
    expect(tallySession([essay(2, 6)]).questionsCorrect).toBe(0);
    expect(tallySession([essay(2, 6)]).points).toBe(2); // ...but the marks still count
  });

  describe('essay max marks', () => {
    it('prefers the graded answer, then the question, then 10', () => {
      expect(essayMaxMarks({ answerMaxScore: 6, questionMaxScore: 8 })).toBe(6);
      expect(essayMaxMarks({ answerMaxScore: null, questionMaxScore: 8 })).toBe(8);
      expect(essayMaxMarks({ answerMaxScore: null, questionMaxScore: null })).toBe(10);
      expect(essayMaxMarks({ answerMaxScore: 0, questionMaxScore: 0 })).toBe(10);
    });
  });

  describe('subject and topic breakdowns are marks-based too', () => {
    const tally = tallySession([
      mcq({ subject: 'mathematics', topic: 'Algebra' }),
      essay(2, 6, { subject: 'mathematics', topic: 'Probability' }),
      mcq({ subject: 'physics', topic: 'Forces', isCorrect: false }),
    ]);
    const b = toBreakdowns(tally);

    it('subject percentage uses points, counts stay as counts', () => {
      const maths = b.subjectScores.find((s) => s.subject === 'mathematics')!;
      expect(maths.points).toBe(3);
      expect(maths.maxPoints).toBe(7);
      expect(maths.percentage).toBe(43);
      expect(maths.total).toBe(2);
      expect(maths.score).toBe(1); // questions counted correct: only the MCQ passed
      expect(b.subjectScores.find((s) => s.subject === 'physics')!.percentage).toBe(0);
    });

    it('a theory-only topic is no longer 0%', () => {
      const prob = b.topicBreakdown.find((t) => t.topic === 'Probability')!;
      expect(prob.score).toBe(33);
      expect(prob.points).toBe(2);
    });
  });
});

function pair(t: ReturnType<typeof tallySession>): [number, number] {
  return [t.points, t.maxPoints];
}
