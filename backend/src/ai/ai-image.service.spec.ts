jest.mock('dns/promises', () => ({ lookup: jest.fn() }));

import { lookup } from 'dns/promises';
import { AiImageError, AiImageService, isPrivateAddress, MAX_IMAGE_BYTES, sniffImageMime } from './ai-image.service';

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 2)]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(32)]);

const svc = (publicBaseUrl = 'https://pub.example.r2.dev') => new AiImageService({ publicBaseUrl } as never);
const reply = (body: Buffer | string, init: { status?: number; headers?: Record<string, string> } = {}) =>
  new Response(body as BodyInit, { status: init.status ?? 200, headers: init.headers });

const fetchMock = jest.fn();
beforeEach(() => {
  jest.resetAllMocks();
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  (lookup as jest.Mock).mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
});

describe('collectQuestionImages', () => {
  it('returns nothing for a text-only question', () => {
    expect(svc().collectQuestionImages({ questionImageUrl: null, options: [{ label: 'A', imageUrl: null }] })).toEqual([]);
  });

  it('collects the question, passage, option and explanation images, de-duplicated and in a stable order', () => {
    const refs = svc().collectQuestionImages({
      questionImageUrl: 'https://pub.example.r2.dev/q.png',
      passage: { passageImageUrl: 'https://pub.example.r2.dev/p.png' },
      options: [
        { label: 'A', imageUrl: 'https://pub.example.r2.dev/a.png' },
        { label: 'B', imageUrl: null },
        { label: 'C', imageUrl: 'https://pub.example.r2.dev/q.png' }, // same file reused → not sent twice
      ],
      explanations: [{ imageUrl: 'https://pub.example.r2.dev/e.png' }],
    });
    expect(refs.map((r) => r.label)).toEqual([
      'the question diagram',
      'the diagram that goes with the comprehension passage',
      'the image for option A',
      'the diagram in the official explanation',
    ]);
  });

  it('refuses an absurd number of images rather than quietly dropping some', () => {
    const options = Array.from({ length: 9 }, (_, i) => ({ label: String.fromCharCode(65 + i), imageUrl: `https://pub.example.r2.dev/${i}.png` }));
    expect(() => svc().collectQuestionImages({ options })).toThrow(AiImageError);
  });
});

