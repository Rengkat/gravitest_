import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DiscussionAccessService } from './discussion-access.service';
import { ExamMode, QuestionType, SessionStatus, UserRole } from 'src/common/enums/enums';
import { EssayScoringStatus } from 'src/students/entities/student-answers.entity';

const STUDENT = { id: 'u1', role: UserRole.STUDENT };
const Q = 'q-1';

interface Attempt { mode: ExamMode; status: SessionStatus; answerId: string | null; scoringStatus: EssayScoringStatus | null; partScores: any }

function build(opts: {
  question?: any | null;
  profile?: boolean;
  liveSessions?: any[];
  attempts?: Attempt[];
}) {
  const question = opts.question === undefined ? { id: Q, type: QuestionType.MCQ, structure: null } : opts.question;
  const questions = { findOne: jest.fn().mockResolvedValue(question), update: jest.fn() };
  const sessions = { find: jest.fn().mockResolvedValue(opts.liveSessions ?? []) };
  const qb = {
    innerJoin: () => qb, leftJoin: () => qb, select: () => qb, where: () => qb, andWhere: () => qb,
    getRawMany: jest.fn().mockResolvedValue(opts.attempts ?? []),
    getOne: jest.fn().mockResolvedValue(opts.profile === false ? null : { id: 'p1' }),
  };
  const sessionQuestions = { createQueryBuilder: () => qb };
  const profiles = { createQueryBuilder: () => qb };
  const svc = new DiscussionAccessService(questions as never, sessions as never, sessionQuestions as never, profiles as never);
  return { svc, questions };
}

const attempt = (o: Partial<Attempt>): Attempt => ({
  mode: ExamMode.PRACTICE, status: SessionStatus.IN_PROGRESS, answerId: 'a1', scoringStatus: null, partScores: null, ...o,
});
const live = () => ({ id: 's', mode: ExamMode.MOCK, status: SessionStatus.IN_PROGRESS, startedAt: new Date(), allowedDurationSeconds: 3600 });

describe('DiscussionAccessService.assertCanAccess', () => {
  it('opens a practice MCQ after it has been attempted', async () => {
    const { svc } = build({ attempts: [attempt({})] });
    await expect(svc.assertCanAccess(STUDENT, { questionId: Q, partId: null })).resolves.toEqual({ partPath: null });
  });

  it('keeps a practice question locked before the attempt', async () => {
    const { svc } = build({ attempts: [attempt({ answerId: null })] });
    await expect(svc.assertCanAccess(STUDENT, { questionId: Q, partId: null })).rejects.toMatchObject({
      response: { code: 'discussion_locked' },
    });
  });

  it('locks a question the student has never encountered at all', async () => {
    const { svc } = build({ attempts: [] });
    await expect(svc.assertCanAccess(STUDENT, { questionId: Q, partId: null })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses everything during a live exam — even a question previously unlocked in practice', async () => {
    const { svc } = build({ liveSessions: [live()], attempts: [attempt({})] });
    await expect(svc.assertCanAccess(STUDENT, { questionId: Q, partId: null })).rejects.toMatchObject({
      response: { code: 'exam_in_progress' },
    });
  });

  it('refuses a question whose only attempt is the live exam', async () => {
    const { svc } = build({ liveSessions: [live()], attempts: [attempt({ mode: ExamMode.MOCK, answerId: 'x' })] });
    await expect(svc.assertCanAccess(STUDENT, { questionId: Q, partId: null })).rejects.toMatchObject({
      response: { code: 'exam_in_progress' },
    });
  });

  it('opens an exam question after submission', async () => {
    const { svc } = build({ attempts: [attempt({ mode: ExamMode.MOCK, status: SessionStatus.SUBMITTED })] });
    await expect(svc.assertCanAccess(STUDENT, { questionId: Q, partId: null })).resolves.toBeDefined();
  });

  it('does not let an expired, abandoned exam lock discussions forever', async () => {
    const stale = { ...live(), startedAt: new Date(Date.now() - 5 * 3600_000) };
    const { svc } = build({ liveSessions: [stale], attempts: [attempt({})] });
    await expect(svc.assertCanAccess(STUDENT, { questionId: Q, partId: null })).resolves.toBeDefined();
  });

  it('holds an exam theory question until grading finishes', async () => {
    const theory = { id: Q, type: QuestionType.THEORY, structure: null };
    const pending = build({ question: theory, attempts: [attempt({ mode: ExamMode.MOCK, status: SessionStatus.SUBMITTED, scoringStatus: EssayScoringStatus.PENDING })] });
    await expect(pending.svc.assertCanAccess(STUDENT, { questionId: Q, partId: null })).rejects.toBeInstanceOf(ForbiddenException);
    const graded = build({ question: theory, attempts: [attempt({ mode: ExamMode.MOCK, status: SessionStatus.SUBMITTED, scoringStatus: EssayScoringStatus.SCORED })] });
    await expect(graded.svc.assertCanAccess(STUDENT, { questionId: Q, partId: null })).resolves.toBeDefined();
  });

  it('unlocks a practice sub-question only when that part was graded', async () => {
    const structure = [{ id: 'pa', label: '1', children: [{ id: 'p-a', label: '(a)', maxScore: 2 }, { id: 'p-b', label: '(b)', maxScore: 2 }] }];
    const mk = () => build({
      question: { id: Q, type: QuestionType.THEORY, structure },
      attempts: [attempt({ scoringStatus: EssayScoringStatus.PENDING, partScores: [{ path: '1.(a)', status: 'scored' }] })],
    });
    await expect(mk().svc.assertCanAccess(STUDENT, { questionId: Q, partId: 'p-a' })).resolves.toEqual({ partPath: '1.(a)' });
    await expect(mk().svc.assertCanAccess(STUDENT, { questionId: Q, partId: 'p-b' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a part id that belongs to a different question', async () => {
    const { svc } = build({ question: { id: Q, type: QuestionType.THEORY, structure: [{ id: 'x', label: '1', maxScore: 1 }] }, attempts: [attempt({})] });
    await expect(svc.assertCanAccess(STUDENT, { questionId: Q, partId: 'someone-elses-part' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404s an unknown question', async () => {
    const { svc } = build({ question: null });
    await expect(svc.assertCanAccess(STUDENT, { questionId: Q, partId: null })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('backfills part ids on a legacy structure, once, then resolves normally', async () => {
    const legacy = [{ label: '1', text: 'x', maxScore: 3 }];
    const { svc, questions } = build({ question: { id: Q, type: QuestionType.THEORY, structure: legacy }, attempts: [attempt({ scoringStatus: EssayScoringStatus.SCORED })] });
    const { question } = await svc.resolveThread(Q, null);
    expect(question).toBeDefined();
    await expect(svc.resolveThread(Q, 'unknown')).rejects.toBeInstanceOf(BadRequestException);
    expect(questions.update).toHaveBeenCalledTimes(1);
    const saved = questions.update.mock.calls[0][1].structure;
    expect(saved[0].id).toEqual(expect.any(String));
  });

  it('lets admins moderate any discussion without having attempted it', async () => {
    const { svc } = build({ attempts: [], liveSessions: [live()] });
    await expect(svc.assertCanAccess({ id: 'a', role: UserRole.ADMIN }, { questionId: Q, partId: null })).resolves.toBeDefined();
  });

  it('denies a user with no student profile', async () => {
    const { svc } = build({ profile: false });
    await expect(svc.assertCanAccess(STUDENT, { questionId: Q, partId: null })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
