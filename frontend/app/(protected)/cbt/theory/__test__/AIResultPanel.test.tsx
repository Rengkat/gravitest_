import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach, describe, test, expect } from "vitest";
import AIResultPanel from "../components/AIResultPanel";
import { AIResult } from "@/types/examsTypes";

// ── fixtures ─────────────────────────────────────────────────────

const baseResult: AIResult = {
  score: 3,
  maxScore: 4,
  feedback: "Good attempt overall.",
  strengths: ["Clear explanation", "Good structure"],
  improvements: ["Add units", "More detail needed"],
  showSolution: false,
};

const defaultProps = {
  result: baseResult,
  modelAnswer: "The answer is 42.",
  onToggleSolution: vi.fn(),
  onElaborated: vi.fn(),
  mode: "practice" as const,
};

beforeEach(() => vi.clearAllMocks());

function renderPanel(overrides: Record<string, unknown> = {}) {
  return render(<AIResultPanel {...defaultProps} {...overrides} />);
}

// 1. SCORE DISPLAY

describe("score display", () => {
  test("renders the score and maxScore", () => {
    renderPanel();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("/4")).toBeInTheDocument();
  });

  test("renders the AI Assessment heading", () => {
    renderPanel();
    expect(screen.getByText("AI Assessment")).toBeInTheDocument();
  });

  test("renders the feedback text", () => {
    renderPanel();
    expect(screen.getByText("Good attempt overall.")).toBeInTheDocument();
  });
});

// 2. PROGRESS BAR COLOR THRESHOLDS

describe("progress bar color", () => {
  test("uses green bar for score >= 70%", () => {
    renderPanel({ result: { ...baseResult, score: 7, maxScore: 10 } }); // 70%
    const bar = document.querySelector(".bg-green-600");
    expect(bar).toBeInTheDocument();
  });

  test("uses yellow bar for score between 50% and 69%", () => {
    renderPanel({ result: { ...baseResult, score: 5, maxScore: 10 } }); // 50%
    const bar = document.querySelector(".bg-yellow-500");
    expect(bar).toBeInTheDocument();
  });

  test("uses red bar for score below 50%", () => {
    renderPanel({ result: { ...baseResult, score: 3, maxScore: 10 } }); // 30%
    const bar = document.querySelector(".bg-red-500");
    expect(bar).toBeInTheDocument();
  });

  test("sets bar width to correct percentage", () => {
    renderPanel({ result: { ...baseResult, score: 3, maxScore: 4 } }); // 75%
    const bar = document.querySelector("[style*='width']") as HTMLElement;
    expect(bar.style.width).toBe("75%");
  });
});

// 3. STRENGTHS

describe("strengths", () => {
  test("renders all strength items", () => {
    renderPanel();
    expect(screen.getByText("Clear explanation")).toBeInTheDocument();
    expect(screen.getByText("Good structure")).toBeInTheDocument();
  });

  test("renders the Strengths heading", () => {
    renderPanel();
    expect(screen.getByText("Strengths")).toBeInTheDocument();
  });

  test("hides strengths section when array is empty", () => {
    renderPanel({ result: { ...baseResult, strengths: [] } });
    expect(screen.queryByText("Strengths")).not.toBeInTheDocument();
  });
});

// 4. IMPROVEMENTS

describe("improvements", () => {
  test("renders all improvement items", () => {
    renderPanel();
    expect(screen.getByText("Add units")).toBeInTheDocument();
    expect(screen.getByText("More detail needed")).toBeInTheDocument();
  });

  test("renders the Areas to Improve heading", () => {
    renderPanel();
    expect(screen.getByText("Areas to Improve")).toBeInTheDocument();
  });

  test("hides improvements section when array is empty", () => {
    renderPanel({ result: { ...baseResult, improvements: [] } });
    expect(screen.queryByText("Areas to Improve")).not.toBeInTheDocument();
  });
});

// 5. MODEL ANSWER TOGGLE

describe("model answer toggle", () => {
  test("shows 'Show Model Answer' button when showSolution is false", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: /show model answer/i })).toBeInTheDocument();
  });

  test("shows 'Hide Model Answer' button when showSolution is true", () => {
    renderPanel({ result: { ...baseResult, showSolution: true } });
    expect(screen.getByRole("button", { name: /hide model answer/i })).toBeInTheDocument();
  });

  test("calls onToggleSolution when the toggle button is clicked", async () => {
    const onToggleSolution = vi.fn();
    renderPanel({ onToggleSolution });

    await userEvent.click(screen.getByRole("button", { name: /show model answer/i }));

    expect(onToggleSolution).toHaveBeenCalledTimes(1);
  });

  test("does not show the model answer text when showSolution is false", () => {
    renderPanel();
    expect(screen.queryByText("The answer is 42.")).not.toBeInTheDocument();
  });

  test("shows the model answer text when showSolution is true", () => {
    renderPanel({ result: { ...baseResult, showSolution: true } });
    expect(screen.getByText("The answer is 42.")).toBeInTheDocument();
  });

  test("shows the Model Answer / Mark Scheme heading when solution is visible", () => {
    renderPanel({ result: { ...baseResult, showSolution: true } });
    expect(screen.getByText(/model answer \/ mark scheme/i)).toBeInTheDocument();
  });

  test("hides the toggle button entirely when no modelAnswer is provided", () => {
    renderPanel({ modelAnswer: undefined });
    expect(screen.queryByRole("button", { name: /show model answer/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /hide model answer/i })).not.toBeInTheDocument();
  });
});
