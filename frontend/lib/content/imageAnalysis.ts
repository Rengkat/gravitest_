/**
 * Decides what should sit BEHIND a question image. Pure functions over pixel data so the rule is testable.
 *
 *  - Opaque images (photos, scans, diagrams on a white page — the normal case) and transparent images drawn
 *    in dark ink  → "paper": a white backdrop, exactly like a diagram printed on a sheet of paper. This is what
 *    removes the "image floating in a dark frame" look in dark mode.
 *  - Transparent images drawn in LIGHT ink (made for a dark surface) → "transparent": keep the app's own
 *    surface behind them, otherwise they would vanish on white.
 */

export type Backdrop = 'paper' | 'transparent';

export interface PixelStats {
  /** Share of pixels that are meaningfully see-through (alpha < 250). */
  transparentRatio: number;
  /** Mean relative luminance (0 = black … 1 = white) of the visible (alpha ≥ 128) pixels. */
  visibleLuminance: number;
  sampled: number;
}

/** RGBA bytes, as produced by canvas getImageData().data. */
export function analyzePixels(rgba: ArrayLike<number>): PixelStats {
  let transparent = 0;
  let lumSum = 0;
  let visible = 0;
  const total = Math.floor(rgba.length / 4);
  for (let i = 0; i < total; i++) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    const a = rgba[i * 4 + 3];
    if (a < 250) transparent++;
    if (a >= 128) {
      lumSum += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      visible++;
    }
  }
  return {
    transparentRatio: total ? transparent / total : 0,
    visibleLuminance: visible ? lumSum / visible : 0,
    sampled: total,
  };
}

export const TRANSPARENCY_THRESHOLD = 0.02;
export const LIGHT_INK_THRESHOLD = 0.72;

export function chooseBackdrop(stats: PixelStats): Backdrop {
  if (stats.sampled === 0 || stats.transparentRatio < TRANSPARENCY_THRESHOLD) return 'paper';
  // Transparent AND light-coloured: intended for a dark surface — don't force white behind it.
  return stats.visibleLuminance >= LIGHT_INK_THRESHOLD ? 'transparent' : 'paper';
}

