import { fireEvent, render, screen } from "@testing-library/react";
import SubmitModel from "../SubmitModel";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Answer, AnswerType } from "@/types/examsTypes";

const makeAnswer = (overrides: Partial<Answer> & { subQuestionId: string }): Answer => ({
  type: "text" as AnswerType,
  content: "",
  ...overrides,
});

const isAnswered = (answer: Answer) => answer.content !== "";

const baseProps = {
  mode: "practice" as const,
  answers: [
    makeAnswer({ subQuestionId: "1", content: "answer 1" }),
    makeAnswer({ subQuestionId: "2", content: "" }),
    makeAnswer({ subQuestionId: "3", content: "answer 3" }),
  ],
  isAnswered,
  setShowSubmitModal: vi.fn(),
  confirmSubmit: vi.fn(),
};

describe("SubmitModel", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("answered count display", () => {
    test("shows correct answered and total count", () => {
      render(<SubmitModel {...baseProps} />);
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    test("shows full count when all questions are answered", () => {
      const allAnswered = {
        ...baseProps,
        answers: [
          makeAnswer({ subQuestionId: "1", content: "a" }),
          makeAnswer({ subQuestionId: "2", content: "b" }),
        ],
      };
      render(<SubmitModel {...allAnswered} />);
      // both answered and total should be 2
      const strongs = screen.getAllByText("2");
      expect(strongs).toHaveLength(2);
    });
  });

  describe("unanswered warning", () => {
    test("shows warning when some questions are unanswered", () => {
      render(<SubmitModel {...baseProps} />);
      expect(screen.getByText(/some sub-questions are unanswered/i)).toBeInTheDocument();
    });

    test("hides warning when all questions are answered", () => {
      const allAnswered = {
        ...baseProps,
        answers: [
          makeAnswer({ subQuestionId: "1", content: "a" }),
          makeAnswer({ subQuestionId: "2", content: "b" }),
        ],
      };
      render(<SubmitModel {...allAnswered} />);
      expect(screen.queryByText(/some sub-questions are unanswered/i)).not.toBeInTheDocument();
    });
  });

  describe("mode-specific content", () => {
    test("shows practice title in practice mode", () => {
      render(<SubmitModel {...baseProps} mode="practice" />);
      expect(screen.getByText(/submit practice/i)).toBeInTheDocument();
    });

    test("shows ai scoring message in practice mode", () => {
      render(<SubmitModel {...baseProps} mode="practice" />);
      expect(screen.getByText(/score any sub-question with ai/i)).toBeInTheDocument();
    });

    test("does not show model answers message in practice mode", () => {
      render(<SubmitModel {...baseProps} mode="practice" />);
      expect(screen.queryByText(/model answers will be revealed/i)).not.toBeInTheDocument();
    });

    test("shows exam title in exam mode", () => {
      render(<SubmitModel {...baseProps} mode="exam" />);
      expect(screen.getByText(/submit exam/i)).toBeInTheDocument();
    });

    test("shows model answers message in exam mode", () => {
      render(<SubmitModel {...baseProps} mode="exam" />);
      expect(screen.getByText(/model answers will be revealed/i)).toBeInTheDocument();
    });

    test("does not show ai scoring message in exam mode", () => {
      render(<SubmitModel {...baseProps} mode="exam" />);
      expect(screen.queryByText(/score any sub-question with ai/i)).not.toBeInTheDocument();
    });
  });

  describe("button interactions", () => {
    test("calls setShowSubmitModal with false when cancel is clicked", () => {
      render(<SubmitModel {...baseProps} />);
      fireEvent.click(screen.getByText(/cancel/i));
      expect(baseProps.setShowSubmitModal).toHaveBeenCalledWith(false);
      expect(baseProps.setShowSubmitModal).toHaveBeenCalledTimes(1);
    });

    test("calls confirmSubmit when submit now is clicked", () => {
      render(<SubmitModel {...baseProps} />);
      fireEvent.click(screen.getByText(/submit now/i));
      expect(baseProps.confirmSubmit).toHaveBeenCalledTimes(1);
    });

    test("does not call confirmSubmit when cancel is clicked", () => {
      render(<SubmitModel {...baseProps} />);
      fireEvent.click(screen.getByText(/cancel/i));
      expect(baseProps.confirmSubmit).not.toHaveBeenCalled();
    });

    test("does not call setShowSubmitModal when submit now is clicked", () => {
      render(<SubmitModel {...baseProps} />);
      fireEvent.click(screen.getByText(/submit now/i));
      expect(baseProps.setShowSubmitModal).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    test("renders with dialog role", () => {
      render(<SubmitModel {...baseProps} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    test("has aria-modal set to true", () => {
      render(<SubmitModel {...baseProps} />);
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    });

    test("cancel button is focusable", () => {
      render(<SubmitModel {...baseProps} />);
      expect(screen.getByText(/cancel/i).tagName).toBe("BUTTON");
    });

    test("submit now button is focusable", () => {
      render(<SubmitModel {...baseProps} />);
      expect(screen.getByText(/submit now/i).tagName).toBe("BUTTON");
    });
  });
});
