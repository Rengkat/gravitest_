import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import MathSpan, { renderTex } from "../MathSpan";
import MathText from "../MathText";
import RichContent from "../RichContent";

const mathml = (c: HTMLElement) => c.querySelector(".katex-mathml math");

describe("MathSpan — typesetting", () => {
  it("renders a fraction as a real fraction (numerator over denominator), not as 'a+b/c+d' text", () => {
    const { container } = render(<MathSpan tex="\frac{a+b}{c+d}" />);
    expect(container.querySelector(".katex .mfrac")).not.toBeNull();
    expect(mathml(container)?.querySelector("mfrac")).not.toBeNull();
  });

  it("exposes MathML to assistive technology and hides the visual layer from it", () => {
    const { container } = render(<MathSpan tex="x^2" />);
    expect(mathml(container)).not.toBeNull();
    expect(container.querySelector(".katex-html")?.getAttribute("aria-hidden")).toBe("true");
    // The original TeX travels along as an annotation, so the structure is recoverable.
    expect(container.querySelector('annotation[encoding="application/x-tex"]')?.textContent).toBe("x^2");
  });

  it.each([
    ["quadratic formula", "x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}", ["mfrac", "msqrt", "msup"]],
    ["Pythagoras", "a^2+b^2=c^2", ["msup"]],
    ["chemical equation", "2H_2+O_2\\rightarrow 2H_2O", ["msub", "mo"]],
    ["Avogadro", "N=nN_A", ["msub"]],
    ["summation", "\\sum_{i=1}^{n} i", ["msubsup"]],
    ["integral", "\\int_0^1 x\\,dx", ["msubsup"]],
    ["greek letters", "\\alpha+\\beta=\\pi", ["mi"]],
    ["trig + log", "\\sin\\theta+\\log_{10}x", ["msub"]],
    ["inequality", "x \\le 5 \\ne 3", ["mo"]],
    ["root of order n", "\\sqrt[3]{27}", ["mroot"]],
  ])("%s renders without error", (_name, tex, tags) => {
    const { container } = render(<MathSpan tex={tex} />);
    expect(container.querySelector(".katex-error")).toBeNull();
    for (const t of tags) expect(mathml(container)?.querySelector(t)).not.toBeNull();
  });

  it("renders a matrix", () => {
    const { container } = render(<MathSpan display tex="\begin{pmatrix}1&2\\3&4\end{pmatrix}" />);
    expect(container.querySelector(".katex-error")).toBeNull();
    expect(mathml(container)?.querySelector("mtable")).not.toBeNull();
  });

  it("renders simultaneous / multi-line equations with their line breaks", () => {
    const { container } = render(
      <MathSpan display tex="\begin{aligned}2x+y&=7\\x-y&=2\end{aligned}" />,
    );
    expect(container.querySelector(".katex-error")).toBeNull();
    expect(mathml(container)?.querySelectorAll("mtr").length).toBe(2);
  });

  it("renders chemistry with mhchem (\\ce) and units (\\pu)", () => {
    const { container } = render(
      <>
        <MathSpan tex="\ce{2H2 + O2 -> 2H2O}" />
        <MathSpan tex="\pu{9.8 m s-2}" />
      </>,
    );
    expect(container.querySelector(".katex-error")).toBeNull();
    expect(container.querySelectorAll(".katex").length).toBe(2);
  });

  it("display math is a block that scrolls inside itself instead of widening the page", () => {
    const { container } = render(<MathSpan display tex="x" />);
    const block = container.querySelector('[data-math="display"]');
    expect(block?.className).toMatch(/overflow-x-auto/);
    expect(block?.className).toMatch(/max-w-full/);
  });

  it("inline math flows with the text", () => {
    const { container } = render(<p>so <MathSpan tex="x" /> here</p>);
    expect(container.querySelector('span[data-math="inline"]')).not.toBeNull();
  });
});

