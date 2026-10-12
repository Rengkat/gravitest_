import { render, screen, fireEvent } from "@testing-library/react";
import SubmitModel from "../components/SubmitModel";
import { describe, test, expect, beforeEach, vi } from "vitest";

const defaultProps = {
  totalAnswered: 80,
  totalQuestions: 100,
  setShowSubmitModal: vi.fn(),
  confirmSubmit: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SubmitModel", () => {
  test("renders the correct answered count", () => {
    render(<SubmitModel {...defaultProps} />);
    expect(screen.getByText("You have answered 80 out of 100 questions.")).toBeInTheDocument();
  });

  test("shows plural unanswered warning", () => {
    render(<SubmitModel {...defaultProps} />);
    expect(screen.getByText(/You have 20 unanswered questions/)).toBeInTheDocument();
  });

  test("shows singular unanswered warning", () => {
    render(<SubmitModel {...defaultProps} totalAnswered={99} totalQuestions={100} />);
    expect(screen.getByText(/You have 1 unanswered question$/)).toBeInTheDocument();
  });

  test("hides warning when all questions are answered", () => {
    render(<SubmitModel {...defaultProps} totalAnswered={100} totalQuestions={100} />);
    expect(screen.queryByText(/unanswered/)).not.toBeInTheDocument();
  });

  test("calls setShowSubmitModal(false) when Cancel is clicked", () => {
    render(<SubmitModel {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.setShowSubmitModal).toHaveBeenCalledWith(false);
  });

  test("has correct dialog accessibility attributes", () => {
    render(<SubmitModel {...defaultProps} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "submit-title");
  });

  // ──TODO: Add these after API integration ─────────────────
  // test("disables buttons while submitting", () => { ... });
  // test("shows error message on failed submission", () => { ... });
  // test("shows loading spinner while submitting", () => { ... });
});
