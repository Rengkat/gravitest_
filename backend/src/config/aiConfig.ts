import { registerAs } from '@nestjs/config';

// .env files routinely contain blank assignments ("GOOGLE_AI_BASE_URL=") and
// stray whitespace. Blank must behave like unset: a blank key means "not
// configured", and a blank base URL must fall back to the default rather than
// override it with an empty string (which makes every request fail).
const clean = (v: string | undefined): string | undefined =>
  v?.trim() || undefined;

export default registerAs('ai', () => ({
  openai: {
    apiKey: clean(process.env.OPENAI_API_KEY),
    baseUrl: clean(process.env.OPENAI_BASE_URL) ?? 'https://api.openai.com/v1',
  },
  anthropic: {
    apiKey: clean(process.env.ANTHROPIC_API_KEY),
    baseUrl:
      clean(process.env.ANTHROPIC_BASE_URL) ?? 'https://api.anthropic.com/v1',
  },
  // Google AI Studio keys now come in two formats: the older "AIza..." keys and
  // the newer "AQ...." auth keys. BOTH go in GOOGLE_AI_API_KEY and are sent the
  // same way (x-goog-api-key header) to the native Gemini endpoint below.
  google: {
    apiKey: clean(process.env.GOOGLE_AI_API_KEY),
    baseUrl:
      clean(process.env.GOOGLE_AI_BASE_URL) ??
      'https://generativelanguage.googleapis.com/v1beta',
  },
  // DeepSeek, Mistral, and Groq all expose OpenAI-compatible
  // /chat/completions endpoints, so they reuse OpenAiCompatibleProvider
  // with a different base URL + key rather than needing bespoke provider
  // classes.
  deepseek: {
    apiKey: clean(process.env.DEEPSEEK_API_KEY),
    baseUrl:
      clean(process.env.DEEPSEEK_BASE_URL) ?? 'https://api.deepseek.com/v1',
  },
  mistral: {
    apiKey: clean(process.env.MISTRAL_API_KEY),
    baseUrl: clean(process.env.MISTRAL_BASE_URL) ?? 'https://api.mistral.ai/v1',
  },
  // Primary text provider per the product tech stack: Groq for
  // explanations/chat/post-mortem (default openai/gpt-oss-120b, which is on
  // Groq's free plan). Groq's endpoint is OpenAI-compatible.
  groq: {
    apiKey: clean(process.env.GROQ_API_KEY),
    baseUrl:
      clean(process.env.GROQ_BASE_URL) ?? 'https://api.groq.com/openai/v1',
  },
  // OpenRouter: one key, hundreds of models. Also OpenAI-compatible.
  openrouter: {
    apiKey: clean(process.env.OPENROUTER_API_KEY),
    baseUrl:
      clean(process.env.OPENROUTER_BASE_URL) ?? 'https://openrouter.ai/api/v1',
  },
  // Ollama: self-hosted. No API key needed for a local instance, but the field
  // is kept for anyone proxying Ollama behind auth.
  ollama: {
    apiKey: clean(process.env.OLLAMA_API_KEY) ?? 'ollama',
    baseUrl: clean(process.env.OLLAMA_BASE_URL) ?? 'http://localhost:11434/v1',
  },
}));
