import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import renderMarkdown from "../components/RenderMarkdown";

// Maths is rendered by the shared MathSpan (real KaTeX, no mock): these tests check that the delimiters are
// recognised AND that real typeset maths — not raw LaTeX — comes out.
vi.mock("katex/dist/katex.min.css", () => ({}));

const show = (text: string) => render(<div>{renderMarkdown(text)}</div>);

describe("RenderMarkdown — blocks", () => {
  it("renders a horizontal rule for ---", () => {
    const { container } = show("Before\n\n---\n\nAfter");
    expect(container.querySelector("hr")).not.toBeNull();
    expect(container.textContent).not.toContain("---");
  });

  it("renders a table even when rows are separated by blank lines", () => {
    const md = "| A | B |\n\n|---|---|\n\n| **x** | y |\n\n| z | w |";
    const { container } = show(md);
    expect(container.querySelectorAll("th")).toHaveLength(2);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(container.textContent).not.toContain("|");
    expect(screen.getByText("x").tagName).toBe("STRONG");
  });

  it("merges a list marker that sits alone on its line with the next line", () => {
    const { container } = show("1.\nWhere? Thylakoid\n2.\nWhat they need:");
    const items = container.querySelectorAll("ol > li");
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain("Where? Thylakoid");
  });

  it("nests bullets under the ordered item they follow", () => {
    const { container } = show("2. What they need:\n- Light\n- Water\n3. Key steps");
    const first = container.querySelector("ol > li");
    expect(first?.querySelectorAll("ul > li")).toHaveLength(2);
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
  });

  it("nests an ordered list that restarts at 1 under item 3", () => {
    const { container } = show("1. A\n2. B\n3. C\n1. one\n2. two\n3. three");
    const items = container.querySelectorAll("ol > li");
    expect(items).toHaveLength(3);
    expect(items[2].querySelectorAll("ol > li")).toHaveLength(3);
  });

  it("renders fenced code verbatim", () => {
    const { container } = show("```\nlet a = **1**;\n```");
    expect(container.querySelector("pre code")?.textContent).toBe("let a = **1**;");
  });
});

describe("RenderMarkdown — inline", () => {
  it("renders *italic*", () => {
    show("This is *light-driven* work");
    expect(screen.getByText("light-driven").tagName).toBe("EM");
  });

  it("routes \\[ … \\] across several lines to display maths", () => {
    const { container } = show("Equation:\n\n\\[\n\nx^2 + 1\n\n\\]\n\nDone");
    const block = container.querySelector('[data-math="display"]');
    expect(block).not.toBeNull();
    expect(block?.querySelector('annotation[encoding="application/x-tex"]')?.textContent).toBe(
      "x^2 + 1",
    );
    expect(block?.querySelector(".katex-mathml msup")).not.toBeNull(); // typeset, not raw text
  });

  it("routes \\( … \\) and $x^2$ to inline maths, but leaves prices alone", () => {
    const { container } = show("Use \\(E = mc^2\\) and $x^2$. It costs $5 and $10.");
    expect(container.querySelectorAll('[data-math="inline"]')).toHaveLength(2);
    expect(container.querySelectorAll(".katex")).toHaveLength(2);
    expect(container.textContent).toContain("$5 and $10");
  });

  it("an unclosed \\[ block (still streaming) falls back to plain text", () => {
    const { container } = show("Equation: \n\\[\nx^2");
    expect(container.querySelector('[data-math="display"]')).toBeNull();
    expect(container.textContent).toContain("x^2");
  });
});

describe("RenderMarkdown — quotes and layout modes", () => {
  const render2 = (md: string, opts?: Parameters<typeof renderMarkdown>[1]) =>
    render(<div>{renderMarkdown(md, opts)}</div>).container;

  it("renders consecutive '>' lines as ONE blockquote and strips the markers", () => {
    const c = render2("Intro\n\n> step one\n> step two\n\nAfter");
    expect(c.querySelectorAll("blockquote")).toHaveLength(1);
    expect(c.querySelector("blockquote")?.textContent).toBe("step onestep two");
    expect(c.textContent).not.toContain(">");
  });

  it("a blank line between quoted groups makes two quotes", () => {
    expect(render2("> a\n\n> b").querySelectorAll("blockquote")).toHaveLength(2);
  });

  it("each quoted line is its own paragraph (steps are not run together)", () => {
    const c = render2("> one\n> two\n> three");
    expect(c.querySelectorAll("blockquote p")).toHaveLength(3);
  });

  it("supports bold, lists and maths inside a quote", () => {
    const c = render2("> **Note:** use \\(x^2\\)\n> - first\n> - second");
    expect(c.querySelector("blockquote strong")?.textContent).toBe("Note:");
    expect(c.querySelector("blockquote .katex")).not.toBeNull();
    expect(c.querySelectorAll("blockquote li")).toHaveLength(2);
  });

  it("a '>' in the middle of a line is just text", () => {
    const c = render2("if a > b then c");
    expect(c.querySelector("blockquote")).toBeNull();
    expect(c.textContent).toBe("if a > b then c");
  });

  it("COMPACT (the default, used by the tutor chat) keeps its tight spacing and ignores bold-only titles", () => {
    const c = render2("**Title**\n\nSome text\n\n- a\n- b");
    expect(c.querySelector('[role="heading"]')).toBeNull();
    expect(c.querySelector("p")?.className).toMatch(/my-1\b/);
    expect(c.querySelector("ul")?.className).toMatch(/space-y-0\.5/);
  });

  it("SPACIOUS opts in to roomy paragraphs, lists and bold-only section titles", () => {
    const c = render2("**Title**\n\nSome text\n\n- a\n- b", { spacious: true });
    expect(c.querySelector('[role="heading"]')?.textContent).toBe("Title");
    expect(c.querySelectorAll("p")[1]?.className).toMatch(/my-3/);
    expect(c.querySelector("ul")?.className).toMatch(/space-y-2/);
  });
});
