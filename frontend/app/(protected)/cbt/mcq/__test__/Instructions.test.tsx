import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import InstructionsPage from "../components/Instructions";
import type { ExamSummary } from "@/lib/session/examSummary";

const examSummary: ExamSummary = {
  categoryLabel: "Secondary School Exam",
  title: "JAMB UTME CBT Examination",
  subjectsLabel: "Physics, Chemistry",
  questionCount: 60,
  durationMinutes: 90,
  mode: "exam",
  modeLabel: "Exam Mode",
  kind: "mcq",
  kindLabel: "Multiple choice (MCQ)",
  isTimed: true,
};
const practiceSummary: ExamSummary = {
  ...examSummary,
  questionCount: 12,
  durationMinutes: null,
  mode: "practice",
  modeLabel: "Practice Mode",
  isTimed: false,
};

describe("MCQ Instructions — driven by the real configuration", () => {
  test("Exam shows the actual subject, question count and duration", () => {
    render(<InstructionsPage onStart={vi.fn()} summary={examSummary} />);
    expect(screen.getByText(/Physics, Chemistry · 60 Questions · 1 Hour 30 Mins/)).toBeInTheDocument();
    expect(screen.getByText("Exam Mode", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/revealed only after you submit/i)).toBeInTheDocument();
    expect(screen.getByText(/auto-submits when the timer reaches zero/i)).toBeInTheDocument();
  });

  test("never shows the old hardcoded values", () => {
    render(<InstructionsPage onStart={vi.fn()} summary={examSummary} />);
    expect(screen.queryByText(/100 multiple-choice/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/2 hours/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Physics · 100 Questions · 2 Hours/)).not.toBeInTheDocument();
  });

  test("Practice says it is untimed, has immediate feedback, and has no auto-submit warning", () => {
    render(<InstructionsPage onStart={vi.fn()} summary={practiceSummary} />);
    expect(screen.getByText(/12 Questions · Untimed/)).toBeInTheDocument();
    expect(screen.getAllByText(/untimed/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/immediate feedback/i)).toBeInTheDocument();
    expect(screen.queryByText(/auto-submits/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start practice/i })).toBeInTheDocument();
  });

  test("Start calls onStart", () => {
    const onStart = vi.fn();
    render(<InstructionsPage onStart={onStart} summary={examSummary} />);
    fireEvent.click(screen.getByRole("button", { name: /start examination/i }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
