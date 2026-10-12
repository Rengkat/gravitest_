// Accent colour helpers.
//
// The whole UI is written against Tailwind's `green-*` scale (green-800 is the
// primary button colour, green-50 the tint, and so on). globals/theme.css points
// that scale at the CSS variables --accent-50 … --accent-900, so recolouring the
// platform means nothing more than setting those ten variables — which is what
// accentCss() produces.

export const DEFAULT_ACCENT = "#2E8B57"; // keep in sync with the server entity

export const ACCENT_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
export type AccentStep = (typeof ACCENT_STEPS)[number];
export type AccentScale = Record<AccentStep, string>;

// The original palette, byte for byte. Used as-is for the default accent so a
// platform that never touches the setting looks exactly like it did before.
export const DEFAULT_SCALE: AccentScale = {
  50: "#edfff5",
  100: "#d4f5e2",
  200: "#a8dfc2",
  300: "#5dc98a",
  400: "#3aab6a",
  500: "#2e8b57",
  600: "#276b43",
  700: "#1f5c38",
  800: "#1a4a2e",
  900: "#0d2b1a",
};

export const ACCENT_PRESETS: { id: string; label: string; hex: string }[] = [
  { id: "green", label: "Green", hex: DEFAULT_ACCENT },
  { id: "blue", label: "Blue", hex: "#2563EB" },
  { id: "purple", label: "Purple", hex: "#7C3AED" },
  { id: "teal", label: "Teal", hex: "#0D9488" },
  { id: "orange", label: "Orange", hex: "#EA580C" },
  { id: "red", label: "Red", hex: "#DC2626" },
  { id: "gold", label: "Gold", hex: "#CA8A04" },
];

/** "#abc" | "abc" | "#AABBCC" → "#AABBCC", or null if it is not a hex colour. */
export function normalizeHex(input: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return `#${h.toUpperCase()}`;
}

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

// Lightness ladder taken from the default green palette, so every generated
// scale has the same tonal structure: a very dark 800/900 (primary buttons,
// headings) that always carries white text, and pale 50/100 tints.
const LIGHTNESS: Record<AccentStep, number> = {
  50: 0.97, 100: 0.9, 200: 0.78, 300: 0.71, 400: 0.52, 500: 0.36, 600: 0.28, 700: 0.235, 800: 0.19, 900: 0.1,
};

/**
 * Builds a 50–900 scale from one colour. Only the hue and saturation of the
 * input are used; lightness comes from the fixed ladder above, which is what
 * keeps text legible whatever colour an admin picks.
 */
export function buildAccentScale(input: string): AccentScale {
  const hex = normalizeHex(input) ?? DEFAULT_ACCENT;
  if (hex === DEFAULT_ACCENT) return DEFAULT_SCALE;
  const [h, s] = hexToHsl(hex);
  const sat = Math.min(0.85, Math.max(0.12, s));
  const out = {} as AccentScale;
  for (const step of ACCENT_STEPS) {
    // pale tints look muddy at full saturation; ease them off a little
    const k = step <= 100 ? 0.9 : 1;
    out[step] = hslToHex(h, Math.min(1, sat * k), LIGHTNESS[step]);
  }
  return out;
}

/** CSS that sets --accent-50 … --accent-900. `html:root` beats the :root defaults regardless of source order. */
export function accentCss(input: string): string {
  const scale = buildAccentScale(input);
  return `html:root{${ACCENT_STEPS.map((s) => `--accent-${s}:${scale[s]}`).join(";")}}`;
}
