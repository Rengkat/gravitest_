import { ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { AiTutorController } from './ai-tutor.controller';

/**
 * The SSE endpoint flushes its 200 headers BEFORE the AI runs, so a failure can
 * only be reported inside the stream. These tests pin what the client receives.
 */
describe('AiTutorController.streamMessage — error events', () => {
  let logged: jest.SpyInstance;
  beforeEach(() => { logged = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined); });
  afterEach(() => logged.mockRestore());

  const run = async (gen: () => AsyncGenerator<any>) => {
    const writes: string[] = [];
    const res: any = { setHeader: jest.fn(), flushHeaders: jest.fn(), write: (s: string) => writes.push(s), end: jest.fn() };
    const controller = new AiTutorController({ streamMessage: gen } as any);
    await controller.streamMessage('u1', {} as any, res);
    const events = writes.map((w) => JSON.parse(w.replace(/^data: /, '').trim()));
    return { events, res };
  };

  it('normal chunks pass through untouched and the stream is closed', async () => {
    const { events, res } = await run(async function* () {
      yield { delta: 'Hel', done: false };
      yield { delta: 'lo', done: true, conversationId: 'c1' };
    });
    expect(events).toEqual([{ delta: 'Hel', done: false }, { delta: 'lo', done: true, conversationId: 'c1' }]);
    expect(res.end).toHaveBeenCalled();
  });

  it('a paywall 403 keeps its status AND structured body so the client can show the upgrade prompt', async () => {
    const body = { code: 'UPGRADE_REQUIRED', feature: 'ai_tutor', requiredTier: 'basic', quota: null, message: 'AI Tutor is available on paid plans.' };
    const { events, res } = await run(async function* () { throw new ForbiddenException(body); });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ done: true, error: 'AI Tutor is available on paid plans.', errorStatus: 403, errorBody: body });
    expect(res.end).toHaveBeenCalled();
    expect(logged).not.toHaveBeenCalled(); // deliberate errors are not logged as failures
  });

  it('the router\'s generic AI failure (HTTP 500) is passed on as-is', async () => {
    const { events } = await run(async function* () { throw new InternalServerErrorException('AI service is temporarily unavailable.'); });
    expect(events[0]).toMatchObject({ error: 'AI service is temporarily unavailable.', errorStatus: 500 });
  });

  it('an UNEXPECTED error is logged with its real cause but the student only gets a generic line', async () => {
    const { events } = await run(async function* () { throw new Error('Groq error (401): invalid api key gsk_SECRETish'); });
    expect(events[0]).toMatchObject({ done: true, error: 'AI service is temporarily unavailable.', errorStatus: 500 });
    expect(JSON.stringify(events)).not.toMatch(/Groq|gsk_|invalid api key/);
    expect(String(logged.mock.calls[0][0])).toMatch(/Groq error \(401\)/);
  });

  it('an error after some text was already streamed still ends the stream with an error event', async () => {
    const { events } = await run(async function* () {
      yield { delta: 'Partial', done: false };
      throw new Error('socket hang up');
    });
    expect(events[0]).toEqual({ delta: 'Partial', done: false });
    expect(events[1]).toMatchObject({ done: true, errorStatus: 500 });
  });
});
