import { render, screen, fireEvent } from "@testing-library/react";
import LeftQuestion from "../components/LeftQuestion";
import { describe, test, expect, vi, beforeEach } from "vitest";
import type { Question } from "@/lib/constants/mcq";

const mockQuestion: Question = {
  id: 4,
  subjectId: "mathematics",
  text: "Calculate the area of a circle with radius 7 cm. (π = 22/7)",
  options: [{ label: "A", text: "154 cm²" }, { label: "B", text: "44 cm²" }, { label: "C", text: "88 cm²" }, { label: "D", text: "308 cm²" }],
  correctAnswer: "A",
  explanation: "Area = πr² = (22/7) × 49 = 154 cm².",
};

const mockQuestionWithDiagram: Question = {
  id: 1,
  subjectId: "physics",
  text: "A body of mass 5 kg is acted upon by a constant force of 20 N for 4 seconds. Calculate the change in momentum of the body.",
  options: [{ label: "A", text: "20 kgm/s" }, { label: "B", text: "40 kgm/s" }, { label: "C", text: "60 kgm/s" }, { label: "D", text: "80 kgm/s" }],
  correctAnswer: "D",
  hasDiagram: true,
  explanation:
    "Change in momentum = Force × Time = 20 N × 4 s = 80 kgm/s. Derived from Newton's second law: F = Δp/Δt.",

  diagramSvg: "<svg><circle cx='50' cy='50' r='40'/></svg>",
};

const defaultProps = {
  currentQuestionIndex: 1,
  totalQuestions: 5,
  currentQuestion: mockQuestionWithDiagram,
  currentSelectedOption: null,
  isSpeaking: false,
  handleNext: vi.fn(),
  handlePrevious: vi.fn(),
  handleSelectOption: vi.fn(),
  handleReadAloud: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LeftQuestion", () => {
  // ── Question counter ─────────────────────────────────

  test("renders the correct question counter", () => {
    render(<LeftQuestion {...defaultProps} currentQuestionIndex={2} totalQuestions={10} />);
    expect(screen.getByText("3/10")).toBeInTheDocument();
  });

  test("has correct region aria-label", () => {
    render(<LeftQuestion {...defaultProps} currentQuestionIndex={0} totalQuestions={5} />);
    expect(screen.getByRole("region", { name: "Question 1 of 5" })).toBeInTheDocument();
  });

  // ── Navigation buttons ───────────────────────────────

  test("disables Previous button on first question", () => {
    render(<LeftQuestion {...defaultProps} currentQuestionIndex={0} />);
    expect(screen.getByLabelText("Go to previous question")).toBeDisabled();
  });

  test("enables Previous button when not on first question", () => {
    render(<LeftQuestion {...defaultProps} currentQuestionIndex={1} />);
    expect(screen.getByLabelText("Go to previous question")).not.toBeDisabled();
  });

  test("disables Next button on last question", () => {
    render(<LeftQuestion {...defaultProps} currentQuestionIndex={4} totalQuestions={5} />);
    expect(screen.getByLabelText("Go to next question")).toBeDisabled();
  });

  test("enables Next button when not on last question", () => {
    render(<LeftQuestion {...defaultProps} currentQuestionIndex={3} totalQuestions={5} />);
    expect(screen.getByLabelText("Go to next question")).not.toBeDisabled();
  });

  test("calls handleNext when Next is clicked", () => {
    render(<LeftQuestion {...defaultProps} currentQuestionIndex={1} />);
    fireEvent.click(screen.getByLabelText("Go to next question"));
    expect(defaultProps.handleNext).toHaveBeenCalledTimes(1);
  });

  test("calls handlePrevious when Previous is clicked", () => {
    render(<LeftQuestion {...defaultProps} currentQuestionIndex={1} />);
    fireEvent.click(screen.getByLabelText("Go to previous question"));
    expect(defaultProps.handlePrevious).toHaveBeenCalledTimes(1);
  });

  // ── Read aloud button ────────────────────────────────

  test("shows 'Read Aloud' label when not speaking", () => {
    render(<LeftQuestion {...defaultProps} isSpeaking={false} />);
    expect(screen.getByLabelText("Read question aloud")).toBeInTheDocument();
    expect(screen.getByText("Read Aloud")).toBeInTheDocument();
  });

  test("shows 'Stop' label when speaking", () => {
    render(<LeftQuestion {...defaultProps} isSpeaking={true} />);
    expect(screen.getByLabelText("Stop reading aloud")).toBeInTheDocument();
    expect(screen.getByText("Stop")).toBeInTheDocument();
  });

  test("calls handleReadAloud when read aloud button is clicked", () => {
    render(<LeftQuestion {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Read question aloud"));
    expect(defaultProps.handleReadAloud).toHaveBeenCalledTimes(1);
  });

  // ── Diagram ──────────────────────────────────────────
  test("does not render diagram when hasDiagram is false", () => {
    render(<LeftQuestion {...defaultProps} currentQuestion={mockQuestion} />);
    expect(screen.queryByTestId("diagram-container")).not.toBeInTheDocument();
  });

  test("renders diagram when hasDiagram is true and diagramSvg is present", () => {
    render(<LeftQuestion {...defaultProps} currentQuestion={mockQuestionWithDiagram} />);
    expect(screen.getByTestId("diagram-container")).toBeInTheDocument();
  });
});
