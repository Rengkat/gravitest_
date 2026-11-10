import { describe, expect, it } from 'vitest';
import { analyzePixels, chooseBackdrop, detectGraph, mayHaveTransparency } from '../imageAnalysis';

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

/** Paint a white W×H RGBA canvas, then draw black rectangles [x, y, w, h]. */
function canvas(W: number, H: number, rects: [number, number, number, number][] = []) {
  const d = new Uint8ClampedArray(W * H * 4).fill(255);
  for (const [rx, ry, rw, rh] of rects)
    for (let y = ry; y < ry + rh; y++)
      for (let x = rx; x < rx + rw; x++) {
        const o = (y * W + x) * 4;
        d[o] = d[o + 1] = d[o + 2] = 0;
      }
  return d;
}

describe('detectGraph', () => {
  const W = 160;
  const H = 120;

  /** Axes (x-axis along the bottom, y-axis up the left) with N tick marks on each. */
  const axesWithTicks = (n: number): [number, number, number, number][] => {
    const rects: [number, number, number, number][] = [[20, 96, 130, 2], [20, 10, 2, 88]];
    for (let i = 0; i < n; i++) {
      rects.push([30 + i * 18, 99, 1, 5]); // ticks hanging below the x-axis
      rects.push([14, 86 - i * 14, 5, 1]); // ticks poking left of the y-axis
    }
    return rects;
  };

  it('x/y axes with ticks along them are a graph', () => {
    expect(detectGraph(canvas(W, H, axesWithTicks(6)), W, H)).toBe(true);
  });

  it('gridlines count as marks (graph paper)', () => {
    const rects: [number, number, number, number][] = [[10, 60, 140, 1], [80, 8, 1, 104]];
    for (let i = 1; i < 8; i++) rects.push([10 + i * 17, 8, 1, 104], [10, 8 + i * 13, 140, 1]);
    expect(detectGraph(canvas(W, H, rects), W, H)).toBe(true);
  });

  it('axes with NO ticks, labels or grid are not enough on their own', () => {
    expect(detectGraph(canvas(W, H, [[20, 96, 130, 2], [20, 10, 2, 88]]), W, H)).toBe(false);
  });

  it('a right-angled triangle / L-shape (long horizontal + vertical, no marks) is NOT a graph', () => {
    // legs along the bottom and left, hypotenuse as a diagonal staircase
    const rects: [number, number, number, number][] = [[20, 100, 120, 2], [20, 20, 2, 82]];
    for (let i = 0; i < 80; i++) rects.push([20 + Math.round((i * 120) / 80), 100 - i, 2, 2]);
    expect(detectGraph(canvas(W, H, rects), W, H)).toBe(false);
  });

  it('a graph is recognised even when the real axis is not the first long line (plot box with a top border)', () => {
    const rects = [...axesWithTicks(6), [20, 10, 130, 1] as [number, number, number, number]]; // extra top spine
    expect(detectGraph(canvas(W, H, rects), W, H)).toBe(true);
  });

  it('two parallel lines (a typical geometry diagram) are NOT a graph', () => {
    expect(detectGraph(canvas(W, H, [[10, 20, 140, 2], [10, 90, 140, 2]]), W, H)).toBe(false);
  });

  it('a single baseline (number line) is NOT a graph, even with tick marks', () => {
    const rects: [number, number, number, number][] = [[8, 60, 144, 2]];
    for (let i = 0; i < 9; i++) rects.push([12 + i * 16, 62, 1, 5]);
    expect(detectGraph(canvas(W, H, rects), W, H)).toBe(false);
  });

  it('a lone vertical line is NOT a graph', () => {
    expect(detectGraph(canvas(W, H, [[80, 8, 2, 104]]), W, H)).toBe(false);
  });

  it('short lines (a small right-angle marker, a short altitude) are NOT a graph', () => {
    expect(detectGraph(canvas(W, H, [[20, 60, 30, 2], [20, 40, 2, 22]]), W, H)).toBe(false);
  });

  it('a picture frame / scan border around a diagram is NOT mistaken for axes', () => {
    const frame = canvas(W, H, [[0, 0, W, 1], [0, H - 1, W, 1], [0, 0, 1, H], [W - 1, 0, 1, H]]);
    expect(detectGraph(frame, W, H)).toBe(false);
  });

  it('a blank image and a tiny image are NOT graphs', () => {
    expect(detectGraph(canvas(W, H), W, H)).toBe(false);
    expect(detectGraph(canvas(8, 8, [[0, 4, 8, 1], [4, 0, 1, 8]]), 8, 8)).toBe(false);
  });

  it('a circle (pie chart / circle theorem) is NOT a graph', () => {
    const d = canvas(W, H);
    for (let a = 0; a < 720; a++) {
      const x = Math.round(80 + 45 * Math.cos((a * Math.PI) / 360));
      const y = Math.round(60 + 45 * Math.sin((a * Math.PI) / 360));
      const o = (y * W + x) * 4;
      d[o] = d[o + 1] = d[o + 2] = 0;
    }
    expect(detectGraph(d, W, H)).toBe(false);
  });

  it('transparent pixels are not ink', () => {
    const d = canvas(W, H, axesWithTicks(6));
    for (let i = 3; i < d.length; i += 4) d[i] = 0; // fully transparent
    expect(detectGraph(d, W, H)).toBe(false);
  });

  it('light-gray (anti-aliased, downscaled) thin axes still count as ink', () => {
    const d = canvas(W, H, axesWithTicks(6));
    for (let i = 0; i < d.length; i += 4) if (d[i] === 0) d[i] = d[i + 1] = d[i + 2] = 190; // 1px line averaged with white
    expect(detectGraph(d, W, H)).toBe(true);
  });
});
