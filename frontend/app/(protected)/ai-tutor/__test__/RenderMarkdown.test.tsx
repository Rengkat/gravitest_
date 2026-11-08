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
    expect(block?.querySelector('annotation[encoding="application/x-tex"]')?.textContent).toBe("x^2 + 1");
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
