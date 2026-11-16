jest.mock('src/redis/redis.module', () => ({ REDIS_CLIENT: 'REDIS_CLIENT' }));
jest.mock('src/storage/storage.service', () => ({ StorageService: class {} }));

import { ExamSession } from 'src/students/entities/exam-session.entity';
import { ExamsService } from './exams.service';
import { SessionScoreBackfillService } from './session-score-backfill.service';
import { EssayScoringStatus } from 'src/students/entities/student-answers.entity';
import { QuestionType, SessionStatus } from 'src/common/enums/enums';

const session = (o: Partial<ExamSession> = {}) =>
  Object.assign(new ExamSession(), {
    id: 's1', status: SessionStatus.SUBMITTED, totalQuestions: 1, questionsCorrect: 0,
    scorePoints: null, maxPoints: null, percentage: 0, subjectScores: [], topicBreakdown: [], ...o,
  });

describe('ExamSession.percentage', () => {
  it('is marks-based when points are recorded', () => {
    const s = session({ scorePoints: 2, maxPoints: 6 });
    s.recalculate();
    expect(s.percentage).toBeCloseTo(33.33, 1);
  });

  it('falls back to the old count-based figure for sessions saved before marks-based scoring', () => {
    const s = session({ totalQuestions: 4, questionsCorrect: 3 });
    s.recalculate();
    expect(s.percentage).toBe(75);
  });

  it('is 0 for an empty session, never NaN', () => {
    const s = session({ totalQuestions: 0, maxPoints: 0, scorePoints: 0 });
    s.recalculate();
    expect(s.percentage).toBe(0);
  });
});

function serviceWith(opts: { sess: ExamSession | null; rows: unknown[]; questions: unknown[] }) {
  const saved: ExamSession[] = [];
  const svc = Object.create(ExamsService.prototype) as Record<string, unknown>;
  svc.sessionRepo = { findOne: jest.fn(async () => opts.sess), save: jest.fn(async (s: ExamSession) => (saved.push(s), s)) };
  svc.sessionQuestionRepo = { find: jest.fn(async () => opts.rows) };
  svc.questionRepo = { find: jest.fn(async () => opts.questions) };
  return { svc: svc as unknown as ExamsService, saved };
}

const theoryQuestion = { id: 'q1', type: QuestionType.THEORY, subject: 'mathematics', topic: 'Probability', maxScore: 6, structure: null };
const scoredAnswer = (awarded: number) => ({
  id: 'a1', isCorrect: false, awardedScore: awarded, maxScore: 6, scoringStatus: EssayScoringStatus.SCORED,
});

