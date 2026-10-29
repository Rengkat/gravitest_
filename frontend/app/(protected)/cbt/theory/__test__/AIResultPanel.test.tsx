import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import AIResultPanel from "../components/AIResultPanel";
import type { AIResult } from "@/types/examsTypes";

const elaborate = vi.fn();
vi.mock("@/lib/api/aiScoring", () => ({ elaborateEssayScore: (...a: unknown[]) => elaborate(...a) }));

const result: AIResult = {
  id: "score-1",
  score: 3,
  maxScore: 4,
  feedback: "Good attempt.",
  strengths: ["Clear working"],
  improvements: ["Add units"],
  showSolution: false,
};

const renderPanel = (over: Partial<React.ComponentProps<typeof AIResultPanel>> = {}) =>
  render(<AIResultPanel result={result} onToggleSolution={vi.fn()} questionText="(a) Explain F=ma" {...over} />);

beforeEach(() => elaborate.mockReset());

describe("AIResultPanel", () => {
  test("shows the score, feedback, strengths and weaknesses/improvements", () => {
    renderPanel();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Good attempt.")).toBeInTheDocument();
    expect(screen.getByText("Clear working")).toBeInTheDocument();
    expect(screen.getByText("Add units")).toBeInTheDocument();
    expect(screen.getByText(/weaknesses & how to improve/i)).toBeInTheDocument();
  });

  test("always labels the grade as an automated estimate, never teacher-verified", () => {
    renderPanel();
    expect(screen.getByText(/automated estimate/i)).toBeInTheDocument();
  });

  test("flags low-confidence grades for review", () => {
    renderPanel({ result: { ...result, needsReview: true } });
    expect(screen.getByText(/flagged for review/i)).toBeInTheDocument();
  });

  test("shows the stored explanation when present", () => {
    renderPanel({ result: { ...result, explanation: "Because force equals mass times acceleration." } });
    expect(screen.getByText(/force equals mass times acceleration/i)).toBeInTheDocument();
  });

  test("no Sabi button when there is no score id", () => {
    renderPanel({ result: { ...result, id: undefined } });
    expect(screen.queryByRole("button", { name: /explain (more )?with sabi/i })).not.toBeInTheDocument();
  });

  test("Explain with Sabi opens a labelled dialog and requests ONE explanation bound to THIS score", async () => {
    elaborate.mockResolvedValue({ detailedFeedback: "## Simple\n\nStep **one**." });
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /explain (more )?with sabi/i }));
    const dialog = await screen.findByRole("dialog", { name: /sabi-ai explains/i });
    expect(dialog).toBeInTheDocument();
    await waitFor(() => expect(elaborate).toHaveBeenCalledWith("score-1"));
    // rendered as Markdown, not literal syntax
    expect(await screen.findByRole("heading", { name: "Simple" })).toBeInTheDocument();
    expect(screen.queryByText(/##/)).not.toBeInTheDocument();
  });

  test("a failed request shows an error with Try again, and retry works", async () => {
    elaborate.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce({ detailedFeedback: "Recovered." });
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /explain (more )?with sabi/i }));
    await userEvent.click(await screen.findByRole("button", { name: /try again/i }));
    expect(await screen.findByText("Recovered.")).toBeInTheDocument();
  });

  test("model answer toggle calls onToggleSolution and reflects expanded state", async () => {
    const onToggleSolution = vi.fn();
    renderPanel({ modelAnswer: "42", onToggleSolution, result: { ...result, showSolution: true } });
    expect(screen.getByText("42")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /hide model answer/i }));
    expect(onToggleSolution).toHaveBeenCalledTimes(1);
  });
});
