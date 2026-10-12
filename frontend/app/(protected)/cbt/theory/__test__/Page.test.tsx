import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach, describe, test, expect } from "vitest";
import { AIResult, Answer, ExamMode, SubQuestion } from "@/types/examsTypes";
import { Dispatch, SetStateAction } from "react";
import CBTEssayClientPage from "../components/TheoryClientPage";

// ── mocks ─────────────────────────────────

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "session-123" }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/mock/theoryQuestion", () => ({
  essayQuestions: [
    {
      id: 1,
      title: "Explain Newton's laws of motion.",
      imageUrl: undefined,
      subQuestions: [
        {
          id: "sq-1a",
          label: "1a",
          text: "State Newton's first law.",
          marks: 4,
          modelAnswer: "An object remains at rest...",
        },
        {
          id: "sq-1b",
          label: "1b",
          text: "State Newton's second law.",
          marks: 6,
          modelAnswer: "Force equals mass times acceleration.",
        },
      ],
    },
  ],
}));

vi.mock("@/utils/formartTimer", () => ({
  formatTime: (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`,
}));

// page.tsx: import Instructions from "./Instructions"
// from __test__/ that becomes "../Instructions"
vi.mock("../Instructions", () => ({
  default: ({ onStart }: { onStart: (m: "practice" | "exam") => void }) => (
    <div data-testid="instructions">
      <button onClick={() => onStart("practice")}>Start Practice</button>
      <button onClick={() => onStart("exam")}>Start Exam</button>
    </div>
  ),
}));

// from __test__/ that becomes "../SubQuestionAnswer"
vi.mock("../SubQuestionAnswer", () => ({
  default: ({
    subQuestion,
    onAnswerChange,
    answer,
    onAIScore,
    onToggleSolution,
    isSubmitted,
  }: {
    subQuestion: SubQuestion;
    answer: Answer;
    onAnswerChange: (a: Answer) => void;
    mode: ExamMode;
    isSubmitted: boolean;
    aiResult?: AIResult;
    onAIScore: () => void;
    onToggleSolution: () => void;
  }) => (
    <div data-testid={`sub-answer-${subQuestion.id}`}>
      <input
        title="subquestion answer"
        data-testid={`input-${subQuestion.id}`}
        value={answer.content}
        onChange={(e) => onAnswerChange({ ...answer, content: e.target.value })}
      />
      {!isSubmitted && (
        <button onClick={onAIScore} data-testid={`ai-score-${subQuestion.id}`}>
          Score with AI
        </button>
      )}
      <button onClick={onToggleSolution} data-testid={`toggle-${subQuestion.id}`}>
        Toggle solution
      </button>
    </div>
  ),
}));

// from __test__/ that becomes "../../../components/SubmitModel"
vi.mock("../../../components/SubmitModel", () => ({
  default: ({
    confirmSubmit,
    setShowSubmitModal,
  }: {
    setShowSubmitModal: Dispatch<SetStateAction<boolean>>;
    confirmSubmit: () => void;
  }) => (
    <div data-testid="submit-modal">
      <button onClick={confirmSubmit}>Confirm Submit</button>
      <button onClick={() => setShowSubmitModal(false)}>Cancel</button>
    </div>
  ),
}));

// from __test__/ that becomes "../../../components/TimeUpModal"
vi.mock("../../../components/TimeUpModal", () => ({
  default: ({ setShowTimeUpModal }: { setShowTimeUpModal: Dispatch<SetStateAction<boolean>> }) => (
    <div data-testid="time-up-modal">
      <button onClick={() => setShowTimeUpModal(false)}>Close</button>
    </div>
  ),
}));

// from __test__/ that becomes "../../../components/CalculatorModal"
vi.mock("../../../components/CalculatorModal", () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="calculator-modal">
      <button onClick={onClose}>Close Calculator</button>
    </div>
  ),
}));

// from __test__/ that becomes "../../../components/AiTotalScoreSummary"
vi.mock("../../../components/AiTotalScoreSummary", () => ({
  default: () => <div data-testid="ai-total-score-summary" />,
}));

// ── fetch mock ────────────────────────────

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({
    json: async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            score: 3,
            feedback: "Good work.",
            strengths: ["Clear"],
            improvements: ["More detail"],
          }),
        },
      ],
    }),
  });
});

// ── helpers ───────────────────────────────

async function startExam(mode: "practice" | "exam" = "practice") {
  render(<CBTEssayClientPage id="6590e632-b8d8-4573-9764-8dcc0341c774" />);
  await userEvent.click(
    screen.getByRole("button", {
      name: mode === "practice" ? /start practice/i : /start exam/i,
    }),
  );
}

// 1. INSTRUCTIONS SCREEN

describe("instructions screen", () => {
  test("shows Instructions component before exam starts", () => {
    render(<CBTEssayClientPage id="6590e632-b8d8-4573-9764-8dcc0341c774" />);
    expect(screen.getByTestId("instructions")).toBeInTheDocument();
  });

  test("does not show exam content before exam starts", () => {
    render(<CBTEssayClientPage id="6590e632-b8d8-4573-9764-8dcc0341c774" />);
    expect(screen.queryByRole("navigation", { name: /exam toolbar/i })).not.toBeInTheDocument();
  });
});

// 2. EXAM START

describe("exam start", () => {
  test("hides Instructions and shows exam after starting", async () => {
    await startExam();
    expect(screen.queryByTestId("instructions")).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /exam toolbar/i })).toBeInTheDocument();
  });

  test("shows PRACTICE badge when started in practice mode", async () => {
    await startExam("practice");
    expect(screen.getByText("PRACTICE")).toBeInTheDocument();
  });

  test("shows EXAM badge when started in exam mode", async () => {
    await startExam("exam");
    expect(screen.getByText("EXAM")).toBeInTheDocument();
  });

  test("renders questions from mock data", async () => {
    await startExam();
    expect(screen.getByText(/explain newton's laws/i)).toBeInTheDocument();
  });

  test("renders sub-question answer components", async () => {
    await startExam();
    expect(screen.getByTestId("sub-answer-sq-1a")).toBeInTheDocument();
    expect(screen.getByTestId("sub-answer-sq-1b")).toBeInTheDocument();
  });

  test("renders the timer", async () => {
    await startExam();
    expect(screen.getByLabelText(/time remaining/i)).toBeInTheDocument();
  });

  test("renders Exit link pointing to dashboard", async () => {
    await startExam();
    expect(screen.getByRole("link", { name: /exit/i })).toHaveAttribute("href", "/dashboard");
  });
});

// 3. CALCULATOR

describe("calculator", () => {
  test("calculator modal is hidden initially", async () => {
    await startExam();
    expect(screen.queryByTestId("calculator-modal")).not.toBeInTheDocument();
  });

  test("opens calculator when Calc button is clicked", async () => {
    await startExam();
    await userEvent.click(screen.getByRole("button", { name: /open calculator/i }));
    expect(screen.getByTestId("calculator-modal")).toBeInTheDocument();
  });

  test("closes calculator when Close is clicked", async () => {
    await startExam();
    await userEvent.click(screen.getByRole("button", { name: /open calculator/i }));
    await userEvent.click(screen.getByRole("button", { name: /close calculator/i }));
    expect(screen.queryByTestId("calculator-modal")).not.toBeInTheDocument();
  });
});

// 4. SUBMIT FLOW

describe("submit flow", () => {
  test("shows Submit button before submission", async () => {
    await startExam();
    expect(screen.getByRole("button", { name: /^submit$/i })).toBeInTheDocument();
  });

  test("opens submit modal when Submit is clicked", async () => {
    await startExam();
    await userEvent.click(screen.getByRole("button", { name: /^submit$/i }));
    expect(screen.getByTestId("submit-modal")).toBeInTheDocument();
  });

  test("closes submit modal when Cancel is clicked", async () => {
    await startExam();
    await userEvent.click(screen.getByRole("button", { name: /^submit$/i }));
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByTestId("submit-modal")).not.toBeInTheDocument();
  });

  test("confirms submission and shows Submitted state", async () => {
    await startExam();
    await userEvent.click(screen.getByRole("button", { name: /^submit$/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirm submit/i }));
    expect(screen.getByText(/submitted/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^submit$/i })).not.toBeInTheDocument();
  });

  test("hides submit modal after confirming", async () => {
    await startExam();
    await userEvent.click(screen.getByRole("button", { name: /^submit$/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirm submit/i }));
    expect(screen.queryByTestId("submit-modal")).not.toBeInTheDocument();
  });
});

// 5. ANSWER UPDATES

describe("answer updates", () => {
  test("updates answer content when sub-question input changes", async () => {
    await startExam();
    const input = screen.getByTestId("input-sq-1a");
    fireEvent.change(input, {
      target: { value: "An object stays at rest" },
    });
    expect(input).toHaveValue("An object stays at rest");
  });

  test("maintains separate answers for each sub-question", async () => {
    await startExam();
    fireEvent.change(screen.getByTestId("input-sq-1a"), {
      target: { value: "Answer A" },
    });
    fireEvent.change(screen.getByTestId("input-sq-1b"), {
      target: { value: "Answer B" },
    });
    expect(screen.getByTestId("input-sq-1a")).toHaveValue("Answer A");
    expect(screen.getByTestId("input-sq-1b")).toHaveValue("Answer B");
  });
});

// 6. AI SCORING

describe("AI scoring", () => {
  test("calls fetch when AI score button is clicked", async () => {
    await startExam();
    await userEvent.click(screen.getByTestId("ai-score-sq-1a"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
  });

  test("calls fetch with correct API endpoint", async () => {
    await startExam();
    await userEvent.click(screen.getByTestId("ai-score-sq-1a"));
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.anthropic.com/v1/messages",
        expect.any(Object),
      ),
    );
  });

  test("handles fetch failure gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    await startExam();
    await userEvent.click(screen.getByTestId("ai-score-sq-1a"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    // component should stay mounted — no crash
    expect(screen.getByTestId("sub-answer-sq-1a")).toBeInTheDocument();
  });
});

// 7. TOGGLE SOLUTION

describe("toggle solution", () => {
  test("toggle solution button is rendered per sub-question", async () => {
    await startExam();
    expect(screen.getByTestId("toggle-sq-1a")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-sq-1b")).toBeInTheDocument();
  });

  test("toggling solution for one sub-question does not affect others", async () => {
    await startExam();
    await userEvent.click(screen.getByTestId("ai-score-sq-1a"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await userEvent.click(screen.getByTestId("toggle-sq-1a"));
    // sq-1b toggle must remain independent and present
    expect(screen.getByTestId("toggle-sq-1b")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────
// 8. AI TOTAL SCORE SUMMARY
// ─────────────────────────────────────────

describe("AI total score summary", () => {
  test("does not show summary before submission", async () => {
    await startExam();
    expect(screen.queryByTestId("ai-total-score-summary")).not.toBeInTheDocument();
  });

  test("does not show summary in exam mode even after submit with AI results", async () => {
    await startExam("exam");
    await userEvent.click(screen.getByRole("button", { name: /^submit$/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirm submit/i }));
    expect(screen.queryByTestId("ai-total-score-summary")).not.toBeInTheDocument();
  });

  test("shows summary in practice mode after submit when AI results exist", async () => {
    await startExam("practice");
    await userEvent.click(screen.getByTestId("ai-score-sq-1a"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await userEvent.click(screen.getByRole("button", { name: /^submit$/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirm submit/i }));
    expect(screen.getByTestId("ai-total-score-summary")).toBeInTheDocument();
  });
});
