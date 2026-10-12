import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseUrl: process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com/v1',
  },
  google: {
    apiKey: process.env.GOOGLE_AI_API_KEY,
    baseUrl:
      process.env.GOOGLE_AI_BASE_URL ??
      'https://generativelanguage.googleapis.com/v1beta',
  },
  // DeepSeek, Mistral, and Groq all expose OpenAI-compatible
  // /chat/completions endpoints, so they reuse OpenAiCompatibleProvider
  // with a different base URL + key rather than needing bespoke provider
  // classes.
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1',
  },
  mistral: {
    apiKey: process.env.MISTRAL_API_KEY,
    baseUrl: process.env.MISTRAL_BASE_URL ?? 'https://api.mistral.ai/v1',
  },
  // Primary provider per the product tech stack: Groq (llama-3.3-70b) for
  // explanations/chat/post-mortem. Groq's endpoint is OpenAI-compatible.
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    baseUrl: process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1',
  },
  // OpenRouter: one key, hundreds of models (many with a genuinely free
  // tier, e.g. several Llama/Qwen/Gemma variants) — good for cost
  // arbitrage or trialling a model before committing to a dedicated
  // provider account. Also OpenAI-compatible.
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
  },
  // Ollama: self-hosted, zero marginal cost per request — the "free open
  // source AI" option. Point OLLAMA_BASE_URL at wherever it's running
  // (e.g. http://localhost:11434/v1 in dev, or an internal server's
  // address in production). No API key needed for a local instance, but
  // the field is kept for anyone proxying Ollama behind auth.
  ollama: {
    apiKey: process.env.OLLAMA_API_KEY ?? 'ollama',
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
  },
}));
