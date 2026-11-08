import { describe, expect, it } from 'vitest';
import { analyzePixels, chooseBackdrop, mayHaveTransparency } from '../imageAnalysis';

/** Build RGBA pixels from a list of [r,g,b,a]. */
const px = (...p: [number, number, number, number][]) => Uint8ClampedArray.from(p.flat());
const repeat = (n: number, p: [number, number, number, number]) => Array.from({ length: n }, () => p);

describe('chooseBackdrop', () => {
  it('opaque white-paper diagram → paper (blends with the white container)', () => {
    const s = analyzePixels(px(...repeat(90, [255, 255, 255, 255]), ...repeat(10, [0, 0, 0, 255])));
    expect(s.transparentRatio).toBe(0);
    expect(chooseBackdrop(s)).toBe('paper');
  });

  it('opaque photo → paper (nothing to preserve)', () => {
    expect(chooseBackdrop(analyzePixels(px(...repeat(100, [120, 90, 60, 255]))))).toBe('paper');
  });

  it('transparent diagram drawn in DARK ink → paper (white behind dark lines, like print)', () => {
    const s = analyzePixels(px(...repeat(80, [0, 0, 0, 0]), ...repeat(20, [10, 10, 10, 255])));
    expect(s.transparentRatio).toBeCloseTo(0.8);
    expect(chooseBackdrop(s)).toBe('paper');
  });

  it('transparent diagram drawn in LIGHT ink → keeps its transparent background (white would hide it)', () => {
    const s = analyzePixels(px(...repeat(80, [0, 0, 0, 0]), ...repeat(20, [240, 240, 240, 255])));
    expect(chooseBackdrop(s)).toBe('transparent');
  });

  it('a few stray semi-transparent anti-aliased edge pixels do not count as a transparent image', () => {
    const s = analyzePixels(px(...repeat(99, [255, 255, 255, 255]), [0, 0, 0, 100]));
    expect(s.transparentRatio).toBeLessThan(0.02);
    expect(chooseBackdrop(s)).toBe('paper');
  });

  it('empty / unreadable data falls back to paper', () => {
    expect(chooseBackdrop(analyzePixels(new Uint8ClampedArray(0)))).toBe('paper');
  });
});

describe('mayHaveTransparency', () => {
  it.each([
    ['https://x.r2.dev/q/a.png', true],
    ['https://x.r2.dev/q/a.WEBP?v=2', true],
    ['https://x.r2.dev/q/a.jpg', false],
    ['https://x.r2.dev/q/a.jpeg#top', false],
    ['https://x.r2.dev/q/noextension', false],
  ])('%s → %s', (url, expected) => expect(mayHaveTransparency(url)).toBe(expected));
});
