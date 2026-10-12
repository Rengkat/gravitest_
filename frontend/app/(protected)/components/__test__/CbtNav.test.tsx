import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import CbtNav from "../CbtNav";

// Same pattern you used!
const baseProps = {
  setShowCalculator: vi.fn(),
  handleFlagQuestion: vi.fn(),
  isCurrentFlagged: false,
  isLowTime: false,
  timeRemaining: 3600, // 1 hour
};

describe("CbtNav", () => {
  describe("timer display", () => {
    test("shows formatted time", () => {
      render(<CbtNav {...baseProps} timeRemaining={10} />);
      expect(screen.getByText("00:00:10")).toBeInTheDocument();
    });

    test("applies low time styling when isLowTime is true", () => {
      render(<CbtNav {...baseProps} isLowTime={true} />);
      const timer = document.querySelector('[aria-label*="Time remaining"]');
      expect(timer).toHaveClass("bg-red-500");
    });

    test("has polite aria-live for screen readers", () => {
      render(<CbtNav {...baseProps} />);
      expect(screen.getByLabelText(/time remaining/i)).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("flag button", () => {
    test("shows flagged styling when isCurrentFlagged is true", () => {
      render(<CbtNav {...baseProps} isCurrentFlagged={true} />);
      const flagButton = screen.getByRole("button", { name: /flag/i });
      expect(flagButton).toHaveClass("bg-yellow-500/20");
    });

    test("calls handleFlagQuestion when clicked", () => {
      render(<CbtNav {...baseProps} />);
      fireEvent.click(screen.getByRole("button", { name: /flag/i }));
      expect(baseProps.handleFlagQuestion).toHaveBeenCalledTimes(1);
    });
  });

  describe("calculator button", () => {
    test("opens calculator when clicked", () => {
      render(<CbtNav {...baseProps} />);
      fireEvent.click(screen.getByRole("button", { name: /open calculator/i }));
      expect(baseProps.setShowCalculator).toHaveBeenCalledWith(true);
    });
  });
});
