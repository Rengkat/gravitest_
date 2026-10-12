import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach, describe, test, expect } from "vitest";
import Instructions from "../components/Instructions";

const defaultProps = {
  onStart: vi.fn(),
  mode: undefined,
};

beforeEach(() => vi.clearAllMocks());

function renderInstructions(overrides = {}) {
  return render(<Instructions {...defaultProps} {...overrides} />);
}

// 1. RENDERING

describe("rendering", () => {
  test("renders the exam title", () => {
    renderInstructions();
    expect(screen.getByText(/jamb utme cbt examination/i)).toBeInTheDocument();
  });

  test("renders the subtitle with subject and duration", () => {
    renderInstructions();
    expect(screen.getByText(/physics.*2 questions.*2 hours/i)).toBeInTheDocument();
  });

  test("renders Practice Mode and Exam Mode buttons", () => {
    renderInstructions();
    expect(screen.getByRole("button", { name: /practice mode/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /exam mode/i })).toBeInTheDocument();
  });

  test("renders the Instructions heading", () => {
    renderInstructions();
    expect(screen.getByRole("heading", { name: /instructions/i })).toBeInTheDocument();
  });

  test("renders all 5 instruction items", () => {
    renderInstructions();
    expect(screen.getByText(/answer all questions/i)).toBeInTheDocument();
    expect(screen.getByText(/auto-saved/i)).toBeInTheDocument();
    expect(screen.getByText(/auto-submits/i)).toBeInTheDocument();
  });

  test("renders the start button", () => {
    renderInstructions();
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });
});

// 2. DEFAULT MODE

describe("default mode", () => {
  test("defaults to practice mode when no mode prop is provided", () => {
    renderInstructions();
    expect(screen.getByRole("button", { name: /practice mode/i })).toHaveClass("border-green-800");
  });

  test("defaults to the provided mode prop when given", () => {
    renderInstructions({ mode: "exam" });
    expect(screen.getByRole("button", { name: /exam mode/i })).toHaveClass("border-green-800");
  });

  test("start button says 'Start Practice' in practice mode by default", () => {
    renderInstructions();
    expect(screen.getByRole("button", { name: /start practice/i })).toBeInTheDocument();
  });

  test("start button says 'Start Examination' when mode prop is exam", () => {
    renderInstructions({ mode: "exam" });
    expect(screen.getByRole("button", { name: /start examination/i })).toBeInTheDocument();
  });
});

// 3. MODE SELECTION

describe("mode selection", () => {
  test("clicking Exam Mode activates it", async () => {
    renderInstructions();
    await userEvent.click(screen.getByRole("button", { name: /exam mode/i }));
    expect(screen.getByRole("button", { name: /exam mode/i })).toHaveClass("border-green-800");
  });

  test("clicking Exam Mode deactivates Practice Mode", async () => {
    renderInstructions();
    await userEvent.click(screen.getByRole("button", { name: /exam mode/i }));
    expect(screen.getByRole("button", { name: /practice mode/i })).not.toHaveClass(
      "border-green-800",
    );
  });

  test("clicking Practice Mode activates it when exam was selected", async () => {
    renderInstructions({ mode: "exam" });
    await userEvent.click(screen.getByRole("button", { name: /practice mode/i }));
    expect(screen.getByRole("button", { name: /practice mode/i })).toHaveClass("border-green-800");
  });

  test("start button updates to 'Start Examination' after selecting exam mode", async () => {
    renderInstructions();
    await userEvent.click(screen.getByRole("button", { name: /exam mode/i }));
    expect(screen.getByRole("button", { name: /start examination/i })).toBeInTheDocument();
  });

  test("start button updates to 'Start Practice' after switching back to practice", async () => {
    renderInstructions({ mode: "exam" });
    await userEvent.click(screen.getByRole("button", { name: /practice mode/i }));
    expect(screen.getByRole("button", { name: /start practice/i })).toBeInTheDocument();
  });
});

// 4. CONDITIONAL INSTRUCTION TEXT

describe("conditional instruction text", () => {
  test("shows practice mode instruction when practice is selected", () => {
    renderInstructions();
    expect(screen.getByText(/score with ai/i)).toBeInTheDocument();
  });

  test("does not show exam mode instruction when practice is selected", () => {
    renderInstructions();
    expect(
      screen.queryByText(/model answers are revealed after you submit/i),
    ).not.toBeInTheDocument();
  });

  test("shows exam mode instruction when exam is selected", async () => {
    renderInstructions();
    await userEvent.click(screen.getByRole("button", { name: /exam mode/i }));
    expect(screen.getByText(/model answers are revealed after you submit/i)).toBeInTheDocument();
  });

  test("hides practice mode instruction when exam is selected", async () => {
    renderInstructions();
    await userEvent.click(screen.getByRole("button", { name: /exam mode/i }));
    expect(screen.queryByText(/score with ai/i)).not.toBeInTheDocument();
  });
});

// 5. START BUTTON

describe("start button", () => {
  test("calls onStart with 'practice' when in practice mode", async () => {
    const onStart = vi.fn();
    renderInstructions({ onStart });

    await userEvent.click(screen.getByRole("button", { name: /start practice/i }));

    expect(onStart).toHaveBeenCalledWith("practice");
  });

  test("calls onStart with 'exam' when in exam mode", async () => {
    const onStart = vi.fn();
    renderInstructions({ onStart });

    await userEvent.click(screen.getByRole("button", { name: /exam mode/i }));
    await userEvent.click(screen.getByRole("button", { name: /start examination/i }));

    expect(onStart).toHaveBeenCalledWith("exam");
  });

  test("calls onStart exactly once per click", async () => {
    const onStart = vi.fn();
    renderInstructions({ onStart });

    await userEvent.click(screen.getByRole("button", { name: /start practice/i }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
