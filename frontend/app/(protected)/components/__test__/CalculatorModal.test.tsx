import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import CalculatorModal from "../CalculatorModal";

describe("CalculatorModal", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { value: 1024 });
    Object.defineProperty(window, "innerHeight", { value: 768 });
  });

  describe("basic arithmetic", () => {
    test("adds two numbers", () => {
      const { container } = render(<CalculatorModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByText("2"));
      fireEvent.click(screen.getByText("+"));
      fireEvent.click(screen.getByText("3"));
      fireEvent.click(screen.getByText("="));
      const display = container.querySelector('[aria-live="polite"]');
      expect(display).toHaveTextContent("5");
    });

    test("handles decimal numbers", () => {
      const { container } = render(<CalculatorModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByText("1"));
      fireEvent.click(screen.getByText("."));
      fireEvent.click(screen.getByText("5"));
      fireEvent.click(screen.getByText("×"));
      fireEvent.click(screen.getByText("2"));
      fireEvent.click(screen.getByText("="));
      const display = container.querySelector('[aria-live="polite"]');
      expect(display).toHaveTextContent("3");
    });
  });

  describe("scientific functions", () => {
    test("calculates square root", () => {
      const { container } = render(<CalculatorModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByText("9"));
      fireEvent.click(screen.getByText("√x"));
      const display = container.querySelector('[aria-live="polite"]');
      expect(display).toHaveTextContent("3");
    });

    test("calculates sine in DEG mode", () => {
      const { container } = render(<CalculatorModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByText("9"));
      fireEvent.click(screen.getByText("0"));
      fireEvent.click(screen.getByText("sin"));
      const display = container.querySelector('[aria-live="polite"]');
      expect(display).toHaveTextContent("1");
    });
  });

  describe("memory operations", () => {
    test("stores value in memory", () => {
      const { container } = render(<CalculatorModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByText("4"));
      fireEvent.click(screen.getByText("2"));
      fireEvent.click(screen.getByText("M+"));
      fireEvent.click(screen.getByText("AC"));
      fireEvent.click(screen.getByText("MR"));
      const display = container.querySelector('[aria-live="polite"]');
      expect(display).toHaveTextContent("42");
    });
  });

  describe("error handling", () => {
    test("shows error on division by zero", () => {
      const { container } = render(<CalculatorModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByText("1"));
      fireEvent.click(screen.getByText("÷"));
      fireEvent.click(screen.getByLabelText("0"));
      fireEvent.click(screen.getByText("="));
      const display = container.querySelector('[aria-live="polite"]');
      expect(display).toHaveTextContent("Error");
    });
  });

  describe("clear functions", () => {
    test("AC clears everything", () => {
      const { container } = render(<CalculatorModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByText("5"));
      fireEvent.click(screen.getByText("+"));
      fireEvent.click(screen.getByText("3"));
      fireEvent.click(screen.getByText("AC"));
      const display = container.querySelector('[aria-live="polite"]');
      expect(display).toHaveTextContent("0");
    });

    test("CE clears last digit", () => {
      const { container } = render(<CalculatorModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByText("1"));
      fireEvent.click(screen.getByText("2"));
      fireEvent.click(screen.getByText("3"));
      fireEvent.click(screen.getByText("CE"));
      const display = container.querySelector('[aria-live="polite"]');
      expect(display).toHaveTextContent("12");
    });
  });

  describe("shift mode", () => {
    test("toggles between sin and sin⁻¹", () => {
      render(<CalculatorModal onClose={vi.fn()} />);
      expect(screen.getByText("sin")).toBeInTheDocument();
      fireEvent.click(screen.getByText("SHIFT"));
      expect(screen.getByText("sin⁻¹")).toBeInTheDocument();
    });
  });
});
