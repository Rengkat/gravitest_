import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EquationDialog from "../EquationDialog";
import { EQUATION_CATEGORIES, ALL_TEMPLATES } from "@/lib/content/equationTemplates";
import { renderTex } from "../MathSpan";

const BOX = "\\square";
const field = () => screen.getByLabelText("Equation") as HTMLTextAreaElement;
const open = (props: Partial<React.ComponentProps<typeof EquationDialog>> = {}) => {
  const onInsert = vi.fn();
  const onClose = vi.fn();
  render(<EquationDialog onInsert={onInsert} onClose={onClose} {...props} />);
  return { onInsert, onClose };
};
const selected = (f: HTMLTextAreaElement) => f.value.slice(f.selectionStart, f.selectionEnd);

describe("EquationDialog — basics", () => {
  it("is a labelled dialog with the equation field focused and nothing to insert yet", () => {
    open();
    expect(screen.getByRole("dialog", { name: /insert equation/i })).toBeInTheDocument();
    expect(field()).toHaveFocus();
    expect(screen.getByRole("button", { name: "Insert equation" })).toBeDisabled();
    expect(screen.getByTestId("equation-preview")).toHaveTextContent(/appears here/i);
  });

  it("a fraction goes in with empty boxes, the first box is selected, and the preview typesets a real fraction", async () => {
    open();
    await userEvent.click(screen.getByRole("button", { name: "Fraction" }));
    expect(field().value).toBe(`\\frac{${BOX}}{${BOX}}`);
    expect(selected(field())).toBe(BOX); // ready to type the numerator
    expect(screen.getByTestId("equation-preview").querySelector(".mfrac")).not.toBeNull();
    expect(screen.getByText(/2 empty boxes left/i)).toBeInTheDocument();
  });

  it("typing into the selected box replaces it, and Tab jumps to the next box", async () => {
    open();
    await userEvent.click(screen.getByRole("button", { name: "Fraction" }));
    await userEvent.keyboard("m"); // replaces the selected first box
    expect(field().value).toBe(`\\frac{m}{${BOX}}`);
    await userEvent.tab(); // → denominator box
    expect(selected(field())).toBe(BOX);
    await userEvent.keyboard("170+m");
    expect(field().value).toBe("\\frac{m}{170+m}");
    expect(screen.queryByText(/empty boxes? left/i)).toBeNull();
  });

  it("Shift+Tab jumps back to the previous box", async () => {
    open({ initialTex: `\\frac{${BOX}}{${BOX}}` });
    const f = field();
    const second = f.value.lastIndexOf(BOX);
    f.setSelectionRange(second, second + BOX.length);
    await userEvent.tab({ shift: true });
    expect(f.selectionStart).toBe(f.value.indexOf(BOX));
  });

  it("when no boxes are left, Tab behaves normally and leaves the field (no keyboard trap)", async () => {
    open({ initialTex: "x+1" });
    field().setSelectionRange(3, 3);
    await userEvent.tab();
    expect(field()).not.toHaveFocus();
  });

  it("text selected first goes into the first box (like wrapping a selection in a Word fraction)", async () => {
    open({ initialTex: "x+1" });
    field().setSelectionRange(0, 3);
    await userEvent.click(screen.getByRole("button", { name: "Fraction" }));
    expect(field().value).toBe(`\\frac{x+1}{${BOX}}`);
    expect(selected(field())).toBe(BOX); // caret waits in the denominator
  });

  it("inserts at the caret in the middle of existing maths", async () => {
    open({ initialTex: "a+b" });
    field().setSelectionRange(1, 1);
    await userEvent.click(screen.getByRole("button", { name: "Multiplication sign" }));
    expect(field().value).toBe("a\\times+b");
  });

  it("warns, without blocking, when a typed equation has a mistake", async () => {
    open();
    fireEvent.change(field(), { target: { value: "\\frac{1" } });
    expect(screen.getByText(/has a mistake/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Insert equation" })).toBeEnabled();
  });
});

describe("EquationDialog — inserting and closing", () => {
  it("Insert passes back the equation (trimmed) as an inline equation by default", async () => {
    const { onInsert } = open();
    await userEvent.type(field(), "  x^2  ");
    await userEvent.click(screen.getByRole("button", { name: "Insert equation" }));
    expect(onInsert).toHaveBeenCalledWith("x^2", false);
  });

  it("'on its own line' makes it a display equation", async () => {
    const { onInsert } = open();
    await userEvent.type(field(), "x^2");
    await userEvent.click(screen.getByLabelText(/on its own line/i));
    await userEvent.click(screen.getByRole("button", { name: "Insert equation" }));
    expect(onInsert).toHaveBeenCalledWith("x^2", true);
  });

  it("Ctrl+Enter inserts from the keyboard", async () => {
    const { onInsert } = open();
    await userEvent.type(field(), "\\pi r^2");
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    expect(onInsert).toHaveBeenCalledWith("\\pi r^2", false);
  });

  it("editing mode: prefilled, titled 'Edit equation', and the button says Update", () => {
    open({ editing: true, initialTex: "a+b", initialDisplay: true });
    expect(screen.getByRole("dialog", { name: /edit equation/i })).toBeInTheDocument();
    expect(field().value).toBe("a+b");
    expect(screen.getByLabelText(/on its own line/i)).toBeChecked();
    expect(screen.getByRole("button", { name: "Update equation" })).toBeEnabled();
  });

  it("Cancel and the close button close without inserting", async () => {
    const { onClose, onInsert } = open({ initialTex: "x" });
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: /close equation editor/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onInsert).not.toHaveBeenCalled();
  });

  it("keys pressed inside never reach a surrounding page or dialog", async () => {
    let outer = 0;
    render(
      <div onKeyDown={() => (outer += 1)}>
        <EquationDialog onInsert={vi.fn()} onClose={vi.fn()} />
      </div>,
    );
    await userEvent.type(field(), "ab");
    await userEvent.keyboard("{Escape}");
    expect(outer).toBe(0);
  });
});

describe("EquationDialog — building blocks", () => {
  const pick = async (category: RegExp) => userEvent.click(screen.getByRole("button", { name: category }));

  it("offers every kind of part: fractions, scripts, symbols, Greek, geometry, calculus, chemistry, matrices", () => {
    open();
    for (const c of EQUATION_CATEGORIES) expect(screen.getByRole("button", { name: c.label })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Matrices & systems" })).toBeInTheDocument();
  });

  it("the category buttons say which one is selected", async () => {
    open();
    expect(screen.getByRole("button", { name: "Fractions & roots" })).toHaveAttribute("aria-pressed", "true");
    await pick(/^Greek letters$/);
    expect(screen.getByRole("button", { name: "Greek letters" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Fractions & roots" })).toHaveAttribute("aria-pressed", "false");
  });

  it.each([
    [/^Powers & subscripts$/, "Power", `${BOX}^{${BOX}}`],
    [/^Powers & subscripts$/, "Subscript", `${BOX}_{${BOX}}`],
    [/^Greek letters$/, "Greek pi", "\\pi"],
    [/^Symbols$/, "Less than or equal to", "\\le"],
    [/^Geometry$/, "Angle", "\\angle"],
    [/^Trigonometry & calculus$/, "Summation", `\\sum_{${BOX}}^{${BOX}} ${BOX}`],
    [/^Chemistry & units$/, "Water", "\\ce{H2O}"],
  ])("%s → %s", async (category, name, expected) => {
    open();
    await pick(category);
    await userEvent.click(screen.getByRole("button", { name }));
    expect(field().value).toBe(expected);
  });

  it("every building block has a unique, spoken name and typesets without error", () => {
    const names = ALL_TEMPLATES.map((t) => `${t.tex}`);
    for (const c of EQUATION_CATEGORIES) {
      const inCategory = c.templates.map((t) => t.name);
      expect(new Set(inCategory).size).toBe(inCategory.length); // no two buttons in a category share a name
    }
    for (const tex of names) expect(renderTex(tex, false)).not.toContain("katex-error");
  });

  it("builds a matrix of the chosen size", async () => {
    open();
    await pick(/^Matrices & systems$/);
    fireEvent.change(screen.getByLabelText("Rows"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Columns"), { target: { value: "3" } });
    await userEvent.click(screen.getByRole("button", { name: /add 2×3 matrix/i }));
    expect(field().value.startsWith("\\begin{pmatrix}")).toBe(true);
    expect(field().value.split(BOX).length - 1).toBe(6);
    expect(screen.getByTestId("equation-preview").querySelector(".katex-mathml mtable")).not.toBeNull();
  });

  it("builds a determinant when asked", async () => {
    open();
    await pick(/^Matrices & systems$/);
    await userEvent.selectOptions(screen.getByLabelText("Brackets"), "vmatrix");
    await userEvent.click(screen.getByRole("button", { name: /add 2×2 matrix/i }));
    expect(field().value).toContain("\\begin{vmatrix}");
  });

  it("builds simultaneous equations", async () => {
    open();
    await pick(/^Matrices & systems$/);
    await userEvent.selectOptions(screen.getByLabelText("Layout"), "aligned");
    await userEvent.click(screen.getByRole("button", { name: /add 2 equations/i }));
    expect(field().value).toContain("\\begin{aligned}");
    expect(field().value.split("&=").length - 1).toBe(2);
  });

  it("a typical probability working can be built and inserted end to end", async () => {
    const { onInsert } = open();
    await userEvent.type(field(), "P(2) = ");
    await userEvent.click(screen.getByRole("button", { name: "Fraction" }));
    await userEvent.keyboard("m");
    await userEvent.tab();
    await userEvent.keyboard("170+m");
    await userEvent.type(field(), " = 0.15");
    await userEvent.click(screen.getByRole("button", { name: "Insert equation" }));
    expect(onInsert).toHaveBeenCalledWith("P(2) = \\frac{m}{170+m} = 0.15", false);
  });
});
