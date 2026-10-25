import { InternalServerErrorException, Logger } from '@nestjs/common';
import { AiRouterService } from './ai-router.service';
import { AIFeature, AIProvider } from 'src/common/enums/enums';

/**
 * When BOTH models fail the client only ever sees a generic 500. The operator
 * must still be able to learn WHY from the logs — previously only the primary
 * model's failure was logged and the fallback's cause was swallowed.
 */
describe('AiRouterService — failure visibility', () => {
  const primary: any = {
    modelId: 'openai/gpt-oss-120b',
    provider: AIProvider.GROQ,
    costInputPerMillion: 0,
    costOutputPerMillion: 0,
  };
  const fallback: any = {
    modelId: 'mistral-small-latest',
    provider: AIProvider.MISTRAL,
    costInputPerMillion: 0,
    costOutputPerMillion: 0,
  };
  let warn: jest.SpyInstance;
  let usageSave: jest.Mock;
  let providers: Record<string, any>;
  let svc: AiRouterService;

  beforeEach(() => {
    warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    usageSave = jest.fn().mockResolvedValue({});
    providers = {
      [AIProvider.GROQ]: { complete: jest.fn(), stream: jest.fn() },
      [AIProvider.MISTRAL]: { complete: jest.fn(), stream: jest.fn() },
    };
    const models: any = {
      findOne: jest.fn(async ({ where }: any) =>
        where.modelId === primary.modelId
          ? primary
          : where.modelId === fallback.modelId
            ? fallback
            : null,
      ),
    };
    const mappings: any = {
      findOne: jest
        .fn()
        .mockResolvedValue({
          isEnabled: true,
          primaryModelId: primary.modelId,
          fallbackModelId: fallback.modelId,
          maxTokens: 500,
          temperature: 0.5,
        }),
    };
    const usage: any = { create: (x: any) => x, save: usageSave };
    svc = new AiRouterService(models, mappings, usage, {
      get: (p: string) => providers[p],
    } as any);
  });
  afterEach(() => warn.mockRestore());

  const params: any = {
    feature: AIFeature.SABI_TUTOR,
    userId: 'u1',
    systemPrompt: 's',
    messages: [{ role: 'user', content: 'hi' }],
  };

  it('complete(): logs BOTH the primary and the fallback failure cause, still returns a generic 500', async () => {
    providers[AIProvider.GROQ].complete.mockRejectedValue(
      new Error('Groq error (401): invalid api key'),
    );
    providers[AIProvider.MISTRAL].complete.mockRejectedValue(
      new Error('Mistral error (401): Unauthorized'),
    );
    const err: any = await svc.complete(params).catch((e) => e);
    expect(err).toBeInstanceOf(InternalServerErrorException);
    expect(String(err.message)).toBe('AI service is temporarily unavailable.'); // nothing leaked to the client
    const logged = warn.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logged).toMatch(
      /Primary model "openai\/gpt-oss-120b" failed: Groq error \(401\)/,
    );
    expect(logged).toMatch(
      /Fallback model "mistral-small-latest" failed: Mistral error \(401\)/,
    );
    expect(usageSave).toHaveBeenCalled(); // failure still recorded in the usage log
  });

  it('complete(): primary fails, fallback succeeds → answer returned, fallback flagged', async () => {
    providers[AIProvider.GROQ].complete.mockRejectedValue(new Error('boom'));
    providers[AIProvider.MISTRAL].complete.mockResolvedValue({
      text: 'ok',
      tokensInput: 1,
      tokensOutput: 1,
      responseTimeMs: 5,
      modelId: fallback.modelId,
    });
    const r = await svc.complete(params);
    expect(r.text).toBe('ok');
    expect(usageSave.mock.calls.at(-1)![0]).toMatchObject({
      usedFallback: true,
      success: true,
    });
  });

  it('stream(): a failing fallback is logged and surfaces as the same generic 500 (not a raw provider error)', async () => {
    const fail = (msg: string) => ({
      next: () => Promise.reject(new Error(msg)),
      [Symbol.asyncIterator]() {
        return this;
      },
    });
    providers[AIProvider.GROQ].stream.mockReturnValue(fail('Groq stream down'));
    providers[AIProvider.MISTRAL].stream.mockReturnValue(
      fail('Mistral stream down: secret-ish detail'),
    );
    const run = async () => {
      for await (const _ of svc.stream(params)) {
        /* drain */
      }
    };
    const err: any = await run().catch((e) => e);
    expect(err).toBeInstanceOf(InternalServerErrorException);
    expect(String(err.message)).not.toMatch(/secret-ish/);
    const logged = warn.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logged).toMatch(
      /Fallback stream model "mistral-small-latest" failed: Mistral stream down/,
    );
  });
});
