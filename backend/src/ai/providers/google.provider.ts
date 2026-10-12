import { Injectable } from '@nestjs/common';
import {
  AiCompletionParams,
  AiCompletionResult,
  AiProvider,
  AiStreamChunk,
} from '../interfaces/ai-provider.interface';

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
    const start = Date.now();
    const res = await fetch(
      `${this.baseUrl}/models/${params.modelId}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(await this.buildBody(params)),
      },
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Google AI error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const text =
      data.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join('') ?? '';

    return {
      text,
      tokensInput: data.usageMetadata?.promptTokenCount ?? 0,
      tokensOutput: data.usageMetadata?.candidatesTokenCount ?? 0,
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
    yield { delta: '', done: true, tokensInput: result.tokensInput, tokensOutput: result.tokensOutput };
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
        maxOutputTokens: params.maxTokens ?? 1500,
        temperature: params.temperature ?? 0.7,
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
    content: string | import('../interfaces/ai-provider.interface').AiContentPart[],
  ): Promise<Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>> {
    if (typeof content === 'string') return [{ text: content }];

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    for (const part of content) {
      if (part.type === 'text') {
        parts.push({ text: part.text });
        continue;
      }
      try {
        const res = await fetch(part.imageUrl);
        if (!res.ok) continue;
        const mimeType = res.headers.get('content-type') ?? 'image/jpeg';
        const buffer = Buffer.from(await res.arrayBuffer());
        parts.push({ inlineData: { mimeType, data: buffer.toString('base64') } });
      } catch {
        // Image fetch failed (e.g. R2 not provisioned yet) — skip it
        // rather than fail the whole completion; the model just scores
        // on text context alone for this one image.
      }
    }
    return parts;
  }
}
