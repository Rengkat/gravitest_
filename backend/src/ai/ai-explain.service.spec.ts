jest.mock('src/redis/redis.module', () => ({ REDIS_CLIENT: 'REDIS_CLIENT' }));
jest.mock('src/questions/questions.service', () => ({ QuestionsService: class {} }));

import { ForbiddenException, HttpException } from '@nestjs/common';
import { AiExplainService } from './ai-explain.service';
import { AiImageError } from './ai-image.service';
import { ExamMode } from 'src/common/enums/enums';

const QID = '11111111-1111-1111-1111-111111111111';
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]).toString('base64');

const baseQuestion = {
  id: QID,
  questionText: 'In the diagram, PQ ∥ SR. Find the value of x.',
  options: [
    { label: 'A', text: '46°' }, { label: 'B', text: '48°' }, { label: 'C', text: '52°' }, { label: 'D', text: '66°' },
  ],
  answer: { correctLabel: 'B' },
  explanations: [{ text: 'Alternate angles are equal, so x = 48°.' }],
  questionImageUrl: null as string | null,
  passage: null,
};
const withDiagram = { ...baseQuestion, questionImageUrl: 'https://pub.example.r2.dev/q/diagram.png' };

function build(opts: {
  question?: typeof baseQuestion;
  sessions?: { mode: ExamMode; answerId: string | null; startedAt: Date; allowedDurationSeconds?: number | null }[];
  cached?: Record<string, unknown> | null;
  loadImages?: (refs: { label: string; url: string }[]) => Promise<unknown[]>;
  aiResult?: () => Promise<unknown>;
} = {}) {
  const question = opts.question ?? baseQuestion;
  const sessions = opts.sessions ?? [{ mode: ExamMode.PRACTICE, answerId: 'ans-1', startedAt: new Date() }];
  const cache = {
    findOne: jest.fn().mockResolvedValue(opts.cached ?? null),
    save: jest.fn(async (x: unknown) => x),
    create: jest.fn((x: object) => ({ ...x })),
  };
  const defaultAi = async () => ({ text: 'Because alternate angles are equal.', modelConfig: { modelId: 'gemini-x' } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const router = { complete: jest.fn(async (_params: any) => (opts.aiResult ?? defaultAi)()) };
  const prompts = { getActivePrompt: jest.fn().mockResolvedValue('SYSTEM') };
  const rate = { assertFeatureAllowedForTier: jest.fn(), assertWithinLimits: jest.fn() };
  const questions = { findOne: jest.fn().mockResolvedValue(question) };
  const real = new (jest.requireActual('./ai-image.service').AiImageService)({ publicBaseUrl: 'https://pub.example.r2.dev' });
  const images = {
    collectQuestionImages: jest.fn((q: unknown) => real.collectQuestionImages(q)),
    loadAll: jest.fn(
      opts.loadImages ??
        (async (refs: { label: string; url: string }[]) => refs.map((r) => ({ ...r, mimeType: 'image/png', data: PNG, bytes: 16 }))),
    ),
  };
  const qb: Record<string, jest.Mock> = {};
  for (const m of ['innerJoin', 'leftJoin', 'where', 'andWhere', 'select', 'addSelect']) qb[m] = jest.fn(() => qb);
  qb.getRawMany = jest.fn().mockResolvedValue(
    sessions.map((s) => ({ mode: s.mode, answerId: s.answerId, startedAt: s.startedAt, allowedDurationSeconds: s.allowedDurationSeconds ?? null })),
  );
  const dataSource = { getRepository: () => ({ createQueryBuilder: () => qb }) };

  const svc = new AiExplainService(cache as never, router as never, prompts as never, rate as never, questions as never, images as never, dataSource as never);
  return { svc, cache, router, images, rate };
}

const ask = (svc: AiExplainService, over: Record<string, unknown> = {}) =>
  svc.explain('user-1', { questionId: QID, studentAnswerLabel: 'C', detailLevel: 'standard', ...over } as never);

const thrown = async (p: Promise<unknown>) => (await p.then(() => null, (e) => e)) as HttpException;
const body = (e: HttpException) => e.getResponse() as { code: string; message: string; retryable?: boolean };

describe('text-only questions (existing workflow unchanged)', () => {
  it('explains without loading any image or requiring vision', async () => {
    const { svc, router, images, cache } = build();
    const out = await ask(svc);
    expect(out).toMatchObject({ explanation: 'Because alternate angles are equal.', cached: false, usedImages: 0 });
    expect(images.loadAll).not.toHaveBeenCalled();
    const call = router.complete.mock.calls[0][0];
    expect(call.requiresVision).toBe(false);
    expect(typeof call.messages[0].content).toBe('string');
    expect(cache.save).toHaveBeenCalledWith(expect.objectContaining({ visionUsed: false }));
  });

  it('serves a cached explanation without calling the AI', async () => {
    const { svc, router } = build({ cached: { explanation: 'cached!', hitCount: 3, visionUsed: false } });
    expect(await ask(svc)).toMatchObject({ explanation: 'cached!', cached: true });
    expect(router.complete).not.toHaveBeenCalled();
  });
});

describe('image-based questions', () => {
  it('sends the real image bytes to a vision model together with everything the explanation needs', async () => {
    const { svc, router, images } = build({ question: withDiagram });
    const out = await ask(svc, { detailLevel: 'detailed' });
    expect(out.usedImages).toBe(1);
    expect(images.loadAll).toHaveBeenCalledTimes(1);

    const call = router.complete.mock.calls[0][0];
    expect(call.requiresVision).toBe(true);
    const parts = call.messages[0].content as { type: string; text?: string; mimeType?: string; data?: string }[];
    expect(parts.find((p) => p.type === 'image_data')).toMatchObject({ mimeType: 'image/png', data: PNG }); // bytes, not a filename/URL

    const text = parts.filter((p) => p.type === 'text').map((p) => p.text).join('\n');
    expect(text).toContain('PQ ∥ SR');                                   // 1. question text
    expect(text).toMatch(/A\) 46°[\s\S]*D\) 66°/);                        // 3. all options
    expect(text).toContain('The student answered "C"');                   // 4. selected answer
    expect(text).toContain('Correct answer: B');                          // 5. correct answer
    expect(text).toContain('Alternate angles are equal, so x = 48°.');    // 6. stored explanation
    expect(text).toMatch(/tapped "Explain more"/);                        // 7. detail preference
    expect(text).toMatch(/Image 1: the question diagram/);
    expect(text).toMatch(/Look at every image carefully/i);
  });

  it('handles several images (question diagram + image options) and labels each one', async () => {
    const q = {
      ...withDiagram,
      options: [
        { label: 'A', text: '', imageUrl: 'https://pub.example.r2.dev/a.png' },
        { label: 'B', text: '', imageUrl: 'https://pub.example.r2.dev/b.png' },
      ],
    };
    const { svc, router } = build({ question: q as never });
    const out = await ask(svc);
    expect(out.usedImages).toBe(3);
    const parts = router.complete.mock.calls[0][0].messages[0].content as { type: string; text?: string }[];
    expect(parts.filter((p) => p.type === 'image_data')).toHaveLength(3);
    const captions = parts.filter((p) => p.text?.startsWith('Image ')).map((p) => p.text);
    expect(captions).toEqual([
      'Image 1 — the question diagram:',
      'Image 2 — the image for option A:',
      'Image 3 — the image for option B:',
    ]);
  });

  describe('failures are reported, never hidden', () => {
    it('an unreachable image is a retryable error, and the AI is NOT asked to explain without it', async () => {
      const err = new AiImageError('image_unreachable', "Sabi couldn't load the question diagram. Please try again in a moment.", 'HTTP 503 for pub.example.r2.dev/q/diagram.png');
      const { svc, router } = build({ question: withDiagram, loadImages: async () => { throw err; } });
      const e = await thrown(ask(svc));
      expect(e).toBeInstanceOf(HttpException);
      expect(body(e)).toMatchObject({ code: 'image_unreachable', retryable: true, message: err.publicMessage });
      expect(body(e).message).not.toMatch(/HTTP 503|r2\.dev/);
      expect(router.complete).not.toHaveBeenCalled(); // no silent text-only fallback
    });

    it('an unsupported image is a clear, non-retryable error', async () => {
      const err = new AiImageError('image_unsupported', "The question diagram is in a format Sabi can't read yet (it supports JPEG, PNG and WebP).", 'svg');
      const { svc, router } = build({ question: withDiagram, loadImages: async () => { throw err; } });
      const e = await thrown(ask(svc));
      expect(body(e)).toMatchObject({ code: 'image_unsupported', retryable: false });
      expect(e.getStatus()).toBe(422);
      expect(router.complete).not.toHaveBeenCalled();
    });

    it('when the vision AI fails: a friendly retryable error, one attempt only, and the raw provider error never reaches the student', async () => {
      const raw = 'Google AI error (429): {"error":"quota exceeded for project gcp-secret-123"}';
      const { svc, router } = build({ question: withDiagram, aiResult: async () => { throw new Error(raw); } });
      const e = await thrown(ask(svc));
      expect(body(e)).toMatchObject({ code: 'ai_unavailable', retryable: true });
      expect(JSON.stringify(e.getResponse())).not.toMatch(/quota|gcp-secret|Google AI error/);
      expect(e.getStatus()).toBe(503);
      expect(router.complete).toHaveBeenCalledTimes(1); // never retried as text-only
    });

    it('a text-only AI failure is also a friendly retryable error', async () => {
      const { svc } = build({ aiResult: async () => { throw new Error('boom'); } });
      expect(body(await thrown(ask(svc)))).toMatchObject({ code: 'ai_unavailable', retryable: true });
    });

    it('a failed attempt stores nothing in the cache', async () => {
      const { svc, cache } = build({ question: withDiagram, aiResult: async () => { throw new Error('x'); } });
      await thrown(ask(svc));
      expect(cache.save).not.toHaveBeenCalled();
    });
  });

  describe('cache never serves an explanation that was written blind to the diagram', () => {
    it('ignores a cached row made without vision, regenerates with the image, and updates that row (no duplicate)', async () => {
      const stale = { explanation: 'text-only guess', hitCount: 9, visionUsed: false };
      const { svc, router, cache } = build({ question: withDiagram, cached: stale });
      const out = await ask(svc);
      expect(out).toMatchObject({ explanation: 'Because alternate angles are equal.', cached: false });
      expect(router.complete).toHaveBeenCalledTimes(1);
      expect(cache.create).not.toHaveBeenCalled();
      expect(cache.save).toHaveBeenCalledWith(expect.objectContaining({ explanation: 'Because alternate angles are equal.', visionUsed: true }));
    });

    it('reuses a cached row that WAS made with the diagram', async () => {
      const good = { explanation: 'seen-the-diagram', hitCount: 1, visionUsed: true };
      const { svc, router } = build({ question: withDiagram, cached: good });
      expect(await ask(svc)).toMatchObject({ explanation: 'seen-the-diagram', cached: true });
      expect(router.complete).not.toHaveBeenCalled();
    });

    it('records visionUsed on a freshly generated image explanation', async () => {
      const { svc, cache } = build({ question: withDiagram });
      await ask(svc);
      expect(cache.save).toHaveBeenCalledWith(expect.objectContaining({ visionUsed: true }));
    });
  });
});

