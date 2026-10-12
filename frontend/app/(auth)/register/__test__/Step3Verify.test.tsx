import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import Step3Verify from "../Step3Verify";

describe("Step3Verify", () => {
  const mockOnVerified = vi.fn();
  const baseProps = {
    email: "alex@gmail.com",
    onVerified: mockOnVerified,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("renders correctly with email prop", () => {
    render(<Step3Verify {...baseProps} />);

    expect(screen.getByText("Check your inbox")).toBeInTheDocument();
    expect(screen.getByText(/We sent a 6-digit verification code/)).toBeInTheDocument();
    expect(screen.getByText("alex@gmail.com")).toBeInTheDocument();

    const otpInputs = screen.getAllByTitle("code");
    expect(otpInputs).toHaveLength(6);

    const verifyButton = screen.getByRole("button", { name: /verify & continue/i });
    expect(verifyButton).toBeDisabled();

    expect(screen.getByText("Resend code")).toBeInTheDocument();
    expect(screen.getByText("Send OTP to your phone via SMS instead")).toBeInTheDocument();
  });

  test("renders fallback text when email is empty", () => {
    render(<Step3Verify email="" onVerified={mockOnVerified} />);
    expect(screen.getByText("your email address")).toBeInTheDocument();
  });

  // OTP Input Behaviour

  describe("OTP Input Behavior", () => {
    test("allows numeric input only", () => {
      render(<Step3Verify {...baseProps} />);
      const otpInputs = screen.getAllByTitle("code");
      const firstInput = otpInputs[0];

      fireEvent.change(firstInput, { target: { value: "5" } });
      expect(firstInput).toHaveValue("5");

      fireEvent.change(firstInput, { target: { value: "a" } });
      expect(firstInput).toHaveValue("");
    });

    test("auto-advances to next input when digit is entered", () => {
      render(<Step3Verify {...baseProps} />);
      const otpInputs = screen.getAllByTitle("code");

      fireEvent.change(otpInputs[0], { target: { value: "1" } });
      expect(otpInputs[0]).toHaveValue("1");
      expect(document.activeElement).toBe(otpInputs[1]);

      fireEvent.change(otpInputs[1], { target: { value: "2" } });
      expect(otpInputs[1]).toHaveValue("2");
      expect(document.activeElement).toBe(otpInputs[2]);
    });

    test("does not auto-advance beyond last input", async () => {
      render(<Step3Verify {...baseProps} />);
      const otpInputs = screen.getAllByTitle("code");
      const lastInput = otpInputs[5];

      lastInput.focus();
      fireEvent.change(lastInput, { target: { value: "6" } });
      expect(lastInput).toHaveValue("6");

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(lastInput).toHaveValue("6");
      expect(document.activeElement).toBe(lastInput);
    });

    test("moves to previous input on backspace when current is empty", () => {
      render(<Step3Verify {...baseProps} />);
      const otpInputs = screen.getAllByTitle("code");

      fireEvent.change(otpInputs[0], { target: { value: "1" } });
      fireEvent.change(otpInputs[1], { target: { value: "2" } });

      otpInputs[2].focus();
      fireEvent.keyDown(otpInputs[2], { key: "Backspace" });

      expect(document.activeElement).toBe(otpInputs[1]);
    });

    test("does not move to previous input on backspace when current has value", () => {
      render(<Step3Verify {...baseProps} />);
      const otpInputs = screen.getAllByTitle("code");

      fireEvent.change(otpInputs[0], { target: { value: "1" } });
      otpInputs[0].focus();
      fireEvent.keyDown(otpInputs[0], { key: "Backspace" });

      expect(document.activeElement).toBe(otpInputs[0]);
    });
  });

  // Verify Button

  describe("Verify Button", () => {
    test("verify button is disabled when not all digits are filled", () => {
      render(<Step3Verify {...baseProps} />);
      const otpInputs = screen.getAllByTitle("code");
      const verifyButton = screen.getByRole("button", { name: /verify & continue/i });

      expect(verifyButton).toBeDisabled();

      fireEvent.change(otpInputs[0], { target: { value: "1" } });
      fireEvent.change(otpInputs[1], { target: { value: "2" } });
      fireEvent.change(otpInputs[2], { target: { value: "3" } });

      expect(verifyButton).toBeDisabled();
    });

    test("verify button is enabled when all digits are filled", () => {
      render(<Step3Verify {...baseProps} />);
      const otpInputs = screen.getAllByTitle("code");
      const verifyButton = screen.getByRole("button", { name: /verify & continue/i });

      otpInputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: String(index + 1) } });
      });

      expect(verifyButton).not.toBeDisabled();
    });

    test("auto-verifies when all digits are filled", async () => {
      render(<Step3Verify {...baseProps} />);
      const otpInputs = screen.getAllByTitle("code");

      otpInputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: String(index + 1) } });
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(mockOnVerified).toHaveBeenCalledTimes(1);
    });

    test("manual verify works when all digits are filled", async () => {
      render(<Step3Verify {...baseProps} />);
      const otpInputs = screen.getAllByTitle("code");
      const verifyButton = screen.getByRole("button", { name: /verify & continue/i });

      otpInputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: String(index + 1) } });
      });

      fireEvent.click(verifyButton);

      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(mockOnVerified).toHaveBeenCalledTimes(1);
    });

    test("verify does nothing when not all digits are filled", () => {
      render(<Step3Verify {...baseProps} />);
      const verifyButton = screen.getByRole("button", { name: /verify & continue/i });

      fireEvent.click(verifyButton);
      expect(mockOnVerified).not.toHaveBeenCalled();
    });
  });

  // Resend Code Functionality

  describe("Resend Code Functionality", () => {
    test("resend button triggers countdown", () => {
      render(<Step3Verify {...baseProps} />);

      fireEvent.click(screen.getByText("Resend code"));
      expect(screen.getByText("60")).toBeInTheDocument();
      expect(screen.queryByText("Resend code")).not.toBeInTheDocument();
    });

    test("countdown decreases every second", async () => {
      render(<Step3Verify {...baseProps} />);

      fireEvent.click(screen.getByText("Resend code"));
      expect(screen.getByText("60")).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("59")).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("58")).toBeInTheDocument();
    });

    test("resend button reappears after countdown reaches zero", async () => {
      render(<Step3Verify {...baseProps} />);

      fireEvent.click(screen.getByText("Resend code"));

      // FIX: vi.runAllTimers() loops infinitely — each tick's state update schedules
      // the next setTimeout and runAllTimers keeps chasing them endlessly.
      // Advance one second at a time for all 60 ticks instead.
      for (let i = 0; i < 60; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });
      }

      expect(screen.getByText("Resend code")).toBeInTheDocument();
      expect(screen.queryByText("60")).not.toBeInTheDocument();
    });

    test("can resend multiple times", async () => {
      render(<Step3Verify {...baseProps} />);

      // First resend — drain the full 60-second countdown
      fireEvent.click(screen.getByText("Resend code"));
      for (let i = 0; i < 60; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });
      }

      expect(screen.getByText("Resend code")).toBeInTheDocument();

      // Second resend — countdown must reset to 60
      fireEvent.click(screen.getByText("Resend code"));
      expect(screen.getByText("60")).toBeInTheDocument();
    });
  });

  // Visual Feedback

  describe("Visual Feedback", () => {
    test("inputs show verified styling after verification", async () => {
      render(<Step3Verify {...baseProps} />);
      const otpInputs = screen.getAllByTitle("code");
      const verifyButton = screen.getByRole("button", { name: /verify & continue/i });

      otpInputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: String(index + 1) } });
      });

      fireEvent.click(verifyButton);

      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      otpInputs.forEach((input) => {
        expect(input.className).toContain("border-green-500");
        expect(input.className).toContain("bg-green-50");
      });
    });

    test("inputs have focus styling", () => {
      render(<Step3Verify {...baseProps} />);
      const otpInputs = screen.getAllByTitle("code");

      otpInputs[0].focus();
      expect(otpInputs[0].className).toContain("focus:border-green-800");
    });
  });

  // ─────────────────────────────────────────────
  // SMS Fallback
  // ─────────────────────────────────────────────
  describe("SMS Fallback", () => {
    test("SMS fallback button is present and clickable", () => {
      render(<Step3Verify {...baseProps} />);
      const smsButton = screen.getByText("Send OTP to your phone via SMS instead");

      expect(smsButton).toBeInTheDocument();
      fireEvent.click(smsButton);
    });
  });

  // Edge Cases

  describe("Edge Cases", () => {
    test("handles rapid digit entry — takes last digit via slice(-1)", () => {
      render(<Step3Verify {...baseProps} />);
      const otpInputs = screen.getAllByTitle("code");

      // Component strips non-digits then takes last char: "123" → "3"
      fireEvent.change(otpInputs[0], { target: { value: "123" } });
      expect(otpInputs[0]).toHaveValue("3");
    });

    test("handles backspace on first input without crashing", () => {
      render(<Step3Verify {...baseProps} />);
      const otpInputs = screen.getAllByTitle("code");

      otpInputs[0].focus();
      fireEvent.keyDown(otpInputs[0], { key: "Backspace" });

      expect(document.activeElement).toBe(otpInputs[0]);
    });

    test("does not auto-verify after already verified", async () => {
      render(<Step3Verify {...baseProps} />);
      const otpInputs = screen.getAllByTitle("code");

      otpInputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: String(index + 1) } });
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(mockOnVerified).toHaveBeenCalledTimes(1);

      // Change a digit after verification — !verified guard must block re-trigger
      fireEvent.change(otpInputs[0], { target: { value: "9" } });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnVerified).toHaveBeenCalledTimes(1);
    });
  });
});
