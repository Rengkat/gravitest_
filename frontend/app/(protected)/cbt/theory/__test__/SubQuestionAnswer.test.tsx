import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SubQuestionAnswer from "../components/SubQuestionAnswer";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AIResult, Answer, SubQuestion } from "@/types/examsTypes";
import userEvent from "@testing-library/user-event";

//_______mock_____
vi.mock("../LinedCanvas", () => ({ default: () => <div data-testid="lined-canvas" /> }));
vi.mock("../GraphCanvas", () => ({ default: () => <div data-testid="graph-canvas" /> }));
vi.mock("../ConstructionCanvas", () => ({
  default: () => <div data-testid="construction-canvas" />,
}));

vi.mock("../AIResultPanel", () => ({
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
  test("renders textarea with correct placeholder", () => {
    renderComponent();
    expect(screen.getByPlaceholderText(/write your answer for 1a here/i)).toBeInTheDocument();
  });

  test("calls onAnswerChange with updated content when user types", async () => {
    const onAnswerChange = vi.fn();
    renderComponent({ onAnswerChange });

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "hello world" },
    });

    expect(onAnswerChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: "type", content: "hello world" }),
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

  test("textarea is readonly when submitted", () => {
    renderComponent({
      isSubmitted: true,
      answer: { ...baseAnswer, content: "my answer" },
    });
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
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

  test("bold button inserts ** markers", async () => {
    const onAnswerChange = vi.fn();
    renderComponent({ onAnswerChange, answer: { ...baseAnswer, content: "hello" } });

    await userEvent.click(screen.getByTitle("Bold"));

    expect(onAnswerChange).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining("**") }),
    );
  });

  test("italic button inserts * markers", async () => {
    const onAnswerChange = vi.fn();
    renderComponent({ onAnswerChange, answer: { ...baseAnswer, content: "hello" } });

    await userEvent.click(screen.getByTitle("Italic"));

    expect(onAnswerChange).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining("*") }),
    );
  });

  test("underline button inserts __ markers", async () => {
    const onAnswerChange = vi.fn();
    renderComponent({ onAnswerChange, answer: { ...baseAnswer, content: "hello" } });

    await userEvent.click(screen.getByTitle("Underline"));

    expect(onAnswerChange).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining("__") }),
    );
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

    expect(onAnswerChange).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.stringContaining("²") }),
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
// 6. POST-SUBMIT — PRACTICE MODE
// ════════════════════════════════════════════════════════════════

describe("post-submit: practice mode", () => {
  test("shows Score with AI button after submission when no aiResult", () => {
    renderComponent({ isSubmitted: true, mode: "practice" });
    expect(screen.getByRole("button", { name: /score with ai/i })).toBeInTheDocument();
  });

  test("calls onAIScore when the AI button is clicked", async () => {
    const onAIScore = vi.fn();
    renderComponent({ isSubmitted: true, mode: "practice", onAIScore });

    await userEvent.click(screen.getByRole("button", { name: /score with ai/i }));

    expect(onAIScore).toHaveBeenCalledTimes(1);
  });

  test("hides AI button and renders AIResultPanel when aiResult is provided", () => {
    renderComponent({
      isSubmitted: true,
      mode: "practice",
      aiResult: mockAIResult,
    });

    expect(screen.queryByRole("button", { name: /score with ai/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("ai-result-panel")).toBeInTheDocument();
  });

  test("passes feedback text to AIResultPanel", () => {
    renderComponent({
      isSubmitted: true,
      mode: "practice",
      aiResult: mockAIResult,
    });

    expect(screen.getByText("Good attempt.")).toBeInTheDocument();
  });

  test("calls onToggleSolution when AIResultPanel fires the toggle", async () => {
    const onToggleSolution = vi.fn();
    renderComponent({
      isSubmitted: true,
      mode: "practice",
      aiResult: mockAIResult,
      onToggleSolution,
    });

    await userEvent.click(screen.getByRole("button", { name: /toggle solution/i }));

    expect(onToggleSolution).toHaveBeenCalledTimes(1);
  });
});

// ════════════════════════════════════════════════════════════════
// 7. POST-SUBMIT — EXAM MODE
// ════════════════════════════════════════════════════════════════

describe("post-submit: exam mode", () => {
  test("shows model answer directly without AI button", () => {
    renderComponent({ isSubmitted: true, mode: "exam" });

    expect(screen.queryByRole("button", { name: /score with ai/i })).not.toBeInTheDocument();
    expect(screen.getByText("The answer is 42.")).toBeInTheDocument();
  });

  test("shows the Model Answer heading", () => {
    renderComponent({ isSubmitted: true, mode: "exam" });
    expect(screen.getByText(/model answer/i)).toBeInTheDocument();
  });

  test("does not show model answer block when subQuestion has no modelAnswer", () => {
    renderComponent({
      isSubmitted: true,
      mode: "exam",
      subQuestion: { ...mockSubQuestion, modelAnswer: undefined },
    });
    expect(screen.queryByText(/model answer/i)).not.toBeInTheDocument();
  });

  test("hides model answer and shows AIResultPanel when aiResult is provided", () => {
    renderComponent({
      isSubmitted: true,
      mode: "exam",
      aiResult: mockAIResult,
    });

    expect(screen.queryByText("The answer is 42.")).not.toBeInTheDocument();
    expect(screen.getByTestId("ai-result-panel")).toBeInTheDocument();
  });
});
