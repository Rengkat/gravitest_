import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { $getRoot, type LexicalEditor } from "lexical";
import MathAnswerEditor from "../MathAnswerEditor";

function Harness({ start = "", onValue }: { start?: string; onValue?: (v: string) => void }) {
  const [v, setV] = useState(start);
  return (
    <>
      <MathAnswerEditor
        value={v}
        onChange={(n) => {
          setV(n);
          onValue?.(n);
        }}
        label="Your answer for 1a"
        placeholder="Write your answer for 1a here…"
      />
      <output data-testid="stored">{v}</output>
    </>
  );
}

const box = () => screen.getByRole("textbox", { name: /your answer for 1a/i });
const stored = () => screen.getByTestId("stored").textContent;
const lexical = () => (box() as unknown as { __lexicalEditor: LexicalEditor }).__lexicalEditor;

/** Select the first word the way a student drags over it: a real DOM range, then the browser's selectionchange. */
async function selectFirstWord() {
  await act(async () => {
    const textEl = box().querySelector('[data-lexical-text="true"]');
    const node = textEl?.firstChild as Text;
    const range = document.createRange();
    range.setStart(node, 0);
    range.setEnd(node, node.length);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
    await new Promise((r) => setTimeout(r, 0));
  });
}

async function buildFraction() {
  await userEvent.click(screen.getByRole("button", { name: "Fraction" }));
  await userEvent.keyboard("m");
  await userEvent.tab();
  await userEvent.keyboard("170+m");
  await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Insert equation" }));
}

describe("MathAnswerEditor", () => {
  test("is a labelled multi-line textbox with a placeholder when empty", () => {
    render(<Harness />);
    expect(box()).toHaveAttribute("aria-multiline", "true");
    expect(screen.getByText(/write your answer for 1a here/i)).toBeInTheDocument();
  });

  test("shows stored formatting and equations as the student meant them (WYSIWYG)", () => {
    render(<Harness start={"**bold** and \\(x^2\\)\nsecond line"} />);
    expect(box().querySelector(".font-bold")?.textContent).toBe("bold");
    expect(box().querySelector(".katex")).not.toBeNull();
    expect(box().textContent).not.toContain("\\(");
    expect(box().textContent).not.toContain("**");
    expect(box().querySelectorAll("p").length).toBe(2);
  });

  test("never rewrites the stored text just by opening it", () => {
    const onValue = vi.fn();
    render(<Harness start={"2 * 3 = 6 and x^2 **odd"} onValue={onValue} />);
    expect(onValue).not.toHaveBeenCalled();
  });

  test("Equation button → build a fraction → typeset in the text and saved as \\( … \\)", async () => {
    render(<Harness start="P(2) = " />);
    await userEvent.click(screen.getByRole("button", { name: "Insert equation" }));
    expect(screen.getByRole("dialog", { name: /insert equation/i })).toBeInTheDocument();
    await buildFraction();
    await waitFor(() => expect(stored()).toBe("P(2) = \\(\\frac{m}{170+m}\\)"));
    expect(box().querySelector(".mfrac")).not.toBeNull();
    expect(box().textContent).toContain("P(2) =");
  });

  test("Alt+= opens the equation tool from the keyboard (Word's shortcut)", async () => {
    render(<Harness />);
    fireEvent.keyDown(box(), { key: "=", altKey: true });
    expect(await screen.findByRole("dialog", { name: /insert equation/i })).toBeInTheDocument();
  });

  test("clicking an equation in the text edits THAT equation", async () => {
    render(<Harness start={"so \\(m = 30\\) done"} />);
    await userEvent.click(screen.getByTestId("answer-equation"));
    expect(await screen.findByRole("dialog", { name: /edit equation/i })).toBeInTheDocument();
    expect((screen.getByLabelText("Equation") as HTMLTextAreaElement).value).toBe("m = 30");
    fireEvent.change(screen.getByLabelText("Equation"), { target: { value: "m = 31" } });
    await userEvent.click(screen.getByRole("button", { name: "Update equation" }));
    await waitFor(() => expect(stored()).toBe("so \\(m = 31\\) done"));
  });

  test("a display equation is saved with display delimiters", async () => {
    render(<Harness start="Hence" />);
    await userEvent.click(screen.getByRole("button", { name: "Insert equation" }));
    fireEvent.change(screen.getByLabelText("Equation"), { target: { value: "x = 2" } });
    await userEvent.click(screen.getByLabelText(/on its own line/i));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Insert equation" }));
    await waitFor(() => expect(stored()).toBe("Hence\\[x = 2\\]"));
  });

  test("cancelling leaves the answer untouched", async () => {
    render(<Harness start="keep" />);
    await userEvent.click(screen.getByRole("button", { name: "Insert equation" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(stored()).toBe("keep");
  });

  test("symbol buttons insert the symbol into the text", async () => {
    render(<Harness start="x" />);
    await userEvent.click(screen.getByRole("button", { name: "Insert ²" }));
    await waitFor(() => expect(stored()).toBe("x²"));
  });

  test("Bold wraps the selection, and Italic REPLACES it (the saved format can't nest)", async () => {
    render(<Harness start="hello" />);
    await selectFirstWord();
    await userEvent.click(screen.getByRole("button", { name: "Bold" }));
    await waitFor(() => expect(stored()).toBe("**hello**"));
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");

    await selectFirstWord();
    await userEvent.click(screen.getByRole("button", { name: "Italic" }));
    await waitFor(() => expect(stored()).toBe("*hello*"));

    await selectFirstWord();
    await userEvent.click(screen.getByRole("button", { name: "Underline" }));
    await waitFor(() => expect(stored()).toBe("__hello__"));
  });

  test("toggling the same format again removes it", async () => {
    render(<Harness start={"**hello**"} />);
    await selectFirstWord();
    await userEvent.click(screen.getByRole("button", { name: "Bold" }));
    await waitFor(() => expect(stored()).toBe("hello"));
  });

  test("a change from outside (e.g. another part loaded) replaces what the editor shows", async () => {
    const { rerender } = render(<MathAnswerEditor value="first" onChange={() => {}} label="Your answer for 1a" />);
    expect(box().textContent).toBe("first");
    rerender(<MathAnswerEditor value={"second \\(y\\)"} onChange={() => {}} label="Your answer for 1a" />);
    await waitFor(() => expect(box().textContent).toContain("second"));
    expect(box().querySelector(".katex")).not.toBeNull();
  });

  test("emptying the editor stores an empty string", async () => {
    render(<Harness start="gone" />);
    await act(async () => {
      lexical().update(() => $getRoot().clear());
    });
    await waitFor(() => expect(stored()).toBe(""));
  });
});