describe('ExamsService.recomputeSessionScores', () => {
  it('THE REPORTED SCENARIO: one theory question graded 2/6 → session is 33%, not 0%', async () => {
    const { svc, saved } = serviceWith({
      sess: session(),
      rows: [{ questionId: 'q1', order: 1, studentAnswer: scoredAnswer(2) }],
      questions: [theoryQuestion],
    });
    expect(await svc.recomputeSessionScores('s1')).toBe(true);
    const s = saved[0];
    expect(s.scorePoints).toBe(2);
    expect(s.maxPoints).toBe(6);
    expect(s.percentage).toBeCloseTo(33.33, 1);
    expect(s.questionsCorrect).toBe(0); // below the 50% pass mark: not a "correct question"...
    expect(s.subjectScores?.[0]).toMatchObject({ subject: 'mathematics', percentage: 33, points: 2, maxPoints: 6 });
    expect(s.topicBreakdown?.[0]).toMatchObject({ topic: 'Probability', score: 33 });
  });

  it('is idempotent: running it again changes nothing (no double counting)', async () => {
    const mk = () => serviceWith({
      sess: session(),
      rows: [{ questionId: 'q1', order: 1, studentAnswer: scoredAnswer(4) }],
      questions: [theoryQuestion],
    });
    const first = mk();
    await first.svc.recomputeSessionScores('s1');
    const again = serviceWith({
      sess: first.saved[0],
      rows: [{ questionId: 'q1', order: 1, studentAnswer: scoredAnswer(4) }],
      questions: [theoryQuestion],
    });
    await again.svc.recomputeSessionScores('s1');
    expect(again.saved[0].scorePoints).toBe(4);
    expect(again.saved[0].percentage).toBeCloseTo(66.67, 1);
  });

  it('a regraded answer updates the session: pending (0%) → graded 5/6 (83%)', async () => {
    const pending = { id: 'a1', isCorrect: false, awardedScore: null, maxScore: null, scoringStatus: EssayScoringStatus.PENDING };
    const before = serviceWith({ sess: session(), rows: [{ questionId: 'q1', order: 1, studentAnswer: pending }], questions: [theoryQuestion] });
    await before.svc.recomputeSessionScores('s1');
    expect(before.saved[0].percentage).toBe(0);
    expect(before.saved[0].maxPoints).toBe(6); // marks available even before grading

    const after = serviceWith({ sess: before.saved[0], rows: [{ questionId: 'q1', order: 1, studentAnswer: scoredAnswer(5) }], questions: [theoryQuestion] });
    await after.svc.recomputeSessionScores('s1');
    expect(after.saved[0].percentage).toBeCloseTo(83.33, 1);
    expect(after.saved[0].questionsCorrect).toBe(1);
  });

  it('upgrades a legacy session that has MCQ + theory, keeping the MCQ result', async () => {
    const mcq = { id: 'q2', type: QuestionType.MCQ, subject: 'mathematics', topic: 'Algebra', maxScore: null, structure: null };
    const { svc, saved } = serviceWith({
      sess: session({ totalQuestions: 2, questionsCorrect: 1, percentage: 50 }),
      rows: [
        { questionId: 'q2', order: 1, studentAnswer: { id: 'a0', isCorrect: true, awardedScore: null, maxScore: null, scoringStatus: EssayScoringStatus.NOT_APPLICABLE } },
        { questionId: 'q1', order: 2, studentAnswer: scoredAnswer(3) },
      ],
      questions: [mcq, theoryQuestion],
    });
    await svc.recomputeSessionScores('s1');
    expect(saved[0].scorePoints).toBe(4); // 1 (MCQ) + 3 (theory marks)
    expect(saved[0].maxPoints).toBe(7);
    expect(saved[0].percentage).toBeCloseTo(57.14, 1);
  });

  it('uses the sum of part marks when the question has no maxScore of its own', async () => {
    const structured = {
      ...theoryQuestion, maxScore: null,
      structure: [{ label: '(a)', maxScore: 3 }, { label: '(b)', maxScore: 1 }],
    };
    const unanswered = null;
    const { svc, saved } = serviceWith({ sess: session(), rows: [{ questionId: 'q1', order: 1, studentAnswer: unanswered }], questions: [structured] });
    await svc.recomputeSessionScores('s1');
    expect(saved[0].maxPoints).toBe(4);
    expect(saved[0].scorePoints).toBe(0);
  });

  it('leaves unfinished or missing sessions alone', async () => {
    expect(await serviceWith({ sess: null, rows: [], questions: [] }).svc.recomputeSessionScores('x')).toBe(false);
    const running = session({ status: SessionStatus.IN_PROGRESS });
    const { svc, saved } = serviceWith({ sess: running, rows: [], questions: [] });
    expect(await svc.recomputeSessionScores('s1')).toBe(false);
    expect(saved).toHaveLength(0);
  });
});

describe('SessionScoreBackfillService', () => {
  it('recalculates every completed session that has no marks recorded, in batches', async () => {
    const find = jest.fn()
      .mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }])
      .mockResolvedValueOnce([{ id: 'c' }])
      .mockResolvedValueOnce([]);
    const recompute = jest.fn(async () => true);
    const svc = new SessionScoreBackfillService({ find } as never, { recomputeSessionScores: recompute } as never);
    expect(await svc.run(2)).toBe(3);
    expect(recompute.mock.calls.map((c) => (c as unknown[])[0])).toEqual(['a', 'b', 'c']);
    // pages by id so it can never loop on the same rows
    expect(find.mock.calls[1][0].where.id).toBeDefined();
  });

  it('one bad session does not stop the rest', async () => {
    const find = jest.fn().mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }]).mockResolvedValueOnce([]);
    const recompute = jest.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(true);
    const svc = new SessionScoreBackfillService({ find } as never, { recomputeSessionScores: recompute } as never);
    expect(await svc.run()).toBe(1);
  });
});
