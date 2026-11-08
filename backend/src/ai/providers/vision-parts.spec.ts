import { GoogleProvider } from './google.provider';
import { AnthropicProvider, toAnthropicContent } from './anthropic.provider';
import { OpenAiCompatibleProvider } from './openai-compatible.provider';
import { AiChatMessage } from '../interfaces/ai-provider.interface';

const PNG_B64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]).toString('base64');

const withImage: AiChatMessage[] = [
  {
    role: 'user',
    content: [
      { type: 'text', text: 'Explain this diagram.' },
      { type: 'text', text: 'Image 1 — the question diagram:' },
      { type: 'image_data', mimeType: 'image/png', data: PNG_B64 },
    ],
  },
];

const fetchMock = jest.fn();
const lastBody = () => JSON.parse(fetchMock.mock.calls.at(-1)![1].body as string);
beforeEach(() => {
  fetchMock.mockReset();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
});

describe('Google (Gemini)', () => {
  it('sends pre-fetched image bytes inline — without fetching anything itself', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'ok' }] } }], usageMetadata: {} }), { status: 200 }),
    );
    await new GoogleProvider('https://g.example/v1beta', 'KEY').complete({ modelId: 'gemini-2.5-flash', systemPrompt: 's', messages: withImage });
    expect(fetchMock).toHaveBeenCalledTimes(1); // only the generateContent call; no image download
    const parts = lastBody().contents[0].parts;
    expect(parts).toContainEqual({ inlineData: { mimeType: 'image/png', data: PNG_B64 } });
    expect(parts[0]).toEqual({ text: 'Explain this diagram.' });
  });
});

describe('Anthropic (Claude) vision', () => {
  it('maps text and image parts to Messages-API content blocks', () => {
    expect(toAnthropicContent(withImage[0].content)).toEqual([
      { type: 'text', text: 'Explain this diagram.' },
      { type: 'text', text: 'Image 1 — the question diagram:' },
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: PNG_B64 } },
    ]);
    expect(toAnthropicContent('plain')).toBe('plain');
  });

  it('sends the image blocks in the request instead of dropping them', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ content: [{ type: 'text', text: 'ok' }], usage: {} }), { status: 200 }));
    await new AnthropicProvider('https://a.example/v1', 'KEY').complete({ modelId: 'claude-x', systemPrompt: 's', messages: withImage });
    const content = lastBody().messages[0].content;
    expect(content.some((b: { type: string }) => b.type === 'image')).toBe(true);
  });
});

describe('OpenAI vision', () => {
  const ok = () => new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }], usage: {} }), { status: 200 });

  it('sends the image as a data URL to the real OpenAI endpoint', async () => {
    fetchMock.mockResolvedValue(ok());
    await new OpenAiCompatibleProvider('https://api.openai.com/v1', 'KEY', 'OpenAI').complete({ modelId: 'gpt-4o', systemPrompt: 's', messages: withImage });
    const user = lastBody().messages[1].content;
    expect(user).toContainEqual({ type: 'image_url', image_url: { url: `data:image/png;base64,${PNG_B64}` } });
  });

  it('keeps text-only vendors text-only (their image support varies by model)', async () => {
    fetchMock.mockResolvedValue(ok());
    await new OpenAiCompatibleProvider('https://api.groq.com/openai/v1', 'KEY', 'Groq').complete({ modelId: 'llama', systemPrompt: 's', messages: withImage });
    expect(typeof lastBody().messages[1].content).toBe('string');
  });

  it('leaves ordinary string messages untouched on OpenAI', async () => {
    fetchMock.mockResolvedValue(ok());
    await new OpenAiCompatibleProvider('https://api.openai.com/v1', 'KEY', 'OpenAI').complete({
      modelId: 'gpt-4o', systemPrompt: 's', messages: [{ role: 'user', content: 'hello' }],
    });
    expect(lastBody().messages[1].content).toBe('hello');
  });
});
