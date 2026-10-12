import { Injectable, Logger } from '@nestjs/common';
import {
  AiCompletionParams,
  AiCompletionResult,
  AiProvider,
  AiStreamChunk,
  extractText,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class AnthropicProvider implements AiProvider {
  private readonly logger = new Logger(AnthropicProvider.name);

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string | undefined,
  ) {}

  async complete(params: AiCompletionParams): Promise<AiCompletionResult> {
    const start = Date.now();
    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: params.modelId,
        system: params.jsonMode
          ? `${params.systemPrompt}\n\nRespond ONLY with valid JSON — no markdown, no preamble, no code fences.`
          : params.systemPrompt,
        max_tokens: params.maxTokens ?? 1500,
        temperature: params.temperature ?? 0.7,
        // Text-only here — Claude's Messages API does support real vision
        // (base64 image blocks), just not wired up since Gemini is the
        // designated vision provider per the product's AI stack. Add it
        // here the same way GoogleProvider.toGeminiParts works if you
        // want Claude as a vision fallback too.
        messages: params.messages.map((m) => ({ role: m.role, content: extractText(m.content) })),
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Anthropic error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const text = (data.content ?? [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('');

    return {
      text,
      tokensInput: data.usage?.input_tokens ?? 0,
      tokensOutput: data.usage?.output_tokens ?? 0,
      responseTimeMs: Date.now() - start,
      modelId: params.modelId,
    };
  }

  async *stream(params: AiCompletionParams): AsyncGenerator<AiStreamChunk> {
    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: params.modelId,
        system: params.systemPrompt,
        max_tokens: params.maxTokens ?? 1500,
        temperature: params.temperature ?? 0.7,
        // Text-only here — Claude's Messages API does support real vision
        // (base64 image blocks), just not wired up since Gemini is the
        // designated vision provider per the product's AI stack. Add it
        // here the same way GoogleProvider.toGeminiParts works if you
        // want Claude as a vision fallback too.
        messages: params.messages.map((m) => ({ role: m.role, content: extractText(m.content) })),
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      const errBody = res.body ? await res.text() : 'no response body';
      throw new Error(`Anthropic stream error (${res.status}): ${errBody}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let tokensInput = 0;
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
        if (!payload) continue;

        try {
          const parsed = JSON.parse(payload);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            yield { delta: parsed.delta.text, done: false };
          }
          if (parsed.type === 'message_start') {
            tokensInput = parsed.message?.usage?.input_tokens ?? 0;
          }
          if (parsed.type === 'message_delta') {
            tokensOutput = parsed.usage?.output_tokens ?? tokensOutput;
          }
          if (parsed.type === 'message_stop') {
            yield { delta: '', done: true, tokensInput, tokensOutput };
            return;
          }
        } catch {
          this.logger.warn(`Failed to parse Anthropic stream chunk: ${payload}`);
        }
      }
    }
    yield { delta: '', done: true, tokensInput, tokensOutput };
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey ?? '',
      'anthropic-version': '2023-06-01',
    };
  }
}
