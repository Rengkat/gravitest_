import { render, screen, fireEvent } from "@testing-library/react";
import Options from "../components/Options";
import { describe, test, expect, vi, beforeEach } from "vitest";
import type { Question } from "@/lib/constants/mcq";

// The discussion has its own test suite; here we only verify WHERE and WHEN it is rendered.
vi.mock("@/Components/discussion/QuestionDiscussion", () => ({
  default: (p: { questionId?: string; partId?: string | null }) => (
    <div data-testid="discussion" data-question={p.questionId ?? ""} data-part={p.partId ?? ""} />
  ),
}));

const mockQuestion: Question = {
  id: 5,
  subjectId: "mathematics",
  text: "What is the probability of getting a head when a fair coin is tossed?",
  options: [{ label: "A", text: "0" }, { label: "B", text: "1/4" }, { label: "C", text: "1/2" }, { label: "D", text: "1" }],
  correctAnswer: "C",
  explanation: "A fair coin has 2 equally likely outcomes. Probability = 1/2.",
};

const defaultProps = {
  currentQuestion: mockQuestion,
  currentSelectedOption: null,
  handleSelectOption: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Options", () => {
  // ── Rendering ────────────────────────────────────────

  test("renders all four options", () => {
    render(<Options {...defaultProps} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("1/4")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  test("renders all four letter labels", () => {
    render(<Options {...defaultProps} />);
    expect(screen.getByText("A.")).toBeInTheDocument();
    expect(screen.getByText("B.")).toBeInTheDocument();
    expect(screen.getByText("C.")).toBeInTheDocument();
    expect(screen.getByText("D.")).toBeInTheDocument();
  });

  test("renders a radiogroup with correct aria-label", () => {
    render(<Options {...defaultProps} />);
    expect(screen.getByRole("radiogroup", { name: "Answer options" })).toBeInTheDocument();
  });

  // ── Selection state ──────────────────────────────────

  test("marks no option as checked when currentSelectedOption is null", () => {
    render(<Options {...defaultProps} />);
    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => expect(radio).not.toBeChecked());
  });

  test("marks the correct radio as checked when an option is selected", () => {
    render(<Options {...defaultProps} currentSelectedOption="B" />);
    const radios = screen.getAllByRole("radio");

    expect(radios[0]).not.toBeChecked(); // A
    expect(radios[1]).toBeChecked(); // B
    expect(radios[2]).not.toBeChecked(); // C
    expect(radios[3]).not.toBeChecked(); // D
  });

  // ── Callback ─────────────────────────────────────────

  test("calls handleSelectOption with correct letter when an option is clicked", () => {
    render(<Options {...defaultProps} />);
    fireEvent.click(screen.getAllByRole("radio")[0]);
    expect(defaultProps.handleSelectOption).toHaveBeenCalledWith("A");
  });

  test("calls handleSelectOption once per click", () => {
    render(<Options {...defaultProps} />);
    fireEvent.click(screen.getAllByRole("radio")[2]);
    expect(defaultProps.handleSelectOption).toHaveBeenCalledTimes(1);
  });

  test("calls handleSelectOption with correct letter for each option", () => {
    render(<Options {...defaultProps} />);
    const radios = screen.getAllByRole("radio");
    const letters = ["A", "B", "C", "D"];

    letters.forEach((letter, idx) => {
      fireEvent.click(radios[idx]);
      expect(defaultProps.handleSelectOption).toHaveBeenCalledWith(letter);
    });
  });
});

// ── Practice mode: Check Answer + feedback (new behaviour) ─────────────
vi.mock("@/lib/api/aiExplain", () => ({ explainMcqQuestion: vi.fn().mockResolvedValue({ explanation: "AI text" }) }));

describe("Options — practice mode", () => {
  const practice = { ...defaultProps, mode: "practice" as const, onCheckAnswer: vi.fn() };
  const q = { ...mockQuestion, sessionQuestionId: "sq-5", questionId: "q-5" };

  test("nothing is revealed before an attempt: no correct answer, no explanation", () => {
    render(<Options {...practice} currentQuestion={q} currentSelectedOption="A" />);
    expect(screen.queryByText(/correct answer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Probability = 1\/2/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /explain (more )?with sabi/i })).not.toBeInTheDocument();
  });

  test("Check Answer is disabled until an option is chosen, then calls onCheckAnswer", () => {
    const { rerender } = render(<Options {...practice} currentQuestion={q} currentSelectedOption={null} />);
    expect(screen.getByRole("button", { name: /check answer/i })).toBeDisabled();
    rerender(<Options {...practice} currentQuestion={q} currentSelectedOption="B" />);
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    expect(practice.onCheckAnswer).toHaveBeenCalledTimes(1);
  });

  test("wrong answer: reveals the correct answer, the stored explanation, and the Sabi button under it", () => {
    render(
      <Options
        {...practice}
        currentQuestion={q}
        currentSelectedOption="B"
        feedback={{ selectedLabel: "B", correctLabel: "C", isCorrect: false }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/correct answer is C/i);
    expect(screen.getByText(/Probability = 1\/2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /explain more with sabi/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /check answer/i })).not.toBeInTheDocument();
    screen.getAllByRole("radio").forEach((r) => expect(r).toBeDisabled()); // locked after checking
  });

  test("correct answer: confirmation + explanation", () => {
    render(
      <Options
        {...practice}
        currentQuestion={q}
        currentSelectedOption="C"
        feedback={{ selectedLabel: "C", correctLabel: "C", isCorrect: true }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/correct! well done/i);
    expect(screen.getByText(/Probability = 1\/2/)).toBeInTheDocument();
  });

  test("with no stored explanation the Sabi button reads Explain with Sabi", () => {
    render(
      <Options
        {...practice}
        currentQuestion={{ ...q, explanation: undefined }}
        currentSelectedOption="B"
        feedback={{ selectedLabel: "B", correctLabel: "C", isCorrect: false }}
      />,
    );
    expect(screen.getByText(/no explanation is stored/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^explain with sabi$/i })).toBeInTheDocument();
  });

  test("the discussion appears only after the reveal, below the explanation and the Sabi button, for THIS question", () => {
    const { rerender } = render(<Options {...practice} currentQuestion={q} currentSelectedOption="B" />);
    expect(screen.queryByTestId("discussion")).not.toBeInTheDocument(); // before checking: nothing

    rerender(
      <Options
        {...practice}
        currentQuestion={q}
        currentSelectedOption="B"
        feedback={{ selectedLabel: "B", correctLabel: "C", isCorrect: false }}
      />,
    );
    const discussion = screen.getByTestId("discussion");
    expect(discussion).toHaveAttribute("data-question", "q-5"); // the underlying question id, not a position
    const sabi = screen.getByRole("button", { name: /explain more with sabi/i });
    expect(sabi.compareDocumentPosition(discussion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("Exam mode never renders the discussion, even if feedback is passed by mistake", () => {
    render(
      <Options {...defaultProps} currentQuestion={q} mode="exam" currentSelectedOption="B"
        feedback={{ selectedLabel: "B", correctLabel: "C", isCorrect: false }} />,
    );
    expect(screen.queryByTestId("discussion")).not.toBeInTheDocument();
  });

  test("Exam mode never renders feedback or Check Answer, even if feedback is passed by mistake", () => {
    render(
      <Options
        {...defaultProps}
        currentQuestion={q}
        mode="exam"
        currentSelectedOption="B"
        feedback={{ selectedLabel: "B", correctLabel: "C", isCorrect: false }}
      />,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(/Probability = 1\/2/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /check answer/i })).not.toBeInTheDocument();
  });
});

// ── Equations and images inside options / explanations ──────────────────

describe("Options — equations and images", () => {
  const mathQuestion: Question = {
    ...mockQuestion,
    text: "Which is the simplest form?",
    options: [
      { label: "A", text: "(x + 1)/(x - 1)" },
      { label: "B", text: "\\(\\sqrt{b^2-4ac}\\)" },
      { label: "C", text: "x^2 + 1" },
      { label: "D", text: "2H_2 + O_2 → 2H_2O" },
    ],
  };

  test("maths inside answer options is typeset (fractions, roots, powers, chemical equations)", () => {
    const { container } = render(<Options {...defaultProps} currentQuestion={mathQuestion} />);
    expect(container.querySelector(".mfrac")).not.toBeNull(); // A
    expect(container.querySelector(".katex-mathml msqrt")).not.toBeNull(); // B
    expect(container.querySelectorAll(".katex").length).toBeGreaterThanOrEqual(4);
  });

  test("an option stays selectable and keeps its accessible text when it contains maths", () => {
    const select = vi.fn();
    render(<Options {...defaultProps} currentQuestion={mathQuestion} handleSelectOption={select} />);
    fireEvent.click(screen.getAllByRole("radio")[0]);
    expect(select).toHaveBeenCalledWith("A");
  });

  test("an option that is an image uses the shared image component (flush, contained, white paper)", () => {
    const q: Question = {
      ...mockQuestion,
      options: [{ label: "A", text: "", imageUrl: "https://pub.example.r2.dev/o/a.png" }, { label: "B", text: "plain" }],
    };
    render(<Options {...defaultProps} currentQuestion={q} />);
    const figure = screen.getByTestId("question-image");
    expect(figure.className).not.toMatch(/\bborder/);
    expect(screen.getByRole("img", { name: "Option A" }).className).toMatch(/object-contain/);
  });

  test("the stored explanation shown after checking is typeset too", () => {
    const q: Question = {
      ...mockQuestion,
      sessionQuestionId: "sq-5",
      questionId: "q-5",
      explanation: "Use a^2 + b^2 = c^2, so the ratio is (a + b)/(c + d).",
    };
    const { container } = render(
      <Options
        {...defaultProps}
        mode="practice"
        onCheckAnswer={vi.fn()}
        currentQuestion={q}
        currentSelectedOption="B"
        feedback={{ selectedLabel: "B", correctLabel: "C", isCorrect: false }}
      />,
    );
    expect(container.querySelector(".mfrac")).not.toBeNull();
    expect(container.querySelectorAll(".katex").length).toBeGreaterThanOrEqual(2);
    // The reveal still contains the explanation text and the discussion, in the right order.
    expect(screen.getByTestId("discussion")).toBeInTheDocument();
  });

  test("plain text-only options are unchanged", () => {
    render(<Options {...defaultProps} />);
    expect(screen.getByText("1/4")).toBeInTheDocument();
    expect(screen.queryByTestId("question-image")).toBeNull();
  });
});
