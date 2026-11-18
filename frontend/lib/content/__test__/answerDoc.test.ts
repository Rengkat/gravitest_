import { describe, expect, it } from "vitest";
import { normalizeAnswer, parseAnswer, pickFormat, serializeAnswer } from "../answerDoc";

const rt = (s: string) => normalizeAnswer(s);

describe("answerDoc — the stored text format survives the editor", () => {
  it.each([
    "",
    "plain words",
    "line one\nline two",
    "a\n\nb", // blank line between paragraphs
    "**bold** and *italic* and __under__",
    "P(2) = \\(\\frac{m}{170+m}\\)",
    "so \\(m = 30\\) done",
    "Hence\n\\[x = 2\\]\nDone",
    "2 * 3 = 6 and x^2", // never reinterpreted
    "snake__case and a*b",
    "**bold** \\(x^2\\) *it*",
    "\\(\\begin{pmatrix}1 & 2 \\\\ 3 & 4\\end{pmatrix}\\)",
  ])("round-trips %j", (s) => {
    expect(rt(s)).toBe(s);
  });

  it("parses runs with their format", () => {
    expect(parseAnswer("**b** x \\(y\\)")).toEqual([
      [
        { kind: "text", text: "b", format: "bold" },
        { kind: "text", text: " x ", format: null },
        { kind: "math", tex: "y", display: false },
      ],
    ]);
  });

  it("splits lines into paragraphs, including after a display equation", () => {
    expect(parseAnswer("a\n\\[x\\]\nb")).toEqual([
      [{ kind: "text", text: "a", format: null }],
      [{ kind: "math", tex: "x", display: true }],
      [{ kind: "text", text: "b", format: null }],
    ]);
  });

  it("keeps spaces OUTSIDE the markers so the formatting still parses", () => {
    const out = serializeAnswer([[{ kind: "text", text: " word ", format: "bold" }]]);
    expect(out).toBe(" **word** ");
    expect(parseAnswer(out)[0][1]).toEqual({ kind: "text", text: "word", format: "bold" });
  });

  it("writes whitespace-only formatted runs without markers", () => {
    expect(serializeAnswer([[{ kind: "text", text: "  ", format: "italic" }]])).toBe("  ");
  });

  it("drops trailing empty lines and empty equations", () => {
    expect(serializeAnswer([[{ kind: "text", text: "hi", format: null }], [], []])).toBe("hi");
    expect(serializeAnswer([[{ kind: "math", tex: "  ", display: false }]])).toBe("");
  });

  it("empty input is one empty line", () => {
    expect(parseAnswer("")).toEqual([[]]);
    expect(parseAnswer(null)).toEqual([[]]);
    expect(serializeAnswer([[]])).toBe("");
  });

  it("pickFormat keeps a single format when pasted text carries several", () => {
    expect(pickFormat({ bold: true, italic: true })).toBe("bold");
    expect(pickFormat({ italic: true, underline: true })).toBe("italic");
    expect(pickFormat({})).toBeNull();
  });
});
