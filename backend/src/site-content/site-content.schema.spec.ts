import { BadRequestException } from '@nestjs/common';
import {
  BLOCK_BY_KEY,
  BLOCK_DEFINITIONS,
  COLLECTION_BY_KEY,
  COLLECTION_DEFINITIONS,
  validateContent,
} from './site-content.schema';
import { SEED_BLOCKS, SEED_ITEMS } from './site-content.seed';

const videos = COLLECTION_BY_KEY.get('videos')!.fields;
const messages = (fn: () => unknown): string[] => {
  try {
    fn();
  } catch (e) {
    return ((e as BadRequestException).getResponse() as { message: string[] }).message;
  }
  return [];
};

describe('site content schema', () => {
  it('every seed row passes the same validation the admin dashboard uses', () => {
    for (const [key, data] of Object.entries(SEED_BLOCKS)) {
      expect(() => validateContent(BLOCK_BY_KEY.get(key)!.fields, data)).not.toThrow();
    }
    for (const [collection, rows] of Object.entries(SEED_ITEMS)) {
      for (const row of rows) {
        expect(() => validateContent(COLLECTION_BY_KEY.get(collection)!.fields, row)).not.toThrow();
      }
    }
  });

  it('only seeds blocks and collections that are defined', () => {
    expect(Object.keys(SEED_BLOCKS).filter((k) => !BLOCK_BY_KEY.has(k))).toEqual([]);
    expect(Object.keys(SEED_ITEMS).filter((k) => !COLLECTION_BY_KEY.has(k))).toEqual([]);
  });

  it('has unique keys and a valid title field for every collection', () => {
    expect(new Set(BLOCK_DEFINITIONS.map((b) => b.key)).size).toBe(BLOCK_DEFINITIONS.length);
    expect(new Set(COLLECTION_DEFINITIONS.map((c) => c.key)).size).toBe(COLLECTION_DEFINITIONS.length);
    for (const c of COLLECTION_DEFINITIONS) {
      expect(c.fields.some((f) => f.name === c.titleField)).toBe(true);
    }
  });

  it('rejects script-ish URLs (javascript:, data:) in link and image fields', () => {
    const base = { title: 't', description: 'd', category: 'c' };
    expect(messages(() => validateContent(videos, { ...base, videoUrl: 'javascript:alert(1)' }))).not.toEqual([]);
    expect(messages(() => validateContent(videos, { ...base, videoUrl: 'https://youtu.be/abc', thumbnail: 'data:text/html,x' }))).not.toEqual([]);
    expect(() => validateContent(videos, { ...base, videoUrl: 'https://youtu.be/abc', thumbnail: '/uploads/a.png' })).not.toThrow();
  });

  it('reports every missing required field at once', () => {
    const msgs = messages(() => validateContent(videos, {}));
    expect(msgs).toEqual(expect.arrayContaining(['Title is required', 'Description is required', 'Video link or embed URL is required']));
  });

  it('drops unknown keys and trims strings', () => {
    const out = validateContent(videos, { title: '  Hi  ', description: 'd', category: 'c', videoUrl: 'https://youtu.be/abc', injected: '<script>' });
    expect(out.title).toBe('Hi');
    expect(out).not.toHaveProperty('injected');
  });

  it('enforces max lengths, select options and list size', () => {
    const cats = COLLECTION_BY_KEY.get('blog-categories')!.fields;
    expect(messages(() => validateContent(cats, { slug: 's', label: 'x'.repeat(61), gradient: 'green' }))).not.toEqual([]);
    expect(messages(() => validateContent(cats, { slug: 's', label: 'ok', gradient: 'neon' }))).not.toEqual([]);
    const social = BLOCK_BY_KEY.get('site.social')!.fields;
    const links = Array.from({ length: 13 }, () => ({ platform: 'twitter', url: 'https://x.com/a' }));
    expect(messages(() => validateContent(social, { links }))).not.toEqual([]);
  });

  it('validates nested list items (footer columns)', () => {
    const footer = BLOCK_BY_KEY.get('site.footer')!.fields;
    const bad = { columns: [{ title: 'Col', links: [{ label: 'x', href: 'javascript:1' }] }] };
    expect(messages(() => validateContent(footer, bad)).join(' ')).toMatch(/Link/);
  });

  it('rejects non-object payloads', () => {
    expect(() => validateContent(videos, 'nope')).toThrow(BadRequestException);
    expect(() => validateContent(videos, [])).toThrow(BadRequestException);
  });
});
