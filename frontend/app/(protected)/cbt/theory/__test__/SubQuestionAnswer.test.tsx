import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import SubQuestionAnswer from "../components/SubQuestionAnswer";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AIResult, Answer, SubQuestion } from "@/types/examsTypes";
import userEvent from "@testing-library/user-event";

//_______mock_____
vi.mock("../components/LinedCanvas", () => ({ default: () => <div data-testid="lined-canvas" /> }));
vi.mock("../components/GraphCanvas", () => ({ default: () => <div data-testid="graph-canvas" /> }));
vi.mock("../components/ConstructionCanvas", () => ({
  default: () => <div data-testid="construction-canvas" />,
}));

vi.mock("@/Components/discussion/QuestionDiscussion", () => ({
  default: (p: { questionId?: string; partId?: string | null }) => (
    <div data-testid="discussion" data-question={p.questionId ?? ""} data-part={p.partId ?? ""} />
  ),
}));

vi.mock("../components/AIResultPanel", () => ({
  default: ({ result, onToggleSolution }: { result: AIResult; onToggleSolution: () => void }) => (
    <div data-testid="ai-result-panel">
      <span>{result.feedback}</span>
      <button onClick={onToggleSolution}>Toggle solution</button>
    </div>
  ),
}));
const mockSubQuestion: SubQuestion = {
  id: "sq-1",
  sessionQuestionId: "sq-1",
  path: "",
  label: "1a",
  text: "Explain Newton's second law.",
  marks: 4,
  modelAnswer: "The answer is 42.",
};

const baseAnswer: Answer = {
  subQuestionId: "sq-1",
  type: "type",
  content: "",
  whiteboardData: undefined,
  graphData: undefined,
  constructionData: undefined,
  uploadData: null,
};

const mockAIResult: AIResult = {
  score: 3,
  maxScore: 4,
  feedback: "Good attempt.",
  strengths: ["Clear explanation"],
  improvements: ["Add units"],
  showSolution: false,
};

const defaultProps = {
  subQuestion: mockSubQuestion,
  answer: baseAnswer,
  onAnswerChange: vi.fn(),
  mode: "practice" as const,
  isSubmitted: false,
  aiResult: undefined,
  onAIScore: vi.fn(),
  onToggleSolution: vi.fn(),
  onElaborated: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());
