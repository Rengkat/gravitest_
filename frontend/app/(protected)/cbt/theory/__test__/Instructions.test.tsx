import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import Instructions from "../components/Instructions";
import type { ExamSummary } from "@/lib/session/examSummary";

const base: ExamSummary = {
  categoryLabel: "Secondary School Exam",
  title: "WAEC SSCE CBT Examination",
  subjectsLabel: "Mathematics",
  questionCount: 6,
  durationMinutes: 120,
  mode: "exam",
  modeLabel: "Exam Mode",
  kind: "theory",
  kindLabel: "Theory",
  isTimed: true,
};

describe("Theory Instructions — driven by the real configuration", () => {
  test("Exam: shows the selected subject, type, question count and duration", () => {
    render(<Instructions onStart={vi.fn()} summary={base} />);
    expect(screen.getByText(/Mathematics \(Theory\) · 6 Questions · 2 Hours/)).toBeInTheDocument();
    expect(screen.getByText(/revealed only after you submit/i)).toBeInTheDocument();
  });

  test("Practical sessions are labelled Practical", () => {
    render(<Instructions onStart={vi.fn()} summary={{ ...base, kind: "practical", kindLabel: "Practical" }} />);
    expect(screen.getByText(/Mathematics \(Practical\)/)).toBeInTheDocument();
  });

  test("Practice: untimed, per-part Check Answer, no duration or auto-submit", () => {
    render(
      <Instructions
        onStart={vi.fn()}
        summary={{ ...base, mode: "practice", modeLabel: "Practice Mode", isTimed: false, durationMinutes: null }}
      />,
    );
    expect(screen.getByText(/6 Questions · Untimed/)).toBeInTheDocument();
    expect(screen.getByText(/under that part/i)).toBeInTheDocument();
    expect(screen.queryByText(/auto-submits/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hours/)).not.toBeInTheDocument();
  });

  test("the mode is fixed — there is no Practice/Exam chooser", () => {
    render(<Instructions onStart={vi.fn()} summary={base} />);
    expect(screen.queryByRole("button", { name: /^practice mode$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^exam mode$/i })).not.toBeInTheDocument();
  });

  test("Start calls onStart", () => {
    const onStart = vi.fn();
    render(<Instructions onStart={onStart} summary={base} />);
    fireEvent.click(screen.getByRole("button", { name: /start examination/i }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
