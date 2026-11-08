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
