/**
 * Question bank LIST — real Postgres, real DTO + the app's exact ValidationPipe.
 *
 * Two admin-reported bugs this guards:
 *  1. Status filter: "Draft" returned PUBLISHED questions. (enableImplicitConversion
 *     turned the string "false" into true BEFORE @Transform(toBoolean) saw it.)
 *  2. A page showed 5 questions for limit=20 while the footer said "Page 1 of 3".
 *     (ordering a paginated query by a joined one-to-many column made TypeORM's
 *     page-id query return one row per OPTION: 20 rows / 4 options = 5 questions.)
 *
 * Run:   TEST_DATABASE_URL=postgres://user:pass@localhost:5432/scratch npx jest questions-list
 * WARNING: the target database's schema is DROPPED and recreated.
 */
import * as path from 'path';
import { DataSource } from 'typeorm';
import { ValidationPipe } from '@nestjs/common';

import { QuestionsService } from './questions.service';
import { QuestionFiltersDto } from './dto/update-question.dto';
import { Question } from './entities/question.entity';
import { QuestionAnswer } from './entities/question-answer.entity';
import { Passage } from './entities/passage.entity';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { CandidateType, DifficultyLevel, ExamType, QuestionType, Subject } from 'src/common/enums/enums';

const URL = process.env.TEST_DATABASE_URL;
const suite = URL ? describe : describe.skip;

// EXACT options from src/main.ts
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: false,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
});
/** What GET /questions?… hands the service. */
const parse = (query: Record<string, string>) =>
  pipe.transform(query, { type: 'query', metatype: QuestionFiltersDto } as any) as Promise<QuestionFiltersDto>;

suite('question bank list (real Postgres + real validation pipe)', () => {
  let ds: DataSource;
  let svc: QuestionsService;

  const TOTAL = 50;
  const PUBLISHED = 15; // the other 35 are drafts — same shape as the reported bank

  beforeAll(async () => {
    ds = new DataSource({
      type: 'postgres', url: URL,
      entities: [path.join(__dirname, '../**/*.entity.{ts,js}')],
      synchronize: true, dropSchema: true,
    });
    await ds.initialize();
    svc = new QuestionsService(
      ds.getRepository(Question), ds.getRepository(QuestionAnswer), ds,
      new PaginationProvider(), {} as any, ds.getRepository(Passage),
    );

    const repo = ds.getRepository(Question);
    for (let i = 0; i < TOTAL; i++) {
      const q = repo.create({
        examType: ExamType.WAEC, candidateType: CandidateType.SCHOOL, subject: Subject.MATHEMATICS,
        year: 2023, difficulty: DifficultyLevel.MEDIUM, type: QuestionType.MCQ,
        questionText: `Question ${i + 1}`, topic: 'Algebra',
        isActive: i < PUBLISHED,
        options: ['A', 'B', 'C', 'D'].map((label, n) => ({ label, text: `opt ${label}`, order: n + 1 })) as any,
      } as any);
      await repo.save(q);
    }
  }, 120_000);
  afterAll(async () => { if (ds?.isInitialized) await ds.destroy(); });

  const list = async (query: Record<string, string>) => svc.findAll(await parse({ examType: 'waec', ...query }));

  // ── Page size ────────────────────────────────────────────────────────────
  describe('page size', () => {
    it.each([10, 20])('limit=%i returns exactly that many QUESTIONS (not rows/options)', async (limit) => {
      const r = await list({ page: '1', limit: String(limit) });
      expect(r.data).toHaveLength(limit);
      expect(r.meta).toMatchObject({ totalItems: TOTAL, itemsPerPage: limit, itemCount: limit });
    });

    it('every question on the page still carries ALL its options, in A–D order', async () => {
      const r = await list({ page: '1', limit: '10' });
      for (const q of r.data) expect(q.options.map((o) => o.label)).toEqual(['A', 'B', 'C', 'D']);
    });

    it('paging with limit=10 walks all 50 questions exactly once (no gaps, no repeats)', async () => {
      const seen: string[] = [];
      for (let page = 1; page <= 5; page++) seen.push(...(await list({ page: String(page), limit: '10' })).data.map((q) => q.id));
      expect(seen).toHaveLength(TOTAL);
      expect(new Set(seen).size).toBe(TOTAL);
      expect((await list({ page: '6', limit: '10' })).data).toHaveLength(0);
    });

    it('the footer is consistent with the rows: totalPages × limit covers totalItems', async () => {
      const r = await list({ page: '1', limit: '10' });
      expect(r.meta.totalPages).toBe(5);
    });
  });

  // ── Status filter ────────────────────────────────────────────────────────
  describe('status filter (Published / Draft / All)', () => {
    it('isActive=false (Draft) returns ONLY drafts', async () => {
      const r = await list({ isActive: 'false', limit: '100' });
      expect(r.meta.totalItems).toBe(TOTAL - PUBLISHED);
      expect(r.data.every((q) => q.isActive === false)).toBe(true);
    });

    it('isActive=true (Published) returns ONLY published', async () => {
      const r = await list({ isActive: 'true', limit: '100' });
      expect(r.meta.totalItems).toBe(PUBLISHED);
      expect(r.data.every((q) => q.isActive === true)).toBe(true);
    });

    it('no isActive (All statuses / Clear) returns BOTH published and drafts', async () => {
      const r = await list({ limit: '100' });
      expect(r.meta.totalItems).toBe(TOTAL);
      expect(new Set(r.data.map((q) => q.isActive))).toEqual(new Set([true, false]));
    });

    it('Published + Draft + Draft-with-paging add up (and never overlap)', async () => {
      const pub = await list({ isActive: 'true', limit: '100' });
      const dra = await list({ isActive: 'false', limit: '100' });
      const ids = [...pub.data, ...dra.data].map((q) => q.id);
      expect(new Set(ids).size).toBe(TOTAL);
    });

    it('a Draft page of 10 is 10 drafts', async () => {
      const r = await list({ isActive: 'false', page: '1', limit: '10' });
      expect(r.data).toHaveLength(10);
      expect(r.data.every((q) => !q.isActive)).toBe(true);
      expect(r.meta.totalPages).toBe(4); // 35 drafts / 10
    });

    it('a garbage status value is rejected with a clean validation error, not silently treated as a filter', async () => {
      const err: any = await parse({ examType: 'waec', isActive: 'maybe' }).catch((e) => e);
      expect(err.getStatus()).toBe(400);
      expect(JSON.stringify(err.getResponse())).toMatch(/isActive must be a boolean/);
    });
  });
});
