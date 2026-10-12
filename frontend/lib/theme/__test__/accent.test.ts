import { describe, it, expect } from "vitest";
import {
  ACCENT_PRESETS,
  ACCENT_STEPS,
  DEFAULT_ACCENT,
  DEFAULT_SCALE,
  accentCss,
  buildAccentScale,
  normalizeHex,
} from "../accent";
import { isAppRoute } from "../apply";

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("normalizeHex", () => {
  it("accepts 3/6 digit hex with or without #, upper-cases", () => {
    expect(normalizeHex("#abc")).toBe("#AABBCC");
    expect(normalizeHex("2563eb")).toBe("#2563EB");
    expect(normalizeHex(" #2563EB ")).toBe("#2563EB");
  });
  it("rejects everything else", () => {
    for (const bad of ["", "#12", "#12345", "#1234567", "blue", "#ggg"]) expect(normalizeHex(bad)).toBeNull();
  });
});

describe("buildAccentScale", () => {
  it("returns the original palette untouched for the default accent", () => {
    expect(buildAccentScale(DEFAULT_ACCENT)).toBe(DEFAULT_SCALE);
    expect(buildAccentScale("garbage")).toBe(DEFAULT_SCALE);
  });

  it.each(ACCENT_PRESETS.map((p) => [p.id, p.hex]))(
    "%s: primary (800) carries white text and headings (900) stay readable on white",
    (_id, hex) => {
      const s = buildAccentScale(hex);
      expect(contrast(s[800], "#ffffff")).toBeGreaterThanOrEqual(7);
      expect(contrast(s[900], "#ffffff")).toBeGreaterThanOrEqual(12);
      // dark-mode text shades (50–300) must read on the dark surface
      for (const step of [50, 100, 200, 300] as const) expect(contrast(s[step], "#131c17")).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("is monotonic from light to dark", () => {
    for (const p of ACCENT_PRESETS) {
      const s = buildAccentScale(p.hex);
      const l = ACCENT_STEPS.map((k) => lum(s[k]));
      for (let i = 1; i < l.length; i++) expect(l[i]).toBeLessThanOrEqual(l[i - 1] + 1e-9);
    }
  });

  it("even a pale or near-white pick still yields a usable dark primary", () => {
    for (const hex of ["#FFF700", "#FFFFFF", "#000000", "#808080"]) {
      const s = buildAccentScale(hex);
      expect(contrast(s[800], "#ffffff")).toBeGreaterThanOrEqual(7);
    }
  });
});

describe("accentCss", () => {
  it("sets all ten variables with a selector that beats :root", () => {
    const css = accentCss("#2563EB");
    expect(css.startsWith("html:root{")).toBe(true);
    for (const s of ACCENT_STEPS) expect(css).toContain(`--accent-${s}:#`);
  });
});

describe("isAppRoute", () => {
  it("dark mode is scoped to the signed-in app", () => {
    for (const p of ["/dashboard", "/dashboard/library/1", "/admin", "/admin/settings", "/cbt/mcq/3", "/ai-tutor"])
      expect(isAppRoute(p)).toBe(true);
    for (const p of ["/", "/pricing", "/auth/login", "/administrator", "/dashboards"]) expect(isAppRoute(p)).toBe(false);
  });
});
