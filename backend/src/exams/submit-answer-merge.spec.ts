jest.mock('src/redis/redis.module', () => ({ REDIS_CLIENT: 'REDIS_CLIENT' }));
jest.mock('src/storage/storage.service', () => ({ StorageService: class {} }));

import { ExamsService } from './exams.service';
import { StudentAnswer } from 'src/students/entities/student-answers.entity';
import { ExamMode, QuestionType, SessionStatus } from 'src/common/enums/enums';

/**
 * REGRESSION: in exam mode only the FIRST autosaved part ever persisted ("No answer given" for every other part).
 * Cause: submitAnswer merged `answerRepo.create({...})` into the saved answer with Object.assign. With target ES2023
 * a created entity has `id: undefined` as an OWN property, so the merge wiped the saved answer's id; save() then
 * INSERTed a second row and the session_question link failed with "duplicate key … (session_question_id)".
 */
function build() {
  const rows: StudentAnswer[] = [];
  let seq = 0;
  // A repo that behaves like TypeORM's for this purpose: save() INSERTs when there is no id, otherwise updates.
  const answerRepo = {
    create: jest.fn((o: object) => Object.assign(new StudentAnswer(), o)),
    save: jest.fn(async (a: StudentAnswer) => {
      if (!a.id) {
        a.id = `ans-${++seq}`;
        rows.push(a);
      } else {
        const i = rows.findIndex((r) => r.id === a.id);
        rows[i] = a;
      }
      return a;
    }),
  };
  const sq: { id: string; questionId: string; isAnswered: boolean; timeSpentSeconds: number; studentAnswer: StudentAnswer | null } = {
    id: 'sq1', questionId: 'q1', isAnswered: false, timeSpentSeconds: 0, studentAnswer: null,
  };
  const question = {
    id: 'q1', type: QuestionType.THEORY, maxScore: 4,
    structure: [{ label: '1', children: [{ label: '(i)', text: 'a', maxScore: 2 }, { label: '(ii)', text: 'b', maxScore: 2 }] }],
  };
  const svc = Object.create(ExamsService.prototype) as Record<string, unknown>;
  svc.loadOwnedSession = jest.fn(async () => ({ id: 's1', status: SessionStatus.IN_PROGRESS, mode: ExamMode.MOCK }));
  svc.isExpiredExam = jest.fn(() => false);
  svc.sessionQuestionRepo = { findOne: jest.fn(async () => sq), save: jest.fn(async (x: unknown) => x) };
  svc.questionRepo = { findOne: jest.fn(async () => question) };
  svc.answerRepo = answerRepo;
  return { svc: svc as unknown as ExamsService, rows, sq };
}

const submit = (svc: ExamsService, parts: { path: string; essayText: string }[]) =>
  svc.submitAnswer('u1', 's1', { sessionQuestionId: 'sq1', essayText: '', partAnswers: parts } as never);

describe('ExamsService.submitAnswer — saving part by part', () => {
  it('the second save UPDATES the same answer row instead of inserting a duplicate', async () => {
    const { svc, rows } = build();
    await submit(svc, [{ path: '1.(i)', essayText: 'Ammonia and HCl' }]);
    const firstId = rows[0].id;
    await submit(svc, [{ path: '1.(ii)', essayText: 'To show solubility' }]);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(firstId);
  });

  it('keeps every part the student wrote, across several saves', async () => {
    const { svc, rows, sq } = build();
    // The page links the saved answer to the session question after each save, as TypeORM does.
    const link = async () => { sq.studentAnswer = rows[0] ?? null; };
    await submit(svc, [{ path: '1.(i)', essayText: 'one' }]); await link();
    await submit(svc, [{ path: '1.(ii)', essayText: 'two' }]); await link();
    await submit(svc, [{ path: '1.(i)', essayText: 'one, edited' }]); await link();
    expect(rows).toHaveLength(1);
    expect(rows[0].partAnswers?.map((p) => [p.path, p.essayText])).toEqual([
      ['1.(i)', 'one, edited'],
      ['1.(ii)', 'two'],
    ]);
  });

  it('a plain (non-nested) essay re-save also keeps its row', async () => {
    const { svc, rows, sq } = build();
    (svc as unknown as { questionRepo: { findOne: jest.Mock } }).questionRepo.findOne = jest.fn(async () => ({
      id: 'q1', type: QuestionType.THEORY, maxScore: 10, structure: null,
    }));
    await svc.submitAnswer('u1', 's1', { sessionQuestionId: 'sq1', essayText: 'draft' } as never);
    sq.studentAnswer = rows[0];
    await svc.submitAnswer('u1', 's1', { sessionQuestionId: 'sq1', essayText: 'final' } as never);
    expect(rows).toHaveLength(1);
    expect(rows[0].essayText).toBe('final');
  });
});
