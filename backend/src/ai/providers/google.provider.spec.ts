import * as http from 'http';
import { AddressInfo } from 'net';
import { GoogleProvider } from './google.provider';

/**
 * GoogleProvider against a local fake of the native Gemini endpoint.
 * The fake only accepts the key in the x-goog-api-key header (what Google
 * documents for BOTH legacy "AIza" and new "AQ." auth keys).
 */
describe('GoogleProvider', () => {
  const AQ_KEY = 'AQ.Ab8_FAKE_TEST_KEY_not_real_0123456789';
  let server: http.Server;
  let base: string;
  let seen: { url: string; headers: http.IncomingHttpHeaders; body: any }[] = [];
  let respond: (req: http.IncomingMessage, res: http.ServerResponse) => void;

  const ok = (res: http.ServerResponse, text = 'Hello') => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3 },
    }));
  };

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        seen.push({ url: req.url ?? '', headers: req.headers, body: raw ? JSON.parse(raw) : null });
        respond(req, res);
      });
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1beta`;
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));
  beforeEach(() => {
    seen = [];
    respond = (req, res) =>
      req.headers['x-goog-api-key'] === AQ_KEY
        ? ok(res)
        : (res.writeHead(401, { 'Content-Type': 'application/json' }), res.end(JSON.stringify({ error: { status: 'UNAUTHENTICATED' } })));
  });

  const call = (modelId: string, key: string | undefined = AQ_KEY, over: any = {}) =>
    new GoogleProvider(base, key).complete({
      modelId, systemPrompt: 'sys', messages: [{ role: 'user', content: 'hi' }], maxTokens: 800, temperature: 0.2, ...over,
    });

  it('sends a new-style AQ. key in the x-goog-api-key header and NEVER in the URL', async () => {
    const r = await call('gemini-3.5-flash-lite');
    expect(r.text).toBe('Hello');
    expect(seen[0].headers['x-goog-api-key']).toBe(AQ_KEY);
    expect(seen[0].url).not.toContain(AQ_KEY);
    expect(seen[0].url).not.toContain('key=');
    expect(seen[0].url).toBe('/v1beta/models/gemini-3.5-flash-lite:generateContent');
  });

  it.each(['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-4-argon'])(
    '%s: deprecated sampling parameters are NOT sent',
    async (model) => {
      await call(model);
      expect(seen[0].body.generationConfig).not.toHaveProperty('temperature');
      expect(seen[0].body.generationConfig).not.toHaveProperty('topP');
      expect(seen[0].body.generationConfig).not.toHaveProperty('topK');
    },
  );

  it.each(['gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'])(
    '%s: older models still receive the configured temperature',
    async (model) => {
      await call(model);
      expect(seen[0].body.generationConfig.temperature).toBe(0.2);
    },
  );

  it('thinking headroom is still added on top of the caller\'s token cap', async () => {
    await call('gemini-3.8-flash');
    expect(seen[0].body.generationConfig.maxOutputTokens).toBe(800 + 1024);
  });

  it('JSON mode and the system instruction are still sent', async () => {
    await call('gemini-3.8-flash', AQ_KEY, { jsonMode: true });
    expect(seen[0].body.generationConfig.responseMimeType).toBe('application/json');
    expect(seen[0].body.systemInstruction.parts[0].text).toBe('sys');
  });

  it('a blank/missing key fails fast with a clear message and makes NO request', async () => {
    // '' is what a blank `GOOGLE_AI_API_KEY=` line produces if it ever reaches the provider
    await expect(call('gemini-3.8-flash', '')).rejects.toThrow(/API key missing.*GOOGLE_AI_API_KEY/);
    expect(seen).toHaveLength(0);
  });

  it('ACCESS_TOKEN_TYPE_UNSUPPORTED gets an actionable hint, and the key is never echoed', async () => {
    respond = (_req, res) => {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 401, status: 'UNAUTHENTICATED', details: [{ reason: 'ACCESS_TOKEN_TYPE_UNSUPPORTED' }] } }));
    };
    const err: Error = await call('gemini-3.8-flash').catch((e) => e);
    expect(err.message).toMatch(/Google AI error \(401\)/);
    expect(err.message).toMatch(/NEW AI Studio project/);
    expect(err.message).not.toContain(AQ_KEY);
  });

  it('an invalid-key error points at GOOGLE_AI_API_KEY and the .env precedence', async () => {
    respond = (_req, res) => {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT', details: [{ reason: 'API_KEY_INVALID' }] } }));
    };
    const err: Error = await call('gemini-3.8-flash').catch((e) => e);
    expect(err.message).toMatch(/check GOOGLE_AI_API_KEY/);
    expect(err.message).toMatch(/\.env\.development file wins/);
  });

  it('non-auth errors (e.g. 404 model) are passed through without a misleading auth hint', async () => {
    respond = (_req, res) => {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'models/gemini-9 is not found', status: 'NOT_FOUND' } }));
    };
    const err: Error = await call('gemini-9').catch((e) => e);
    expect(err.message).toMatch(/Google AI error \(404\)/);
    expect(err.message).not.toMatch(/check GOOGLE_AI_API_KEY|NEW AI Studio project/);
  });

  it('an empty completion (safety block / thinking ate the cap) is an error, so the router can fall back', async () => {
    respond = (_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: '  ' }] }, finishReason: 'MAX_TOKENS' }] }));
    };
    await expect(call('gemini-3.8-flash')).rejects.toThrow(/empty completion.*MAX_TOKENS/);
  });
});
