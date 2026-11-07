import { ExamMode, QuestionType, SessionStatus } from 'src/common/enums/enums';
import { EssayScoringStatus } from 'src/students/entities/student-answers.entity';
import { isActiveExam, isCorrectionReleased, AttemptFacts, UNTIMED_ACTIVE_WINDOW_HOURS } from './release-rules.util';

const base: AttemptFacts = {
  mode: ExamMode.PRACTICE,
  sessionStatus: SessionStatus.IN_PROGRESS,
  questionType: QuestionType.MCQ,
  hasAnswer: false,
  scoringStatus: null,
  partScores: null,
  partPath: null,
};
const f = (o: Partial<AttemptFacts>): AttemptFacts => ({ ...base, ...o });

describe('isCorrectionReleased — Practice mode', () => {
  it('keeps a question locked until it has been attempted', () => {
    expect(isCorrectionReleased(f({ hasAnswer: false }))).toBe(false);
  });
  it('opens an MCQ the moment the answer is saved (that is when the correct answer is revealed)', () => {
    expect(isCorrectionReleased(f({ hasAnswer: true }))).toBe(true);
  });
  it.each([QuestionType.TRUE_FALSE, QuestionType.OBJECTIVE, QuestionType.FILL_BLANKS])('treats %s like an objective question', (t) => {
    expect(isCorrectionReleased(f({ questionType: t, hasAnswer: true }))).toBe(true);
  });

  describe('theory / practical', () => {
    const essay = (o: Partial<AttemptFacts>) => f({ questionType: QuestionType.THEORY, hasAnswer: true, ...o });
    it('stays locked after submitting an answer until it is actually graded', () => {
      expect(isCorrectionReleased(essay({ scoringStatus: EssayScoringStatus.PENDING }))).toBe(false);
    });
    it('opens once graded (or graded-with-review)', () => {
      expect(isCorrectionReleased(essay({ scoringStatus: EssayScoringStatus.SCORED }))).toBe(true);
      expect(isCorrectionReleased(essay({ scoringStatus: EssayScoringStatus.NEEDS_REVIEW }))).toBe(true);
    });
    it('opens a sub-question only when THAT part has been graded', () => {
      const scores = [{ path: '1.(a)', status: 'scored' }];
      expect(isCorrectionReleased(essay({ partPath: '1.(a)', partScores: scores, scoringStatus: EssayScoringStatus.PENDING }))).toBe(true);
      expect(isCorrectionReleased(essay({ partPath: '1.(b)', partScores: scores, scoringStatus: EssayScoringStatus.PENDING }))).toBe(false);
    });
    it('does not open a part whose grading failed', () => {
      expect(isCorrectionReleased(essay({ partPath: '1.(a)', partScores: [{ path: '1.(a)', status: 'failed' }] }))).toBe(false);
    });
  });
});

describe('isCorrectionReleased — Exam (mock) mode', () => {
  const mock = (o: Partial<AttemptFacts>) => f({ mode: ExamMode.MOCK, ...o });

  it.each([true, false])('is NEVER released while the exam is in progress (answered=%s)', (hasAnswer) => {
    for (const questionType of [QuestionType.MCQ, QuestionType.THEORY, QuestionType.PRACTICAL]) {
      expect(isCorrectionReleased(mock({ hasAnswer, questionType, scoringStatus: EssayScoringStatus.SCORED }))).toBe(false);
    }
  });

  it('is not released for scheduled/pending/cancelled sessions either', () => {
    for (const sessionStatus of [SessionStatus.SCHEDULED, SessionStatus.PENDING, SessionStatus.CANCELLED, SessionStatus.ONGOING]) {
      expect(isCorrectionReleased(mock({ sessionStatus, hasAnswer: true }))).toBe(false);
    }
  });

  it.each([SessionStatus.SUBMITTED, SessionStatus.TIMED_OUT])('releases MCQ once the exam is %s', (sessionStatus) => {
    expect(isCorrectionReleased(mock({ sessionStatus, hasAnswer: true }))).toBe(true);
    expect(isCorrectionReleased(mock({ sessionStatus, hasAnswer: false }))).toBe(true);
  });

  it('holds theory/practical until grading has finished, even after submission', () => {
    const done = (o: Partial<AttemptFacts>) =>
      mock({ sessionStatus: SessionStatus.SUBMITTED, questionType: QuestionType.THEORY, hasAnswer: true, ...o });
    expect(isCorrectionReleased(done({ scoringStatus: EssayScoringStatus.PENDING }))).toBe(false);
    expect(isCorrectionReleased(done({ scoringStatus: EssayScoringStatus.SCORED }))).toBe(true);
    expect(isCorrectionReleased(done({ scoringStatus: EssayScoringStatus.NEEDS_REVIEW }))).toBe(true);
  });

  it('releases an unanswered theory question once the exam is finished (nothing left to grade)', () => {
    expect(isCorrectionReleased(mock({ sessionStatus: SessionStatus.SUBMITTED, questionType: QuestionType.PRACTICAL, hasAnswer: false }))).toBe(true);
  });
});

describe('isActiveExam', () => {
  const now = Date.parse('2026-11-08T12:00:00Z');
  const mk = (o: Partial<Parameters<typeof isActiveExam>[0]>) => ({
    mode: ExamMode.MOCK,
    status: SessionStatus.IN_PROGRESS,
    startedAt: new Date(now - 10 * 60_000),
    allowedDurationSeconds: 3600 as number | null,
    ...o,
  });

  it('is true for a timed mock exam inside its window', () => expect(isActiveExam(mk({}), now)).toBe(true));
  it('stays true through the submit grace period', () => {
    expect(isActiveExam(mk({ startedAt: new Date(now - 3600_000 - 10_000) }), now)).toBe(true);
  });
  it('is false once the deadline + grace has passed (it will be auto-submitted)', () => {
    expect(isActiveExam(mk({ startedAt: new Date(now - 3600_000 - 60_000) }), now)).toBe(false);
  });
  it('is false for practice sessions and finished sessions', () => {
    expect(isActiveExam(mk({ mode: ExamMode.PRACTICE }), now)).toBe(false);
    expect(isActiveExam(mk({ status: SessionStatus.SUBMITTED }), now)).toBe(false);
  });
  it('does not let an abandoned untimed exam block discussions forever', () => {
    const untimed = (hoursAgo: number) => mk({ allowedDurationSeconds: null, startedAt: new Date(now - hoursAgo * 3600_000) });
    expect(isActiveExam(untimed(1), now)).toBe(true);
    expect(isActiveExam(untimed(UNTIMED_ACTIVE_WINDOW_HOURS + 1), now)).toBe(false);
  });
});