describe('attempt-before-explanation is preserved', () => {
  it('state 1: not attempted → locked with the existing message, and nothing else runs', async () => {
    const { svc, router, images, rate } = build({
      question: withDiagram,
      sessions: [{ mode: ExamMode.PRACTICE, answerId: null, startedAt: new Date() }],
    });
    const e = (await svc.explain('u', { questionId: QID } as never).catch((x) => x)) as ForbiddenException;
    expect(e).toBeInstanceOf(ForbiddenException);
    expect(e.getResponse()).toMatchObject({ code: 'attempt_first', message: expect.stringMatching(/answer this question first/i) });
    expect(rate.assertFeatureAllowedForTier).not.toHaveBeenCalled();
    expect(images.loadAll).not.toHaveBeenCalled();
    expect(router.complete).not.toHaveBeenCalled();
  });

  it('state 2: attempted → unlocked, even though an OLD abandoned session never answered it (the reported bug)', async () => {
    const day = 86_400_000;
    const { svc, router } = build({
      question: withDiagram,
      sessions: [
        { mode: ExamMode.PRACTICE, answerId: null, startedAt: new Date(Date.now() - 5 * day) },
        { mode: ExamMode.PRACTICE, answerId: 'ans-now', startedAt: new Date() },
      ],
    });
    await expect(ask(svc)).resolves.toMatchObject({ cached: false });
    expect(router.complete).toHaveBeenCalledTimes(1);
  });

  it('exam in progress → locked', async () => {
    const { svc, router } = build({ sessions: [{ mode: ExamMode.MOCK, answerId: 'a', startedAt: new Date(), allowedDurationSeconds: 3600 }] });
    const e = (await svc.explain('u', { questionId: QID } as never).catch((x) => x)) as ForbiddenException;
    expect(e.getResponse()).toMatchObject({ code: 'exam_in_progress' });
    expect(router.complete).not.toHaveBeenCalled();
  });
});
