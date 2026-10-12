import { render, screen, fireEvent } from "@testing-library/react";
import Options from "../components/Options";
import { describe, test, expect, vi, beforeEach } from "vitest";
import type { Question } from "@/lib/constants/mcq";

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