describe("MathSpan — safety", () => {
  it("never emits a link or image from \\href / \\url / \\includegraphics (trust is off)", () => {
    for (const tex of ["\\href{javascript:alert(1)}{click}", "\\url{https://evil.example}", "\\includegraphics{https://evil.example/x.png}"]) {
      const html = renderTex(tex, false);
      expect(html).not.toMatch(/<a[\s>]/i);
      expect(html).not.toMatch(/<img/i);
      // (The TeX source may appear as inert text inside the error rendering; what must never exist is a live URL.)
      expect(html).not.toMatch(/(href|src)\s*=\s*["']?\s*javascript:/i);
    }
  });

  it("a malformed expression shows as error text and does not throw", () => {
    expect(() => render(<MathSpan tex="\frac{1" />)).not.toThrow();
    expect(renderTex("\\frac{1", false)).toContain("katex-error");
  });

  it("a macro-expansion bomb is refused rather than freezing the page", () => {
    const { container } = render(<MathSpan tex="\def\a{\a\a}\a" />);
    expect(container.textContent).toBeTruthy(); // fell back to showing the source
  });

  it("does not execute markup smuggled in as text", () => {
    const { container } = render(<MathSpan tex="<img src=x onerror=alert(1)>" />);
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("MathText — stems, options and short text", () => {
  it("typesets the reported legacy fraction inside the sentence and keeps the words as text", () => {
    const { container } = render(<MathText text="The expression (5x + 3)/[6x(x + 1)] will be undefined when x equals" />);
    expect(container.querySelector(".mfrac")).not.toBeNull();
    expect(container.textContent).toContain("will be undefined when x equals");
    expect(container.textContent).not.toContain("(5x + 3)/[6x(x + 1)]"); // no longer shown as raw text
  });

  it("renders explicit LaTeX delimiters", () => {
    const { container } = render(<MathText text={"Solve \\(x^2=9\\) now"} />);
    expect(container.querySelector('[data-math="inline"] .msupsub')).not.toBeNull();
  });

  it("renders block equations from \\[ \\]", () => {
    const { container } = render(<MathText text={"Hence\n\\[x=\\frac{1}{2}\\]"} />);
    expect(container.querySelector('[data-math="display"] .mfrac')).not.toBeNull();
  });

  it("legacyMath off: plain text with carets stays plain (AI replies and comments use explicit delimiters)", () => {
    const { container } = render(<MathText legacyMath={false} text="Use x^2 and (a+1)/(b+2) literally" />);
    expect(container.querySelector(".katex")).toBeNull();
    expect(container.textContent).toBe("Use x^2 and (a+1)/(b+2) literally");
  });

  it("legacyMath off still renders explicit delimiters", () => {
    const { container } = render(<MathText legacyMath={false} text={"a \\(b\\) c"} />);
    expect(container.querySelector(".katex")).not.toBeNull();
  });

  it("ordinary text stays ordinary: prices, backslashes, and/or, and fractions of words", () => {
    const s = "It costs $5 and $10, path C:\\Users, and/or 3/4 of the (cat)/(dog) story";
    const { container } = render(<MathText text={s} />);
    expect(container.querySelector(".katex")).toBeNull();
    expect(container.textContent).toBe(s);
  });

  it("preserves the author's line breaks", () => {
    const { container } = render(<MathText text={"line one\nline two"} />);
    expect(container.firstElementChild?.className).toMatch(/whitespace-pre-line/);
    expect(container.textContent).toBe("line one\nline two");
  });

  it("renders nothing for empty content", () => {
    expect(render(<MathText text="" />).container).toBeEmptyDOMElement();
    expect(render(<MathText text={null} />).container).toBeEmptyDOMElement();
  });

  it("a multiple-choice option holding only maths renders as maths", () => {
    const { container } = render(<MathText text="(x+1)/(x-1)" />);
    expect(container.querySelector(".mfrac")).not.toBeNull();
  });
});

describe("RichContent — explanations, model answers, AI replies", () => {
  it("renders Markdown structure and typeset maths together", () => {
    const { container } = render(
      <RichContent text={"### Step 1\nUse \\(a^2+b^2=c^2\\).\n\n- first\n- **second**"} />,
    );
    const heading = container.querySelector('[role="heading"]');
    expect(heading?.textContent).toBe("Step 1"); // a real (ARIA) heading, so screen-reader users can navigate by it
    expect(heading?.getAttribute("aria-level")).toBe("5");
    expect(container.querySelectorAll("li").length).toBe(2);
    expect(container.querySelector("strong")?.textContent).toBe("second");
    expect(container.querySelector(".katex")).not.toBeNull();
    expect(container.textContent).not.toContain("###");
    expect(container.textContent).not.toContain("\\(");
  });

  it("renders multi-step block solutions", () => {
    const { container } = render(
      <RichContent text={"\\[\n\\begin{aligned}2x+3&=7\\\\2x&=4\\\\x&=2\\end{aligned}\n\\]"} />,
    );
    expect(container.querySelector('[data-math="display"]')).not.toBeNull();
    expect(container.querySelectorAll(".katex-mathml mtr").length).toBe(3);
  });

  it("stored explanations get legacy maths upgraded when asked", () => {
    const { container } = render(<RichContent legacyMath text="Factorise (x^2 - 1)/(x - 1) to get x + 1." />);
    expect(container.querySelector(".mfrac")).not.toBeNull();
  });

  it("AI text is never legacy-upgraded by default", () => {
    const { container } = render(<RichContent text="Compare x^2 with H_2O in prose" />);
    expect(container.querySelector(".katex")).toBeNull();
  });

  it("does not render code blocks as maths", () => {
    const { container } = render(<RichContent legacyMath text={"```\nx^2 + (a+1)/(b+2)\n```"} />);
    expect(container.querySelector(".katex")).toBeNull();
    expect(container.textContent).toContain("x^2 + (a+1)/(b+2)");
  });

  it("renders nothing for empty content", () => {
    expect(render(<RichContent text="   " />).container).toBeEmptyDOMElement();
  });
});
