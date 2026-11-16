import { describe, expect, it } from "vitest";
import {
  applyTemplate, countEmptyBoxes, findEquationAt, findEquations, formatEquation, matrixTemplate,
  nextPlaceholder, previousPlaceholder, PLACEHOLDER, spliceText, systemTemplate,
} from "../equationEdit";
import { parseMarkup } from "../markup";

describe("findEquations / findEquationAt", () => {
  const text = "Value of \\(m\\) is \\(m = 30\\).\n\\[N = 170 + 30\\]\nDone";

  it("locates every equation with exact positions, delimiters included", () => {
    const eqs = findEquations(text);
    expect(eqs.map((e) => e.tex)).toEqual(["m", "m = 30", "N = 170 + 30"]);
    expect(eqs.map((e) => e.display)).toEqual([false, false, true]);
    for (const e of eqs) expect(text.slice(e.start, e.end)).toMatch(/^(\\\(|\\\[)/);
    expect(text.slice(eqs[1].start, eqs[1].end)).toBe("\\(m = 30\\)");
  });

  it("finds the equation the caret is inside (for 'Edit equation')", () => {
    const at = text.indexOf("30") + 1;
    expect(findEquationAt(text, at)?.tex).toBe("m = 30");
    expect(findEquationAt(text, text.indexOf("Done"))).toBeNull();
    expect(findEquationAt(text, 0)).toBeNull();
  });

  it("a selection must be entirely inside the equation", () => {
    const e = findEquations(text)[1];
    expect(findEquationAt(text, e.start + 2, e.end - 2)?.tex).toBe("m = 30");
    expect(findEquationAt(text, e.start - 3, e.end)).toBeNull();
  });

  it("handles $…$ and $$…$$ equations students typed by hand, but not prices", () => {
    const t = "Pay $5 then $x^2$ and $$\\frac{1}{2}$$";
    expect(findEquations(t).map((e) => e.tex)).toEqual(["x^2", "\\frac{1}{2}"]);
  });

  it("returns nothing for plain text", () => {
    expect(findEquations("no maths here")).toEqual([]);
  });
});

describe("formatEquation / spliceText", () => {
  it("inline equations use \\( \\)", () => expect(formatEquation("  x^2 ", false)).toBe("\\(x^2\\)"));
  it("display equations get their own lines", () => expect(formatEquation("x^2", true)).toBe("\n\\[x^2\\]\n"));

  it("replaces a range and reports the caret", () => {
    expect(spliceText("abcdef", 2, 4, "XY")).toEqual({ text: "abXYef", caret: 4 });
    expect(spliceText("abc", 3, 3, "Z")).toEqual({ text: "abcZ", caret: 4 });
  });

  it("replacing an existing equation edits it in place", () => {
    const text = "so \\(a+b\\) done";
    const eq = findEquations(text)[0];
    expect(spliceText(text, eq.start, eq.end, formatEquation("a-b", false)).text).toBe("so \\(a-b\\) done");
  });
});

describe("templates and empty boxes", () => {
  const frac = `\\frac{${PLACEHOLDER}}{${PLACEHOLDER}}`;

  it("selects the first empty box after inserting a template", () => {
    const r = applyTemplate("", 0, 0, frac);
    expect(r.tex).toBe(frac);
    expect(r.tex.slice(r.selStart, r.selEnd)).toBe(PLACEHOLDER);
    expect(r.selStart).toBe(frac.indexOf(PLACEHOLDER));
  });

  it("wraps the current selection into the first box (like wrapping text in a Word fraction)", () => {
    const r = applyTemplate("x+1", 0, 3, frac);
    expect(r.tex).toBe(`\\frac{x+1}{${PLACEHOLDER}}`);
    expect(r.tex.slice(r.selStart, r.selEnd)).toBe(PLACEHOLDER); // caret waits in the denominator
  });

  it("puts the caret after a template with no boxes", () => {
    const r = applyTemplate("a", 1, 1, "\\pi");
    expect(r).toEqual({ tex: "a\\pi", selStart: 4, selEnd: 4 });
  });

  it("inserts in the middle of existing maths", () => {
    const r = applyTemplate("a+b", 1, 1, "\\times");
    expect(r.tex).toBe("a\\times+b");
  });

  it("walks forwards and backwards through the empty boxes", () => {
    const tex = `\\frac{${PLACEHOLDER}}{${PLACEHOLDER}}+${PLACEHOLDER}`;
    const first = nextPlaceholder(tex, 0);
    const second = nextPlaceholder(tex, first + PLACEHOLDER.length);
    const third = nextPlaceholder(tex, second + PLACEHOLDER.length);
    expect([first, second, third].every((i) => i >= 0)).toBe(true);
    expect(nextPlaceholder(tex, third + PLACEHOLDER.length)).toBe(-1);
    expect(previousPlaceholder(tex, third)).toBe(second);
    expect(previousPlaceholder(tex, first)).toBe(-1);
    expect(countEmptyBoxes(tex)).toBe(3);
  });

  it("builds matrices of the requested size, clamped to something sensible", () => {
    const m = matrixTemplate(2, 3, "pmatrix");
    expect(m.startsWith("\\begin{pmatrix}")).toBe(true);
    expect(m.endsWith("\\end{pmatrix}")).toBe(true);
    expect(countEmptyBoxes(m)).toBe(6);
    expect(m.split("\\\\")).toHaveLength(2);
    expect(countEmptyBoxes(matrixTemplate(99, 99, "bmatrix"))).toBe(36);
    expect(countEmptyBoxes(matrixTemplate(0, 0, "vmatrix"))).toBe(1);
  });

  it("builds systems of equations", () => {
    const cases = systemTemplate(3, "cases");
    expect(cases).toContain("\\begin{cases}");
    expect(countEmptyBoxes(cases)).toBe(3);
    const aligned = systemTemplate(2, "aligned");
    expect(countEmptyBoxes(aligned)).toBe(4);
    expect(aligned).toContain("&=");
  });
});

describe("parseMarkup (B / I / U formatting when an answer is displayed)", () => {
  const kinds = (s: string) => parseMarkup(s).map((t) => `${t.kind}:${t.value}`);

  it("bold, italic and underline", () => {
    expect(kinds("a **b** c *d* e __f__ g")).toEqual([
      "text:a ", "bold:b", "text: c ", "italic:d", "text: e ", "underline:f", "text: g",
    ]);
  });

  it("leaves arithmetic and ordinary typing alone", () => {
    for (const s of ["2 * 3 * 4", "a*b", "5*x + 2*y", "snake__case__name", "**unclosed", "* spaced *", "x ** 2"]) {
      expect(parseMarkup(s)).toEqual([{ kind: "text", value: s }]);
    }
  });

  it("works across several lines independently", () => {
    expect(kinds("**one**\n*two*")).toEqual(["bold:one", "text:\n", "italic:two"]);
  });

  it("returns plain text unchanged", () => {
    expect(parseMarkup("nothing special")).toEqual([{ kind: "text", value: "nothing special" }]);
    expect(parseMarkup("")).toEqual([]);
  });
});
