import { Injectable } from '@nestjs/common';
import {
  AiCompletionParams,
  AiCompletionResult,
  AiProvider,
  AiStreamChunk,
} from '../interfaces/ai-provider.interface';

// Gemini 2.5+/3.x are "thinking" models: hidden reasoning tokens count against
// `maxOutputTokens`, so a tight cap (e.g. 800) can come back empty or cut off
// mid-answer. Give them headroom on top of the caller's cap.
const GEMINI_THINKING_MODEL = /^gemini-(2\.5|[3-9])/i;
const GEMINI_THINKING_HEADROOM = 1024;
const IMAGE_FETCH_TIMEOUT_MS = 15_000;

// Gemini 3.5+ (3.5 Flash-Lite, 3.6/3.7/3.8 Flash, 4.x) deprecate the sampling
// parameters temperature/top_p/top_k: they are ignored today and become an
// HTTP 400 in future model generations. Don't send them to those models.
// (Older ids such as gemini-3-flash-preview / 3.1 / 2.5 still accept them.)
const GEMINI_NO_SAMPLING_PARAMS = /^gemini-(3\.([5-9]|\d{2,})|[4-9])/i;

// Turn Google's raw auth failures into something an operator can act on.
// Never includes the key itself.
function authHint(status: number, body: string): string {
  if (status !== 400 && status !== 401 && status !== 403) return '';
  if (/ACCESS_TOKEN_TYPE_UNSUPPORTED/i.test(body)) {
    return (
      ' — Google rejected the key type. New AI Studio "AQ." keys ARE valid for ' +
      'this native endpoint (sent as x-goog-api-key). If it persists: create a ' +
      'fresh key in a NEW AI Studio project, confirm the Generative Language API ' +
      'is enabled for that project, and paste it with no quotes or spaces.'
    );
  }
  if (
    /API_KEY_INVALID|API key not valid|PERMISSION_DENIED|UNAUTHENTICATED/i.test(
      body,
    )
  ) {
    return (
      ' — check GOOGLE_AI_API_KEY: it must be the full key copied from Google AI ' +
      'Studio (no quotes/spaces), and the .env.development file wins over .env.'
    );
  }
  return '';
}

// Google's Generative Language API has a different request/response shape
// (roles are 'user'/'model', not 'user'/'assistant'; system prompt is a
// separate `systemInstruction` field). Streaming here uses Gemini's
// streamGenerateContent SSE endpoint.
@Injectable()
export class GoogleProvider implements AiProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string | undefined,
  ) {}

  async complete(params: AiCompletionParams): Promise<AiCompletionResult> {
    if (!this.apiKey) {
      throw new Error(
        'Google AI is not configured (API key missing) — set GOOGLE_AI_API_KEY in .env',
      );
    }
    const start = Date.now();
    // Key goes in a header, not the query string, so it can't leak into
    // access logs, proxies, or error messages that echo the URL.
    const res = await fetch(
      `${this.baseUrl}/models/${params.modelId}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(await this.buildBody(params)),
        signal: AbortSignal.timeout(60_000),
      },
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(
        `Google AI error (${res.status}): ${errBody}${authHint(res.status, errBody)}`,
      );
    }

    const data = await res.json();
    // Skip "thought" parts (only present when thoughts are requested) and
    // parts without text (e.g. thought signatures) so only the answer is joined.
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .filter(
        (p: { text?: string; thought?: boolean }) =>
          typeof p.text === 'string' && p.thought !== true,
      )
      .map((p: { text: string }) => p.text)
      .join('');

    // An empty completion (safety block, or the token cap eaten by thinking)
    // is a failure, not an answer — throwing lets AiRouterService fall back
    // instead of saving a blank explanation or a zero score.
    if (!text.trim()) {
      throw new Error(
        `Google AI returned an empty completion (finishReason=${data.candidates?.[0]?.finishReason ?? data.promptFeedback?.blockReason ?? 'unknown'})`,
      );
    }

    return {
      text,
      tokensInput: data.usageMetadata?.promptTokenCount ?? 0,
      // Thinking tokens are billed as output; include them so cost logs add up.
      tokensOutput:
        (data.usageMetadata?.candidatesTokenCount ?? 0) +
        (data.usageMetadata?.thoughtsTokenCount ?? 0),
      responseTimeMs: Date.now() - start,
      modelId: params.modelId,
    };
  }

  async *stream(params: AiCompletionParams): AsyncGenerator<AiStreamChunk> {
    // NOTE: not implemented as true token-by-token streaming yet — falls
    // back to a single chunk from the non-streaming call. Gemini's
    // streamGenerateContent SSE format is a bit different from OpenAI/
    // Anthropic's (array-wrapped JSON objects rather than clean `data:`
    // lines) and wasn't worth guessing at without testing against a real
    // key. If you plan to route sabi_tutor chat through Gemini as primary
    // (not just a fallback), flag it and I'll implement true streaming.
    const result = await this.complete(params);
    yield { delta: result.text, done: false };
    yield {
      delta: '',
      done: true,
      tokensInput: result.tokensInput,
      tokensOutput: result.tokensOutput,
    };
  }

  private async buildBody(params: AiCompletionParams) {
    const contents = await Promise.all(
      params.messages.map(async (m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: await this.toGeminiParts(m.content),
      })),
    );
    return {
      systemInstruction: { parts: [{ text: params.systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens:
          (params.maxTokens ?? 1500) +
          (GEMINI_THINKING_MODEL.test(params.modelId)
            ? GEMINI_THINKING_HEADROOM
            : 0),
        ...(GEMINI_NO_SAMPLING_PARAMS.test(params.modelId)
          ? {}
          : { temperature: params.temperature ?? 0.7 }),
        ...(params.jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    };
  }

  /**
   * Gemini's vision input wants inline base64 bytes (`inlineData`), not a
   * bare URL — so image_url parts are fetched here and re-encoded. This
   * is what lets a diagram in an essay answer (uploaded to R2) actually
   * get "seen" by the AI scorer, rather than just being a dead link the
   * model ignores.
   */
  private async toGeminiParts(
    content:
      | string
      | import('../interfaces/ai-provider.interface').AiContentPart[],
  ): Promise<
    Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>
  > {
    if (typeof content === 'string') return [{ text: content }];

    const parts: Array<
      { text: string } | { inlineData: { mimeType: string; data: string } }
    > = [];
    for (const part of content) {
      if (part.type === 'text') {
        parts.push({ text: part.text });
        continue;
      }
      try {
        const res = await fetch(part.imageUrl, {
          signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
        });
        if (!res.ok) continue;
        // Strip any "; charset=…" suffix — Gemini wants a bare MIME type.
        const mimeType = (res.headers.get('content-type') ?? 'image/jpeg')
          .split(';')[0]
          .trim();
        const buffer = Buffer.from(await res.arrayBuffer());
        parts.push({
          inlineData: { mimeType, data: buffer.toString('base64') },
        });
      } catch {
        // Image fetch failed (e.g. R2 not provisioned yet) — skip it
        // rather than fail the whole completion; the model just scores
        // on text context alone for this one image.
      }
    }
    return parts;
  }
}
