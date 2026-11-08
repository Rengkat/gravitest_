import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import storageConfig from 'src/config/storageConfig';

export type AiImageErrorCode =
  | 'image_unreachable'
  | 'image_unsupported'
  | 'image_too_large'
  | 'image_blocked'
  | 'image_too_many';

/**
 * A problem with a question image, carrying a student-safe message. The technical detail is only ever
 * logged on the server — never shown to a student and never containing a URL with credentials.
 */
export class AiImageError extends Error {
  constructor(
    readonly code: AiImageErrorCode,
    readonly publicMessage: string,
    readonly technical: string,
  ) {
    super(technical);
    this.name = 'AiImageError';
  }
}

export interface ImageRef {
  /** What this image is, in words the model can use ("the question diagram", "the image for option B"). */
  label: string;
  url: string;
}

export interface LoadedImage extends ImageRef {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Base64 of the real bytes. */
  data: string;
  bytes: number;
}

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGES_PER_QUESTION = 8;
const FETCH_TIMEOUT_MS = 15_000;

/** Identify an image by its leading bytes — the server's Content-Type header is not trustworthy. */
export function sniffImageMime(buf: Uint8Array): LoadedImage['mimeType'] | 'svg' | 'gif' | null {
  const b = Buffer.from(buf.subarray(0, 64));
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.length >= 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (b.subarray(0, 3).toString('ascii') === 'GIF') return 'gif';
  const head = b.toString('utf8').trimStart().toLowerCase();
  if (head.startsWith('<svg') || head.startsWith('<?xml')) return 'svg';
  return null;
}

/** True for loopback, private, link-local, CGNAT, multicast and unspecified addresses (v4 and v6). */
export function isPrivateAddress(ip: string): boolean {
  const v = ip.toLowerCase();
  if (isIP(v) === 6) {
    if (v === '::1' || v === '::') return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return /^f[cd]/.test(v) || /^fe[89ab]/.test(v) || v.startsWith('ff');
  }
  const p = v.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true; // unparseable → refuse
  const [a, b] = p;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

interface QuestionLike {
  questionImageUrl?: string | null;
  passage?: { passageImageUrl?: string | null } | null;
  options?: { label: string; imageUrl?: string | null }[] | null;
  explanations?: { imageUrl?: string | null }[] | null;
}

@Injectable()
export class AiImageService {
  private readonly logger = new Logger(AiImageService.name);

  constructor(
    @Inject(storageConfig.KEY)
    private readonly storage: ConfigType<typeof storageConfig>,
  ) {}

  /**
   * Every image the model needs to see to understand a question: the question's own diagram, the
   * comprehension passage's diagram, each option that is itself an image, and the official explanation's
   * diagram. De-duplicated; order is stable so "Image 1/2/…" in the prompt matches what is sent.
   */
  collectQuestionImages(q: QuestionLike): ImageRef[] {
    const refs: ImageRef[] = [];
    const seen = new Set<string>();
    const add = (label: string, url?: string | null) => {
      const u = url?.trim();
      if (!u || seen.has(u)) return;
      seen.add(u);
      refs.push({ label, url: u });
    };
    add('the question diagram', q.questionImageUrl);
    add('the diagram that goes with the comprehension passage', q.passage?.passageImageUrl);
    for (const o of q.options ?? []) add(`the image for option ${o.label}`, o.imageUrl);
    add('the diagram in the official explanation', q.explanations?.[0]?.imageUrl);

    if (refs.length > MAX_IMAGES_PER_QUESTION) {
      throw new AiImageError(
        'image_too_many',
        'This question has too many images for Sabi to process at once.',
        `question has ${refs.length} images (limit ${MAX_IMAGES_PER_QUESTION})`,
      );
    }
    return refs;
  }

  async loadAll(refs: ImageRef[]): Promise<LoadedImage[]> {
    return Promise.all(refs.map((r) => this.load(r)));
  }

  async load(ref: ImageRef): Promise<LoadedImage> {
    const url = await this.assertSafeUrl(ref.url);

    let res: Response;
    try {
      // Redirects are never followed: a redirect could point a trusted host at an internal address.
      res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), headers: { Accept: 'image/*' } });
    } catch (err) {
      throw new AiImageError('image_unreachable', `Sabi couldn't load ${ref.label}. Please try again in a moment.`, `fetch failed for ${this.safe(url)}: ${(err as Error).message}`);
    }
    if (!res.ok) {
      throw new AiImageError('image_unreachable', `Sabi couldn't load ${ref.label}. Please try again in a moment.`, `HTTP ${res.status} for ${this.safe(url)}`);
    }

    const declared = Number(res.headers.get('content-length') ?? 0);
    if (declared > MAX_IMAGE_BYTES) {
      throw new AiImageError('image_too_large', `${cap(ref.label)} is too large for Sabi to read.`, `content-length ${declared} > ${MAX_IMAGE_BYTES} for ${this.safe(url)}`);
    }
    const bytes = await this.readCapped(res, ref);

    const kind = sniffImageMime(bytes);
    if (kind === 'svg' || kind === 'gif' || kind === null) {
      throw new AiImageError(
        'image_unsupported',
        `${cap(ref.label)} is in a format Sabi can't read yet (it supports JPEG, PNG and WebP).`,
        `unsupported image format (${kind ?? 'unknown'}) for ${this.safe(url)}`,
      );
    }
    return { ...ref, mimeType: kind, data: Buffer.from(bytes).toString('base64'), bytes: bytes.byteLength };
  }

  private async readCapped(res: Response, ref: ImageRef): Promise<Uint8Array> {
    const reader = res.body?.getReader();
    if (!reader) return new Uint8Array(await res.arrayBuffer());
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_IMAGE_BYTES) {
        await reader.cancel();
        throw new AiImageError('image_too_large', `${cap(ref.label)} is too large for Sabi to read.`, `body exceeded ${MAX_IMAGE_BYTES} bytes`);
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  }

  /**
   * SSRF guard. Images come from admin-entered URLs, so before this server fetches one it must be
   * (a) our own storage host, or (b) https to a public address. Never loopback, private or metadata IPs.
   */
  private async assertSafeUrl(raw: string): Promise<URL> {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new AiImageError('image_blocked', "Sabi can't use an image with an invalid address.", `invalid URL`);
    }
    const trusted = this.trustedHost();
    if (trusted && url.host === trusted) return url;

    if (url.protocol !== 'https:') {
      throw new AiImageError('image_blocked', "Sabi can't load that image (it isn't served securely).", `blocked non-https URL ${this.safe(url)}`);
    }
    // URL keeps the brackets around IPv6 literals ("[::1]"); isIP()/lookup() need them stripped.
    const host = url.hostname.replace(/^\[|\]$/g, '');
    const addresses = isIP(host)
      ? [host]
      : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
    if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
      throw new AiImageError('image_blocked', "Sabi can't load that image.", `blocked non-public address for ${this.safe(url)}`);
    }
    return url;
  }

  private trustedHost(): string | null {
    try {
      return this.storage.publicBaseUrl ? new URL(this.storage.publicBaseUrl).host : null;
    } catch {
      return null;
    }
  }

  /** Host + path only: never log query strings (they can carry signatures/tokens). */
  private safe(url: URL): string {
    return `${url.host}${url.pathname}`;
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