function renderComponent(overrides: Record<string, unknown> = {}) {
  return render(<SubQuestionAnswer {...defaultProps} {...overrides} />);
}
describe("tabs", () => {
  test("renders all five tabs when not submitted", () => {
    renderComponent();
    ["Type", "Whiteboard", "Graph Sheet", "Construction", "Upload"].forEach((label) => {
      expect(screen.getByRole("button", { name: new RegExp(label, "i") })).toBeInTheDocument();
    });
  });
  test("switching tab calls onAnswerChange with the new type", async () => {
    const onAnswerChange = vi.fn();
    renderComponent({ onAnswerChange });

    await userEvent.click(screen.getByRole("button", { name: /whiteboard/i }));

    expect(onAnswerChange).toHaveBeenCalledWith(expect.objectContaining({ type: "whiteboard" }));
  });
  test("switching to graph tab sets type to graph", async () => {
    const onAnswerChange = vi.fn();
    renderComponent({ onAnswerChange });

    await userEvent.click(screen.getByRole("button", { name: /graph sheet/i }));

    expect(onAnswerChange).toHaveBeenCalledWith(expect.objectContaining({ type: "graph" }));
  });

  test("switching to construction tab sets type to construction", async () => {
    const onAnswerChange = vi.fn();
    renderComponent({ onAnswerChange });

    await userEvent.click(screen.getByRole("button", { name: /construction/i }));

    expect(onAnswerChange).toHaveBeenCalledWith(expect.objectContaining({ type: "construction" }));
  });
});
describe("type panel", () => {
  test("renders the answer editor with its placeholder", () => {
    renderComponent();
    expect(screen.getByRole("textbox", { name: /your answer for 1a/i })).toBeInTheDocument();
    expect(screen.getByText(/write your answer for 1a here/i)).toBeInTheDocument();
  });

  test("shows the saved answer inside the editor", () => {
    renderComponent({ answer: { ...baseAnswer, content: "hello world" } });
    expect(screen.getByRole("textbox", { name: /your answer for 1a/i })).toHaveTextContent("hello world");
  });

  test("calls onAnswerChange with the stored text when a symbol is added", async () => {
    const onAnswerChange = vi.fn();
    renderComponent({ onAnswerChange, answer: { ...baseAnswer, content: "x" } });
    await userEvent.click(screen.getByRole("button", { name: "Insert ²" }));
    await waitFor(() =>
      expect(onAnswerChange).toHaveBeenCalledWith(expect.objectContaining({ type: "type", content: "x²" })),
    );
  });

  test("shows word count and char count", () => {
    renderComponent({ answer: { ...baseAnswer, content: "hello world" } });
    expect(screen.getByText(/2 words/i)).toBeInTheDocument();
    expect(screen.getByText(/11 chars/i)).toBeInTheDocument();
  });

  test("shows singular 'word' for a single word", () => {
    renderComponent({ answer: { ...baseAnswer, content: "hello" } });
    expect(screen.getByText(/^1 word$/i)).toBeInTheDocument();
  });

  test("shows 0 words for empty content", () => {
    renderComponent({ answer: { ...baseAnswer, content: "" } });
    expect(screen.getByText(/^0 words$/i)).toBeInTheDocument();
  });

  test("when submitted the answer is shown read-only (typeset), not as an editable box", () => {
    renderComponent({
      isSubmitted: true,
      answer: { ...baseAnswer, content: "my answer" },
    });
    expect(screen.queryByRole("textbox")).toBeNull(); // nothing to edit
    expect(screen.getByRole("region", { name: /your answer for/i })).toHaveTextContent("my answer");
  });

  test("hides word and char count when submitted", () => {
    renderComponent({
      isSubmitted: true,
      answer: { ...baseAnswer, content: "my answer" },
    });
    expect(screen.queryByText(/words/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/chars/i)).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════
// 3. FORMATTING TOOLBAR
// ════════════════════════════════════════════════════════════════

describe("formatting toolbar", () => {
  test("renders bold, italic and underline buttons", () => {
    renderComponent();
    expect(screen.getByTitle("Bold")).toBeInTheDocument();
    expect(screen.getByTitle("Italic")).toBeInTheDocument();
    expect(screen.getByTitle("Underline")).toBeInTheDocument();
  });

  test("hides formatting toolbar when submitted", () => {
    renderComponent({ isSubmitted: true });
    expect(screen.queryByTitle("Bold")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Italic")).not.toBeInTheDocument();
  });

  test("the format buttons are real toggles (aria-pressed) and are wired to the editor", () => {
    renderComponent({ answer: { ...baseAnswer, content: "hello" } });
    for (const name of ["Bold", "Italic", "Underline"]) {
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
    }
  });

  test("renders all math symbol buttons", () => {
    renderComponent();
    ["²", "³", "π", "√", "±", "×", "÷", "°", "½", "∞", "≤", "≥", "≠", "∝"].forEach((sym) => {
      expect(screen.getByTitle(`Insert ${sym}`)).toBeInTheDocument();
    });
  });

  test("clicking a symbol inserts it into the content", async () => {
    const onAnswerChange = vi.fn();
    renderComponent({ onAnswerChange, answer: { ...baseAnswer, content: "x" } });

    await userEvent.click(screen.getByTitle("Insert ²"));

    await waitFor(() =>
      expect(onAnswerChange).toHaveBeenCalledWith(
        expect.objectContaining({ content: expect.stringContaining("²") }),
      ),
    );
  });
});

// ════════════════════════════════════════════════════════════════
// 4. CANVAS PANELS (whiteboard / graph / construction)
// ════════════════════════════════════════════════════════════════

describe("canvas panels", () => {
  test("renders LinedCanvas when whiteboard tab is active", async () => {
    renderComponent();
    await userEvent.click(screen.getByRole("button", { name: /whiteboard/i }));
    expect(screen.getByTestId("lined-canvas")).toBeInTheDocument();
  });

  test("renders GraphCanvas when graph tab is active", async () => {
    renderComponent();
    await userEvent.click(screen.getByRole("button", { name: /graph sheet/i }));
    expect(screen.getByTestId("graph-canvas")).toBeInTheDocument();
  });

  test("renders ConstructionCanvas when construction tab is active", async () => {
    renderComponent();
    await userEvent.click(screen.getByRole("button", { name: /construction/i }));
    expect(screen.getByTestId("construction-canvas")).toBeInTheDocument();
  });

  test("shows whiteboard image after submission", () => {
    renderComponent({
      isSubmitted: true,
      answer: { ...baseAnswer, type: "whiteboard", whiteboardData: "data:image/png;base64,wb" },
    });
    expect(screen.getByAltText(/whiteboard answer/i)).toBeInTheDocument();
  });

  test("shows graph image after submission", () => {
    renderComponent({
      isSubmitted: true,
      answer: { ...baseAnswer, type: "graph", graphData: "data:image/png;base64,gr" },
    });
    expect(screen.getByAltText(/graph answer/i)).toBeInTheDocument();
  });

  test("shows construction image after submission", () => {
    renderComponent({
      isSubmitted: true,
      answer: { ...baseAnswer, type: "construction", constructionData: "data:image/png;base64,co" },
    });
    expect(screen.getByAltText(/construction answer/i)).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════
// 5. UPLOAD PANEL
// ════════════════════════════════════════════════════════════════

describe("upload panel", () => {
  async function switchToUpload(onAnswerChange = vi.fn()) {
    renderComponent({ onAnswerChange });
    await userEvent.click(screen.getByRole("button", { name: /^upload$/i }));
    return onAnswerChange;
  }

  test("shows drag-and-drop zone when no file is uploaded", async () => {
    await switchToUpload();
    expect(screen.getByText(/click or drag/i)).toBeInTheDocument();
  });

  test("calls onAnswerChange with correct uploadData when image is selected", async () => {
    const onAnswerChange = await switchToUpload();
    const file = new File(["img-content"], "photo.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(onAnswerChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "upload",
          uploadData: expect.objectContaining({
            name: "photo.png",
            type: "image/png",
          }),
        }),
      );
    });
  });

  test("shows Remove and Replace buttons when a file is already present", async () => {
    renderComponent({
      answer: {
        ...baseAnswer,
        type: "upload",
        uploadData: { name: "test.png", data: "data:image/png;base64,abc", type: "image/png" },
      },
    });
    await userEvent.click(screen.getByRole("button", { name: /^upload$/i }));

    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /replace/i })).toBeInTheDocument();
  });

  test("remove button sets uploadData to null", async () => {
    const onAnswerChange = vi.fn();
    renderComponent({
      onAnswerChange,
      answer: {
        ...baseAnswer,
        type: "upload",
        uploadData: { name: "test.png", data: "data:image/png;base64,abc", type: "image/png" },
      },
    });
    await userEvent.click(screen.getByRole("button", { name: /^upload$/i }));
    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(onAnswerChange).toHaveBeenCalledWith(expect.objectContaining({ uploadData: null }));
  });

  test("shows PDF filename for non-image upload in submitted view", () => {
    renderComponent({
      isSubmitted: true,
      answer: {
        ...baseAnswer,
        type: "upload",
        uploadData: {
          name: "essay.pdf",
          data: "data:application/pdf;base64,abc",
          type: "application/pdf",
        },
      },
    });
    expect(screen.getByText("essay.pdf")).toBeInTheDocument();
  });

  test("shows uploaded image in submitted view", () => {
    renderComponent({
      isSubmitted: true,
      answer: {
        ...baseAnswer,
        type: "upload",
        uploadData: {
          name: "photo.png",
          data: "data:image/png;base64,abc",
          type: "image/png",
        },
      },
    });
    expect(screen.getByAltText(/uploaded answer/i)).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════
// 6. PRACTICE MODE — per-part "Check Answer"
// ════════════════════════════════════════════════════════════════

describe("practice mode: the answer box opens on demand (like Show Model Answer)", () => {
  test("starts collapsed: the question can be read first, with no answer box or tabs in the way", () => {
    renderComponent({ hasAnswer: false });
    const toggle = screen.getByRole("button", { name: /attempt question/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("textbox", { name: /your answer for 1a/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^whiteboard/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /check answer/i })).toBeNull();
  });

  test("clicking it opens the answer box and the tabs; clicking again hides them", async () => {
    renderComponent({ hasAnswer: false });
    await userEvent.click(screen.getByRole("button", { name: /attempt question/i }));
    expect(screen.getByRole("button", { name: /hide answer box/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("textbox", { name: /your answer for 1a/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^whiteboard/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /hide answer box/i }));
    expect(screen.queryByRole("textbox", { name: /your answer for 1a/i })).toBeNull();
  });

  test("hiding the box keeps what was written", async () => {
    renderComponent({ answer: { ...baseAnswer, content: "my working" }, hasAnswer: true });
    await userEvent.click(screen.getByRole("button", { name: /hide answer box/i }));
    await userEvent.click(screen.getByRole("button", { name: /attempt question/i }));
    expect(screen.getByRole("textbox", { name: /your answer for 1a/i })).toHaveTextContent("my working");
  });

  test("opens straight away when this part already has an answer (e.g. resuming)", () => {
    renderComponent({ answer: { ...baseAnswer, content: "already" }, hasAnswer: true });
    expect(screen.getByRole("textbox", { name: /your answer for 1a/i })).toBeInTheDocument();
  });

  test("exam mode never hides the answer box and has no toggle", () => {
    renderComponent({ mode: "exam", hasAnswer: false });
    expect(screen.queryByRole("button", { name: /attempt question/i })).toBeNull();
    expect(screen.getByRole("textbox", { name: /your answer for 1a/i })).toBeInTheDocument();
  });

  test("the read-only view after submission is unaffected", () => {
    renderComponent({ isSubmitted: true, answer: { ...baseAnswer, content: "done" }, hasAnswer: true });
    expect(screen.queryByRole("button", { name: /attempt question/i })).toBeNull();
    expect(screen.getByRole("region", { name: /your answer for 1a/i })).toHaveTextContent("done");
  });
});

describe("practice mode: Check Answer for this part", () => {
  const answered = { ...baseAnswer, content: "F = ma" };

  test("shows an accessible Check Answer button naming the part", () => {
    renderComponent({ answer: answered, hasAnswer: true });
    expect(screen.getByRole("button", { name: /check answer for 1a/i })).toBeEnabled();
  });

  test("calls onAIScore (for this part only) when clicked", async () => {
    const onAIScore = vi.fn();
    renderComponent({ answer: answered, hasAnswer: true, onAIScore });
    await userEvent.click(screen.getByRole("button", { name: /check answer for 1a/i }));
    expect(onAIScore).toHaveBeenCalledTimes(1);
  });

  test("is disabled, with a hint, until something has been answered", async () => {
    renderComponent({ hasAnswer: false });
    await userEvent.click(screen.getByRole("button", { name: /attempt question/i }));
    expect(screen.getByRole("button", { name: /check answer/i })).toBeDisabled();
    expect(screen.getByText(/write or upload an answer for this part first/i)).toBeInTheDocument();
  });

  test("is disabled and shows progress while THIS part is being graded", () => {
    renderComponent({ answer: answered, hasAnswer: true, isGrading: true });
    const btn = screen.getByRole("button", { name: /check answer/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/checking your answer/i)).toBeInTheDocument();
  });

  test("hides the button and shows the result once graded", () => {
    renderComponent({ answer: answered, hasAnswer: true, aiResult: mockAIResult });
    expect(screen.queryByRole("button", { name: /^check answer/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("ai-result-panel")).toBeInTheDocument();
    expect(screen.getByText("Good attempt.")).toBeInTheDocument();
  });

  test("a failed grading shows an alert with Try again and keeps the typed answer", async () => {
    const onAIScore = vi.fn();
    renderComponent({
      answer: answered,
      hasAnswer: true,
      gradeError: "This part could not be graded right now.",
      onAIScore,
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/could not be graded/i);
    expect(screen.getByRole("textbox", { name: /your answer for 1a/i })).toHaveTextContent("F = ma");
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onAIScore).toHaveBeenCalledTimes(1);
  });

  test("editing after grading marks the grade stale and offers Check Answer again", () => {
    renderComponent({ answer: answered, hasAnswer: true, aiResult: mockAIResult, isStale: true });
    expect(screen.getByText(/feedback below is for your earlier version/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /check answer again/i })).toBeInTheDocument();
  });

  test("calls onToggleSolution when the result panel fires the toggle", async () => {
    const onToggleSolution = vi.fn();
    renderComponent({ aiResult: mockAIResult, onToggleSolution });
    await userEvent.click(screen.getByRole("button", { name: /toggle solution/i }));
    expect(onToggleSolution).toHaveBeenCalledTimes(1);
  });

  test("two parts render independent state (one graded, one not)", () => {
    render(
      <>
        <SubQuestionAnswer {...defaultProps} subQuestion={{ ...mockSubQuestion, id: "a", label: "(a)" }} aiResult={mockAIResult} hasAnswer />
        <SubQuestionAnswer {...defaultProps} subQuestion={{ ...mockSubQuestion, id: "b", label: "(b)" }} hasAnswer isGrading />
      </>,
    );
    expect(screen.getAllByTestId("ai-result-panel")).toHaveLength(1);
    expect(screen.getAllByText(/checking your answer/i)).toHaveLength(1);
  });
});

// ════════════════════════════════════════════════════════════════
// 7. EXAM MODE — nothing is revealed while the exam is in progress
// ════════════════════════════════════════════════════════════════

describe("exam mode", () => {
  test("never offers Check Answer or any feedback during the exam", () => {
    renderComponent({ mode: "exam", hasAnswer: true });
    expect(screen.queryByRole("button", { name: /check answer/i })).not.toBeInTheDocument();
    expect(screen.queryByText("The answer is 42.")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ai-result-panel")).not.toBeInTheDocument();
  });

  test("does not leak the model answer even if the sub-question carries one", () => {
    renderComponent({ mode: "exam", isSubmitted: false });
    expect(screen.queryByText(/model answer/i)).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════
// 8. AFTER SUBMISSION — read-only view of any attached result
// ════════════════════════════════════════════════════════════════

describe("after submission", () => {
  test("renders an attached AI result read-only", () => {
    renderComponent({ isSubmitted: true, aiResult: mockAIResult });
    expect(screen.getByTestId("ai-result-panel")).toBeInTheDocument();
  });

  test("offers no grading button once submitted", () => {
    renderComponent({ isSubmitted: true, mode: "practice" });
    expect(screen.queryByRole("button", { name: /check answer/i })).not.toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════
// 9. DISCUSSION placement (per sub-question, never during an exam)
// ════════════════════════════════════════════════════════════════

describe("discussion", () => {
  const part = { ...mockSubQuestion, questionId: "q-1", partId: "part-a-id" };

  test("practice: appears under THIS part's AI result, bound to the question and the part's permanent id", () => {
    renderComponent({ subQuestion: part, mode: "practice", aiResult: mockAIResult, hasAnswer: true });
    const discussion = screen.getByTestId("discussion");
    expect(discussion).toHaveAttribute("data-question", "q-1");
    expect(discussion).toHaveAttribute("data-part", "part-a-id");
    const panel = screen.getByTestId("ai-result-panel");
    expect(panel.compareDocumentPosition(discussion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("practice: not shown before this part has been graded", () => {
    renderComponent({ subQuestion: part, mode: "practice", hasAnswer: true });
    expect(screen.queryByTestId("discussion")).not.toBeInTheDocument();
  });

  test("exam mode: never shown while the exam is in progress, even with a result attached", () => {
    renderComponent({ subQuestion: part, mode: "exam", isSubmitted: false, aiResult: mockAIResult, hasAnswer: true });
    expect(screen.queryByTestId("discussion")).not.toBeInTheDocument();
  });

  test("after submission it is rendered (the server then decides whether grading has been released)", () => {
    renderComponent({ subQuestion: part, mode: "exam", isSubmitted: true, aiResult: mockAIResult });
    expect(screen.getByTestId("discussion")).toHaveAttribute("data-part", "part-a-id");
  });
});

// ════════════════════════════════════════════════════════════════
// 10. EQUATIONS: the Insert-equation tool, preview, and typeset display
// ════════════════════════════════════════════════════════════════

function Harness({ start = "", isSubmitted = false }: { start?: string; isSubmitted?: boolean }) {
  const [answer, setAnswer] = useState<Answer>({ ...baseAnswer, content: start });
  return (
    <SubQuestionAnswer
      {...defaultProps}
      answer={answer}
      onAnswerChange={(a: Answer) => setAnswer(a)}
      isSubmitted={isSubmitted}
    />
  );
}
const box = () => screen.getByRole("textbox", { name: /your answer for 1a/i });
const stored = () => screen.getByTestId("stored-answer").textContent;

function StoredHarness({ start = "" }: { start?: string }) {
  const [answer, setAnswer] = useState<Answer>({ ...baseAnswer, content: start });
  return (
    <>
      <SubQuestionAnswer {...defaultProps} answer={answer} onAnswerChange={(a: Answer) => setAnswer(a)} />
      <output data-testid="stored-answer">{answer.content}</output>
    </>
  );
}

describe("equation tool (WYSIWYG editor)", () => {
  test("the toolbar has an Insert equation button next to the formatting buttons", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Insert equation" })).toBeInTheDocument();
    for (const name of ["Bold", "Italic", "Underline"]) expect(screen.getByRole("button", { name: name })).toBeInTheDocument();
  });

  test("every toolbar symbol button has an accessible name", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Insert π" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Insert ≤" })).toBeInTheDocument();
  });

  test("build a fraction: it is typeset IN the answer and stored as \\( … \\)", async () => {
    render(<StoredHarness start="P(2) = " />);
    await userEvent.click(screen.getByRole("button", { name: "Insert equation" }));
    await userEvent.click(screen.getByRole("button", { name: "Fraction" }));
    await userEvent.keyboard("m");
    await userEvent.tab();
    await userEvent.keyboard("170+m");
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Insert equation" }));
    await waitFor(() => expect(stored()).toBe("P(2) = \\(\\frac{m}{170+m}\\)"));
    expect(box().querySelector(".mfrac")).not.toBeNull(); // typeset live, no separate preview needed
    expect(box().textContent).toContain("P(2) =");
  });

  test("there is no separate preview any more — the editor already shows the typeset answer", () => {
    render(<Harness start={"**bold** and \\(x^2\\)"} />);
    expect(screen.queryByRole("button", { name: /show preview/i })).toBeNull();
    expect(box().querySelector(".font-bold")?.textContent).toBe("bold");
    expect(box().querySelector(".katex")).not.toBeNull();
  });

  test("Alt+= opens the tool from the keyboard (Word's shortcut)", async () => {
    render(<Harness />);
    fireEvent.keyDown(box(), { key: "=", altKey: true });
    expect(await screen.findByRole("dialog", { name: /insert equation/i })).toBeInTheDocument();
  });

  test("clicking an equation edits that equation instead of adding another", async () => {
    render(<StoredHarness start={"so \\(m = 30\\) done"} />);
    await userEvent.click(screen.getByTestId("answer-equation"));
    expect(await screen.findByRole("dialog", { name: /edit equation/i })).toBeInTheDocument();
    expect((screen.getByLabelText("Equation") as HTMLTextAreaElement).value).toBe("m = 30");
    fireEvent.change(screen.getByLabelText("Equation"), { target: { value: "m = 31" } });
    await userEvent.click(screen.getByRole("button", { name: "Update equation" }));
    await waitFor(() => expect(stored()).toBe("so \\(m = 31\\) done"));
  });

  test("cancelling leaves the answer untouched", async () => {
    render(<StoredHarness start="keep" />);
    await userEvent.click(screen.getByRole("button", { name: "Insert equation" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(stored()).toBe("keep");
  });

  test("opening an answer never rewrites what was stored (asterisks, carets, odd markers)", () => {
    render(<StoredHarness start="2 * 3 = 6 and x^2" />);
    expect(stored()).toBe("2 * 3 = 6 and x^2");
    expect(box()).toHaveTextContent("2 * 3 = 6 and x^2");
  });
});

describe("after submission the answer is shown typeset", () => {
  test("equations and formatting are rendered, and it is not editable", () => {
    render(<Harness start={"Value of \\(m = 30\\)\n**Done**"} isSubmitted />);
    const region = screen.getByRole("region", { name: /your answer for 1a/i });
    expect(region.querySelector(".katex")).not.toBeNull();
    expect(region.querySelector("strong")?.textContent).toBe("Done");
    expect(region.textContent).not.toContain("\\(");
    expect(screen.queryByPlaceholderText(/write your answer/i)).toBeNull();
    expect(screen.queryByRole("button", { name: "Insert equation" })).toBeNull();
  });

  test("an empty submitted answer says so", () => {
    render(<Harness isSubmitted />);
    expect(screen.getByText(/no typed answer/i)).toBeInTheDocument();
  });
});
