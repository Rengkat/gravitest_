export type AiContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; imageUrl: string };

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  // Plain string for normal text turns. An array of parts when a message
  // includes an image (e.g. a diagram in an essay answer) — only
  // GoogleProvider actually interprets image parts today (Gemini has
  // real vision support); other providers fall back to text-only via
  // extractText() and silently drop images rather than crash, so a
  // provider swap never breaks — it just loses image context until that
  // provider's vision support is added.
  content: string | AiContentPart[];
}

export interface AiCompletionParams {
  modelId: string; // provider-specific model string, e.g. 'gpt-4o'
  systemPrompt: string;
  messages: AiChatMessage[]; // conversation history + latest user message
  maxTokens?: number;
  temperature?: number;
  // If true and the provider supports it, forces JSON-only output
  // (used by essay scoring). Providers that don't have a native mode
  // fall back to prompt-level instruction only.
  jsonMode?: boolean;
}

/** Text-only providers use this to degrade gracefully when a message contains image parts. */
export function extractText(content: string | AiContentPart[]): string {
  if (typeof content === 'string') return content;
  return content
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('\n');
}

export interface AiCompletionResult {
  text: string;
  tokensInput: number;
  tokensOutput: number;
  responseTimeMs: number;
  modelId: string;
}

export interface AiStreamChunk {
  delta: string; // incremental text
  done: boolean;
  // Only populated on the final chunk (done === true)
  tokensInput?: number;
  tokensOutput?: number;
}

// Every provider (OpenAI, Anthropic, Google, and the OpenAI-compatible
// DeepSeek/Mistral wrapper) implements this. AiRouterService only ever
// talks to this interface — it never knows which vendor it's calling.
export interface AiProvider {
  complete(params: AiCompletionParams): Promise<AiCompletionResult>;
  stream(params: AiCompletionParams): AsyncGenerator<AiStreamChunk>;
}