describe('sniffImageMime / isPrivateAddress', () => {
  it('identifies images by their bytes', () => {
    expect(sniffImageMime(PNG)).toBe('image/png');
    expect(sniffImageMime(JPG)).toBe('image/jpeg');
    expect(sniffImageMime(WEBP)).toBe('image/webp');
    expect(sniffImageMime(Buffer.from('GIF89a....'))).toBe('gif');
    expect(sniffImageMime(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBe('svg');
    expect(sniffImageMime(Buffer.from('<html>not an image</html>'))).toBeNull();
  });

  it.each(['127.0.0.1', '10.1.2.3', '172.16.0.5', '172.31.255.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1'])(
    'treats %s as private',
    (ip) => expect(isPrivateAddress(ip)).toBe(true),
  );
  it.each(['93.184.216.34', '8.8.8.8', '172.32.0.1', '2606:4700:4700::1111'])('treats %s as public', (ip) =>
    expect(isPrivateAddress(ip)).toBe(false),
  );
});

describe('load', () => {
  const ref = { label: 'the question diagram', url: 'https://pub.example.r2.dev/q/diagram.png' };

  it('fetches the real bytes and returns them base64-encoded with a sniffed MIME type', async () => {
    fetchMock.mockResolvedValue(reply(PNG, { headers: { 'content-type': 'text/plain' } })); // header lies; bytes win
    const img = await svc().load(ref);
    expect(img.mimeType).toBe('image/png');
    expect(Buffer.from(img.data, 'base64').equals(PNG)).toBe(true);
    expect(img.label).toBe('the question diagram');
    expect(fetchMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ redirect: 'manual' }));
  });

  it.each([['jpeg', JPG, 'image/jpeg'], ['webp', WEBP, 'image/webp']])('accepts %s', async (_n, bytes, mime) => {
    fetchMock.mockResolvedValue(reply(bytes));
    expect((await svc().load(ref)).mimeType).toBe(mime);
  });

  it('reports an unreachable image with a student-safe message and the technical detail kept separate', async () => {
    fetchMock.mockResolvedValue(reply('nope', { status: 404 }));
    const err = (await svc().load(ref).then(() => null, (e: unknown) => e)) as AiImageError;
    expect(err).toBeInstanceOf(AiImageError);
    expect(err.code).toBe('image_unreachable');
    expect(err.publicMessage).toMatch(/couldn't load the question diagram/i);
    expect(err.publicMessage).not.toMatch(/404|r2\.dev/);
    expect(err.technical).toMatch(/HTTP 404/);
  });

  it('reports network failures the same way', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));
    await expect(svc().load(ref)).rejects.toMatchObject({ code: 'image_unreachable' });
  });

  it('rejects formats the models cannot read (SVG, GIF) with a clear message', async () => {
    fetchMock.mockResolvedValue(reply('<svg xmlns="http://www.w3.org/2000/svg"></svg>'));
    await expect(svc().load(ref)).rejects.toMatchObject({ code: 'image_unsupported' });
    fetchMock.mockResolvedValue(reply(Buffer.from('GIF89a' + 'x'.repeat(40))));
    await expect(svc().load(ref)).rejects.toMatchObject({ code: 'image_unsupported' });
  });

  it('rejects an oversized image by its declared length without downloading it', async () => {
    fetchMock.mockResolvedValue(reply(PNG, { headers: { 'content-length': String(MAX_IMAGE_BYTES + 1) } }));
    await expect(svc().load(ref)).rejects.toMatchObject({ code: 'image_too_large' });
  });

  it('rejects an oversized image even when the server under-reports its length', async () => {
    fetchMock.mockResolvedValue(reply(Buffer.concat([PNG, Buffer.alloc(MAX_IMAGE_BYTES)])));
    await expect(svc().load(ref)).rejects.toMatchObject({ code: 'image_too_large' });
  });

  it('treats a redirect as a failure instead of following it', async () => {
    fetchMock.mockResolvedValue(reply('', { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data' } }));
    await expect(svc().load(ref)).rejects.toMatchObject({ code: 'image_unreachable' });
  });

  describe('SSRF protection', () => {
    it.each(['http://127.0.0.1/a.png', 'https://10.0.0.5/a.png', 'https://169.254.169.254/latest/meta-data', 'https://[::1]/a.png'])(
      'never fetches %s',
      async (url) => {
        await expect(svc().load({ label: 'x', url })).rejects.toMatchObject({ code: 'image_blocked' });
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    it('blocks a public-looking hostname that resolves to a private address', async () => {
      (lookup as jest.Mock).mockResolvedValue([{ address: '10.0.0.7', family: 4 }]);
      await expect(svc().load({ label: 'x', url: 'https://evil.example.com/a.png' })).rejects.toMatchObject({ code: 'image_blocked' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('blocks plain http to anything other than our own storage', async () => {
      await expect(svc().load({ label: 'x', url: 'http://images.example.com/a.png' })).rejects.toMatchObject({ code: 'image_blocked' });
    });

    it('blocks invalid addresses', async () => {
      await expect(svc().load({ label: 'x', url: 'not a url' })).rejects.toMatchObject({ code: 'image_blocked' });
    });

    it('allows https images on public hosts', async () => {
      fetchMock.mockResolvedValue(reply(PNG));
      await expect(svc().load({ label: 'x', url: 'https://images.example.com/a.png' })).resolves.toBeDefined();
    });

    it('trusts our own storage host without a DNS lookup', async () => {
      fetchMock.mockResolvedValue(reply(PNG));
      await svc().load(ref);
      expect(lookup).not.toHaveBeenCalled();
    });
  });
});
