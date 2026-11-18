import { describe, expect, it } from "vitest";
import katex from "katex";
import { normalizeTexUnicode as n } from "../texUnicode";

describe("normalizeTexUnicode", () => {
  it("leaves ordinary LaTeX untouched", () => {
    expect(n("\\frac{a}{b} + x^2")).toBe("\\frac{a}{b} + x^2");
  });

  it("turns a typed √ into a proper root", () => {
    expect(n("\\frac{2}{√3}")).toBe("\\frac{2}{\\sqrt{3}}");
    expect(n("√(x+1)")).toBe("\\sqrt{x+1}");
    expect(n("√x + 1")).toBe("\\sqrt{x} + 1");
    expect(n("√(a+(b+c))")).toBe("\\sqrt{a+(b+c)}");
  });

  it("superscripts, operators, relations, Greek", () => {
    expect(n("x²+y³")).toBe("x^{2}+y^{3}");
    expect(n("10⁻³")).toBe("10^{-3}");
    expect(n("a × b ÷ c")).toBe("a \\times  b \\div  c");
    expect(n("x ≤ 5")).toContain("\\leq");
    expect(n("πr²")).toBe("\\pi r^{2}");
    expect(n("30°")).toBe("30^{\\circ}");
  });

  it("keeps \\text{…} literal", () => {
    expect(n("\\text{cost × 2} × 3")).toBe("\\text{cost × 2} \\times  3");
  });

  it("leaves unknown symbols alone and an unmatched √ safe", () => {
    expect(n("x ☃")).toBe("x ☃");
    expect(n("√")).toBe("\\surd ");
  });

  it("everything it produces typesets without a KaTeX error", () => {
    for (const t of ["\\frac{2}{√3}", "x²+y³", "a × b ÷ c", "πr²", "x ≤ 5 ≠ 3", "30°", "∝ k", "√(x+1)", "½", "10⁻³"]) {
      const html = katex.renderToString(n(t), { throwOnError: false, strict: "ignore" });
      expect(html, t).not.toContain("katex-error");
    }
  });
});
