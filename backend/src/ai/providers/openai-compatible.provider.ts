import { Injectable, Logger } from '@nestjs/common';
import {
  AiChatMessage,
  AiCompletionParams,
  AiCompletionResult,
  AiProvider,
  AiStreamChunk,
  extractText,
} from '../interfaces/ai-provider.interface';

// Implements the OpenAI Chat Completions API shape. Used directly for
// OpenAI itself, and reused as-is for DeepSeek and Mistral (both expose
// the same /chat/completions contract) — only the baseUrl + apiKey differ,
// injected per-instance. Requires Node 18+ (global fetch).
@Injectable()
export class OpenAiCompatibleProvider implements AiProvider {
  private readonly logger = new Logger(OpenAiCompatibleProvider.name);

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string | undefined,
    private readonly providerLabel: string,
  ) {}

  async complete(params: AiCompletionParams): Promise<AiCompletionResult> {
    const start = Date.now();
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: params.modelId,
        messages: this.buildMessages(params),
        max_tokens: params.maxTokens ?? 1500,
        temperature: params.temperature ?? 0.7,
        ...(params.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`${this.providerLabel} error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';

    return {
      text,
      tokensInput: data.usage?.prompt_tokens ?? 0,
      tokensOutput: data.usage?.completion_tokens ?? 0,
      responseTimeMs: Date.now() - start,
      modelId: params.modelId,
    };
  }

  async *stream(params: AiCompletionParams): AsyncGenerator<AiStreamChunk> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: params.modelId,
        messages: this.buildMessages(params),
        max_tokens: params.maxTokens ?? 1500,
        temperature: params.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      const errBody = res.body ? await res.text() : 'no response body';
      throw new Error(`${this.providerLabel} stream error (${res.status}): ${errBody}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let tokensOutput = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') {
          yield { delta: '', done: true, tokensOutput };
          return;
        }
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            tokensOutput += Math.ceil(delta.length / 4); // rough estimate — OpenAI stream chunks don't carry usage
            yield { delta, done: false };
          }
        } catch {
          this.logger.warn(`Failed to parse ${this.providerLabel} stream chunk: ${payload}`);
        }
      }
    }
    yield { delta: '', done: true, tokensOutput };
  }

  private buildMessages(params: AiCompletionParams): AiChatMessage[] {
    return [
      { role: 'system', content: params.systemPrompt },
      // Text-only provider — image parts are dropped via extractText()
      // rather than sent as-is (which would break the request shape).
      // See AiChatMessage's doc comment for why this degrades gracefully
      // instead of throwing.
      ...params.messages.map((m) => ({ role: m.role, content: extractText(m.content) })),
    ];
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }
}
