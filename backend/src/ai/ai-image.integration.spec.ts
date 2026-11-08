import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { AiImageService, AiImageError } from './ai-image.service';

// A REAL HTTP round trip (no fetch mock): proves the service downloads actual bytes, base64-encodes them,
// validates them, and applies the SSRF rules to a live server — the path the production explain flow takes.
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('pretend this is a geometry diagram')]);

let server: Server;
let base: string;

beforeAll(async () => {
  server = createServer((req, res) => {
    switch (req.url) {
      case '/diagram.png':
        res.writeHead(200, { 'content-type': 'image/png' });
        return res.end(PNG);
      case '/lying.png': // claims to be an image, is HTML
        res.writeHead(200, { 'content-type': 'image/png' });
        return res.end('<html>login page</html>');
      case '/redirect':
        res.writeHead(302, { location: '/diagram.png' });
        return res.end();
      case '/slow':
        return; // never answers
      default:
        res.writeHead(404);
        return res.end();
    }
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((r) => server.close(() => r())));

// Our own storage host is trusted by configuration — exactly like the production R2 public URL.
const trusting = () => new AiImageService({ publicBaseUrl: base } as never);
const untrusting = () => new AiImageService({ publicBaseUrl: 'https://pub.example.r2.dev' } as never);

describe('AiImageService over real HTTP', () => {
  it('downloads the real bytes of a diagram from storage and returns them base64-encoded', async () => {
    const img = await trusting().load({ label: 'the question diagram', url: `${base}/diagram.png` });
    expect(img.mimeType).toBe('image/png');
    expect(Buffer.from(img.data, 'base64').equals(PNG)).toBe(true);
    expect(img.bytes).toBe(PNG.length);
  });

  it('reports a missing file as an unreachable image', async () => {
    await expect(trusting().load({ label: 'x', url: `${base}/nope.png` })).rejects.toMatchObject({ code: 'image_unreachable' });
  });

  it('refuses a file whose bytes are not an image even though the server says image/png', async () => {
    await expect(trusting().load({ label: 'x', url: `${base}/lying.png` })).rejects.toMatchObject({ code: 'image_unsupported' });
  });

  it('does not follow redirects', async () => {
    await expect(trusting().load({ label: 'x', url: `${base}/redirect` })).rejects.toBeInstanceOf(AiImageError);
  });

  it('refuses to fetch a loopback server that is NOT our configured storage (SSRF)', async () => {
    await expect(untrusting().load({ label: 'x', url: `${base}/diagram.png` })).rejects.toMatchObject({ code: 'image_blocked' });
  });

  it('loads several images concurrently, each with its own label', async () => {
    const imgs = await trusting().loadAll([
      { label: 'the question diagram', url: `${base}/diagram.png` },
      { label: 'the image for option A', url: `${base}/diagram.png` },
    ]);
    expect(imgs.map((i) => i.label)).toEqual(['the question diagram', 'the image for option A']);
  });
});
