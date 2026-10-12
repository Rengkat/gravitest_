import { render, screen } from "@testing-library/react";
import QuestionText from "../components/QuestionText";
import { describe, test, expect } from "vitest";
import type { Question } from "@/lib/constants/mcq";

const mockQuestion: Question = {
  id: 1,
  subjectId: "physics",
  text: "A body of mass 5 kg is acted upon by a constant force of 20 N for 4 seconds. Calculate the change in momentum of the body.",
  options: [{ label: "A", text: "20 kgm/s" }, { label: "B", text: "40 kgm/s" }, { label: "C", text: "60 kgm/s" }, { label: "D", text: "80 kgm/s" }],
  correctAnswer: "D",
  explanation:
    "Change in momentum = Force × Time = 20 N × 4 s = 80 kgm/s. Derived from Newton's second law: F = Δp/Δt.",
};

describe("QuestionText", () => {
  test("renders the question text", () => {
    render(<QuestionText currentQuestion={mockQuestion} />);
    expect(
      screen.getByText(
        "A body of mass 5 kg is acted upon by a constant force of 20 N for 4 seconds. Calculate the change in momentum of the body.",
      ),
    ).toBeInTheDocument();
  });

  test("renders keyboard navigation tip", () => {
    render(<QuestionText currentQuestion={mockQuestion} />);
    expect(screen.getByText(/press/i)).toBeInTheDocument();
    expect(screen.getByText(/to navigate/i)).toBeInTheDocument();
  });
});
