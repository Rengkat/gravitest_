import aiConfig from './aiConfig';

/**
 * Blank/whitespace env values must behave like unset, for every provider.
 * (Same bug class as a blank OPAY_CANCEL_URL: a blank *_BASE_URL used to
 * override the default with an empty string.)
 */
describe('aiConfig — blank/whitespace env values behave like unset', () => {
  const KEYS = [
    'GOOGLE_AI_API_KEY', 'GOOGLE_AI_BASE_URL', 'GROQ_API_KEY', 'GROQ_BASE_URL',
    'MISTRAL_API_KEY', 'OLLAMA_API_KEY',
  ];
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => KEYS.forEach((k) => { saved[k] = process.env[k]; delete process.env[k]; }));
  afterEach(() => KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k]))));

  it('a blank key is "not configured" (undefined), not an empty string', () => {
    process.env.GOOGLE_AI_API_KEY = '';
    expect(aiConfig().google.apiKey).toBeUndefined();
  });

  it('a whitespace-only key is "not configured"', () => {
    process.env.GROQ_API_KEY = '   ';
    expect(aiConfig().groq.apiKey).toBeUndefined();
  });

  it('keys are trimmed — and the new "AQ." Google auth-key format is passed through untouched', () => {
    process.env.GOOGLE_AI_API_KEY = '  AQ.Ab8_fakeKeyForTests-123  ';
    expect(aiConfig().google.apiKey).toBe('AQ.Ab8_fakeKeyForTests-123');
  });

  it('a blank *_BASE_URL falls back to the default instead of overriding it with ""', () => {
    process.env.GOOGLE_AI_BASE_URL = '';
    process.env.GROQ_BASE_URL = '  ';
    expect(aiConfig().google.baseUrl).toBe('https://generativelanguage.googleapis.com/v1beta');
    expect(aiConfig().groq.baseUrl).toBe('https://api.groq.com/openai/v1');
  });

  it('an explicit base URL is respected', () => {
    process.env.GOOGLE_AI_BASE_URL = 'https://proxy.example.com/v1beta';
    expect(aiConfig().google.baseUrl).toBe('https://proxy.example.com/v1beta');
  });

  it('ollama keeps its "ollama" placeholder key when unset/blank', () => {
    process.env.OLLAMA_API_KEY = '';
    expect(aiConfig().ollama.apiKey).toBe('ollama');
  });
});
