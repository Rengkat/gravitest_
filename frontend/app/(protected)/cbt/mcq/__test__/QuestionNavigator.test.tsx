import { render, screen, fireEvent } from "@testing-library/react";
import QuestionNavigator from "../components/QuestionNavigator";
import { describe, test, expect, vi, beforeEach } from "vitest";
import type { Answer } from "@/lib/constants/mcq";

const makeAnswers = (count: number, overrides: Partial<Answer>[] = []): Answer[] =>
  Array.from({ length: count }, (_, i) => ({
    selectedOption: null,
    isFlagged: false,
    isVisited: false,
    ...overrides[i],
  }));

const defaultProps = {
  totalQuestions: 5,
  currentIndex: 0,
  answers: makeAnswers(5),
  onNavigate: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("QuestionNavigator", () => {
  // ── Attempted count ──────────────────────────────────

  test("shows 0 attempted when no answers are selected", () => {
    render(<QuestionNavigator {...defaultProps} />);
    expect(screen.getByText("Attempted: 0 / 5")).toBeInTheDocument();
  });

  test("shows correct attempted count when some are answered", () => {
    const answers = makeAnswers(5, [{ selectedOption: "A" }, { selectedOption: "B" }]);
    render(<QuestionNavigator {...defaultProps} answers={answers} />);
    expect(screen.getByText("Attempted: 2 / 5")).toBeInTheDocument();
  });

  test("shows full attempted count when all are answered", () => {
    const answers = makeAnswers(5, [
      { selectedOption: "A" },
      { selectedOption: "B" },
      { selectedOption: "C" },
      { selectedOption: "D" },
      { selectedOption: "A" },
    ]);
    render(<QuestionNavigator {...defaultProps} answers={answers} />);
    expect(screen.getByText("Attempted: 5 / 5")).toBeInTheDocument();
  });

  // ── Navigation ───────────────────────────────────────

  test("calls onNavigate with correct index when a question button is clicked", () => {
    render(<QuestionNavigator {...defaultProps} />);
    fireEvent.click(screen.getByLabelText(/Question 3/));
    expect(defaultProps.onNavigate).toHaveBeenCalledWith(2);
  });

  test("calls onNavigate once per click", () => {
    render(<QuestionNavigator {...defaultProps} />);
    fireEvent.click(screen.getByLabelText(/Question 1/));
    expect(defaultProps.onNavigate).toHaveBeenCalledTimes(1);
  });

  // ── Aria labels ──────────────────────────────────────

  test("marks current question with aria-current", () => {
    render(<QuestionNavigator {...defaultProps} currentIndex={2} />);
    expect(screen.getByLabelText(/Question 3.*current/)).toHaveAttribute("aria-current", "true");
  });

  test("includes 'answered' in aria-label for answered questions", () => {
    const answers = makeAnswers(5, [{ selectedOption: "A" }]);
    render(<QuestionNavigator {...defaultProps} answers={answers} />);
    expect(screen.getByLabelText(/Question 1.*answered/)).toBeInTheDocument();
  });

  test("includes 'flagged' in aria-label for flagged questions", () => {
    const answers = makeAnswers(5, [{ isFlagged: true }]);
    render(<QuestionNavigator {...defaultProps} answers={answers} />);
    expect(screen.getByLabelText(/Question 1.*flagged/)).toBeInTheDocument();
  });

  // ── Legend ───────────────────────────────────────────

  test("renders all legend items", () => {
    render(<QuestionNavigator {...defaultProps} />);
    expect(screen.getByText("Answered")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Unanswered")).toBeInTheDocument();
    expect(screen.getByText("Flagged")).toBeInTheDocument();
  });
});