/** Only PNG/WebP can carry transparency; JPEG never does, so it needs no analysis (and no CORS request). */
export function mayHaveTransparency(url: string): boolean {
  return /\.(png|webp)(?:[?#]|$)/i.test(url);
}

/* ── graph / chart detection ─────────────────────────────────────────── */

export type ImageKind = 'diagram' | 'graph';

const INK_LUMINANCE = 215; // 0–255: darker than this is "ink". Generous, because thin lines fade when downscaled.
const AXIS_SPAN = 0.6; // a line must cross at least 60% of the image to count as an axis
const EDGE_MARGIN = 0.03; // ignore the outer 3% so a scan border is not mistaken for axes
const MIN_MARKS = 4; // an axis needs at least this many ticks / labels / gridlines along it
const MARK_BAND = 0.09; // how far (as a share of the image) from an axis we look for those marks

interface Run {
  start: number;
  length: number;
}

/** Longest run of `true` along a line, bridging gaps of up to `tolerance` pixels (anti-aliased / dashed lines). */
function longestRun(isInk: (i: number) => boolean, length: number, tolerance: number): Run {
  let start = 0;
  let run = 0;
  let gap = 0;
  let best: Run = { start: 0, length: 0 };
  for (let i = 0; i < length; i++) {
    if (isInk(i)) {
      if (run === 0) start = i;
      run += gap > 0 ? gap + 1 : 1;
      gap = 0;
      if (run > best.length) best = { start, length: run };
    } else if (++gap > tolerance) {
      run = 0;
      gap = 0;
    }
  }
  return best;
}

/** Number of separate ink segments between `from` and `to` along one line. */
function countSegments(isInk: (i: number) => boolean, from: number, to: number): number {
  let n = 0;
  let inside = false;
  for (let i = from; i < to; i++) {
    const ink = isInk(i);
    if (ink && !inside) n++;
    inside = ink;
  }
  return n;
}

/**
 * Does this look like a graph or chart rather than a geometry diagram?
 *
 * A graph has AXES (a long horizontal line and a long vertical line, not on the border) and, along each,
 * a row of ticks, numbers, labels or gridlines. That second part is what separates it from the shapes that
 * merely contain a long horizontal and a long vertical line: a right-angled triangle, a rectangle, a framed
 * picture. Parallel lines, a number line, a pie chart or a circle have no such pair at all.
 *
 * A heuristic, and an honest one: a wrong guess only ever costs a taller (never cropped) or shorter image,
 * and the image can always be enlarged with a click. Pass the downscaled RGBA pixels from a canvas.
 */
export function detectGraph(rgba: ArrayLike<number>, width: number, height: number): boolean {
  if (width < 16 || height < 16 || rgba.length < width * height * 4) return false;

  const ink = (x: number, y: number) => {
    const o = (y * width + x) * 4;
    if (rgba[o + 3] < 128) return false;
    return 0.299 * rgba[o] + 0.587 * rgba[o + 1] + 0.114 * rgba[o + 2] < INK_LUMINANCE;
  };

  const x0 = Math.floor(width * EDGE_MARGIN);
  const x1 = Math.ceil(width * (1 - EDGE_MARGIN));
  const y0 = Math.floor(height * EDGE_MARGIN);
  const y1 = Math.ceil(height * (1 - EDGE_MARGIN));
  const hTol = Math.max(1, Math.round(width * 0.04)); // bridges the gaps of a dashed or anti-aliased axis
  const vTol = Math.max(1, Math.round(height * 0.04));

  // Every long horizontal / vertical line (not on the border), one per cluster of adjacent rows/columns.
  // A plot box has several (top spine, bottom spine, gridlines); only the real axis has ticks and labels beside it,
  // so each candidate is judged on its own rather than just taking the first or longest.
  const MAX_CANDIDATES = 12;
  const hLines: (Run & { at: number })[] = [];
  for (let y = y0; y < y1 && hLines.length < MAX_CANDIDATES; y++) {
    const r = longestRun((x) => ink(x, y), width, hTol);
    if (r.length < width * AXIS_SPAN) continue;
    const last = hLines[hLines.length - 1];
    if (last && y - last.at <= 2) continue; // same (thick) line
    hLines.push({ ...r, at: y });
  }
  const vLines: (Run & { at: number })[] = [];
  for (let x = x0; x < x1 && vLines.length < MAX_CANDIDATES; x++) {
    const r = longestRun((y) => ink(x, y), height, vTol);
    if (r.length < height * AXIS_SPAN) continue;
    const last = vLines[vLines.length - 1];
    if (last && x - last.at <= 2) continue;
    vLines.push({ ...r, at: x });
  }
  if (hLines.length === 0 || vLines.length === 0) return false;

  // Marks alongside a line: ticks, numbers, labels, gridlines crossing it.
  const marksAlong = (line: Run & { at: number }, horizontal: boolean): number => {
    const band = Math.max(3, Math.round((horizontal ? height : width) * MARK_BAND));
    let best = 0;
    for (let d = 2; d <= band; d++) {
      for (const pos of [line.at - d, line.at + d]) {
        if (pos < 0 || pos >= (horizontal ? height : width)) continue;
        const n = countSegments(
          horizontal ? (x) => ink(x, pos) : (y) => ink(pos, y),
          line.start,
          line.start + line.length,
        );
        if (n > best) best = n;
      }
    }
    return best;
  };

  const hasHorizontalAxis = hLines.some((l) => marksAlong(l, true) >= MIN_MARKS);
  const hasVerticalAxis = vLines.some((l) => marksAlong(l, false) >= MIN_MARKS);
  return hasHorizontalAxis && hasVerticalAxis;
}
