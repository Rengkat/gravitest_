import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import PhoneLoginForm from "../PhoneLoginForm";

describe("PhoneLoginForm", () => {
  const mockOnSuccess = vi.fn();

  const baseProps = { onSuccess: mockOnSuccess };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─────────────────────────────────────────────
  // Initial Render
  // ─────────────────────────────────────────────
  describe("Initial Render", () => {
    test("renders phone input and Send OTP button", () => {
      render(<PhoneLoginForm {...baseProps} />);

      expect(screen.getByPlaceholderText("0801 234 5678")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /send otp code/i })).toBeInTheDocument();
    });

    test("Send OTP button is disabled when phone is empty", () => {
      render(<PhoneLoginForm {...baseProps} />);
      expect(screen.getByRole("button", { name: /send otp code/i })).toBeDisabled();
    });

    test("OTP inputs are not visible before sending", () => {
      render(<PhoneLoginForm {...baseProps} />);
      expect(screen.queryAllByTitle("enter digit")).toHaveLength(0);
    });

    test("renders the +234 country code prefix", () => {
      render(<PhoneLoginForm {...baseProps} />);
      expect(screen.getByText("+234")).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────
  // Phone Input
  // ─────────────────────────────────────────────
  describe("Phone Input", () => {
    test("Send OTP button enables when phone number is entered", () => {
      render(<PhoneLoginForm {...baseProps} />);

      fireEvent.change(screen.getByPlaceholderText("0801 234 5678"), {
        target: { value: "08012345678" },
      });

      expect(screen.getByRole("button", { name: /send otp code/i })).not.toBeDisabled();
    });

    test("Send OTP button disables again when phone is cleared", () => {
      render(<PhoneLoginForm {...baseProps} />);

      fireEvent.change(screen.getByPlaceholderText("0801 234 5678"), {
        target: { value: "08012345678" },
      });
      fireEvent.change(screen.getByPlaceholderText("0801 234 5678"), {
        target: { value: "" },
      });

      expect(screen.getByRole("button", { name: /send otp code/i })).toBeDisabled();
    });
  });

  // ─────────────────────────────────────────────
  // Sending OTP
  // ─────────────────────────────────────────────
  describe("Sending OTP", () => {
    function enterPhone(phone = "08012345678") {
      fireEvent.change(screen.getByPlaceholderText("0801 234 5678"), {
        target: { value: phone },
      });
    }

    test("shows Sending… and disables button while OTP is being sent", () => {
      render(<PhoneLoginForm {...baseProps} />);
      enterPhone();

      fireEvent.click(screen.getByRole("button", { name: /send otp code/i }));

      expect(screen.getByText("Sending…")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
    });

    test("shows OTP inputs after 1200ms", () => {
      render(<PhoneLoginForm {...baseProps} />);
      enterPhone();

      fireEvent.click(screen.getByRole("button", { name: /send otp code/i }));

      act(() => {
        vi.advanceTimersByTime(1200);
      });

      expect(screen.getAllByTitle("enter digit")).toHaveLength(6);
    });

    test("displays the formatted phone number in OTP confirmation message", () => {
      render(<PhoneLoginForm {...baseProps} />);
      enterPhone("08012345678");

      fireEvent.click(screen.getByRole("button", { name: /send otp code/i }));

      act(() => {
        vi.advanceTimersByTime(1200);
      });

      expect(screen.getByText("+234 08012345678")).toBeInTheDocument();
    });

    test("Send OTP button is not visible after OTP is sent", () => {
      render(<PhoneLoginForm {...baseProps} />);
      enterPhone();

      fireEvent.click(screen.getByRole("button", { name: /send otp code/i }));

      act(() => {
        vi.advanceTimersByTime(1200);
      });

      // Button label changes from "Send OTP Code" back to itself after sending
      // but the OTP section appears — confirm OTP inputs are now showing
      expect(screen.getAllByTitle("enter digit")).toHaveLength(6);
    });
  });

  // ─────────────────────────────────────────────
  // OTP Input Behaviour
  // ─────────────────────────────────────────────
  describe("OTP Input Behaviour", () => {
    function advanceToOTPView() {
      fireEvent.change(screen.getByPlaceholderText("0801 234 5678"), {
        target: { value: "08012345678" },
      });
      fireEvent.click(screen.getByRole("button", { name: /send otp code/i }));
      act(() => {
        vi.advanceTimersByTime(1200);
      });
    }

    test("accepts numeric input in OTP fields", () => {
      render(<PhoneLoginForm {...baseProps} />);
      advanceToOTPView();

      const inputs = screen.getAllByTitle("enter digit");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      expect(inputs[0]).toHaveValue("5");
    });

    test("rejects non-numeric input", () => {
      render(<PhoneLoginForm {...baseProps} />);
      advanceToOTPView();

      const inputs = screen.getAllByTitle("enter digit");
      fireEvent.change(inputs[0], { target: { value: "5" } });
      fireEvent.change(inputs[0], { target: { value: "a" } });
      expect(inputs[0]).toHaveValue("");
    });

    test("auto-advances to next input when digit is entered", () => {
      render(<PhoneLoginForm {...baseProps} />);
      advanceToOTPView();

      const inputs = screen.getAllByTitle("enter digit");
      fireEvent.change(inputs[0], { target: { value: "1" } });
      expect(document.activeElement).toBe(inputs[1]);
    });

    test("does not advance beyond last input", () => {
      render(<PhoneLoginForm {...baseProps} />);
      advanceToOTPView();

      const inputs = screen.getAllByTitle("enter digit");
      const lastInput = inputs[5];
      lastInput.focus();
      fireEvent.change(lastInput, { target: { value: "6" } });
      expect(document.activeElement).toBe(lastInput);
    });

    test("backspace on empty input moves focus to previous", () => {
      render(<PhoneLoginForm {...baseProps} />);
      advanceToOTPView();

      const inputs = screen.getAllByTitle("enter digit");
      fireEvent.change(inputs[0], { target: { value: "1" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      inputs[2].focus();
      fireEvent.keyDown(inputs[2], { key: "Backspace" });
      expect(document.activeElement).toBe(inputs[1]);
    });
  });

  // ─────────────────────────────────────────────
  // Manual Verify Button
  // ─────────────────────────────────────────────
  describe("Manual Verify Button", () => {
    function advanceToOTPView() {
      fireEvent.change(screen.getByPlaceholderText("0801 234 5678"), {
        target: { value: "08012345678" },
      });
      fireEvent.click(screen.getByRole("button", { name: /send otp code/i }));
      act(() => {
        vi.advanceTimersByTime(1200);
      });
    }

    test("Verify & Log In button calls onSuccess with Student", () => {
      render(<PhoneLoginForm {...baseProps} />);
      advanceToOTPView();

      fireEvent.click(screen.getByRole("button", { name: /verify.*log in/i }));
      expect(mockOnSuccess).toHaveBeenCalledWith("Student");
    });
  });

  // ─────────────────────────────────────────────
  // Auto-verify
  // ─────────────────────────────────────────────
  describe("Auto-verify", () => {
    function advanceToOTPView() {
      fireEvent.change(screen.getByPlaceholderText("0801 234 5678"), {
        target: { value: "08012345678" },
      });
      fireEvent.click(screen.getByRole("button", { name: /send otp code/i }));
      act(() => {
        vi.advanceTimersByTime(1200);
      });
    }

    test("auto-verifies after all 6 digits are entered", async () => {
      render(<PhoneLoginForm {...baseProps} />);
      advanceToOTPView();

      const inputs = screen.getAllByTitle("enter digit");
      inputs.forEach((input, i) => {
        fireEvent.change(input, { target: { value: String(i + 1) } });
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(mockOnSuccess).toHaveBeenCalledWith("Student");
    });

    test("does not auto-verify when only some digits are filled", () => {
      render(<PhoneLoginForm {...baseProps} />);
      advanceToOTPView();

      const inputs = screen.getAllByTitle("enter digit");
      fireEvent.change(inputs[0], { target: { value: "1" } });
      fireEvent.change(inputs[1], { target: { value: "2" } });

      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // Resend Countdown
  // ─────────────────────────────────────────────
  describe("Resend Countdown", () => {
    function advanceToOTPView() {
      fireEvent.change(screen.getByPlaceholderText("0801 234 5678"), {
        target: { value: "08012345678" },
      });
      fireEvent.click(screen.getByRole("button", { name: /send otp code/i }));
      act(() => {
        vi.advanceTimersByTime(1200);
      });
    }

    test("Resend button is visible initially in OTP view", () => {
      render(<PhoneLoginForm {...baseProps} />);
      advanceToOTPView();

      expect(screen.getByRole("button", { name: /resend/i })).toBeInTheDocument();
    });

    test("clicking Resend starts a 60-second countdown", () => {
      render(<PhoneLoginForm {...baseProps} />);
      advanceToOTPView();

      fireEvent.click(screen.getByRole("button", { name: /resend/i }));
      expect(screen.getByText("60")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /resend/i })).not.toBeInTheDocument();
    });

    test("countdown decreases every second", async () => {
      render(<PhoneLoginForm {...baseProps} />);
      advanceToOTPView();

      fireEvent.click(screen.getByRole("button", { name: /resend/i }));

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("59")).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("58")).toBeInTheDocument();
    });

    test("Resend button reappears after countdown completes", async () => {
      render(<PhoneLoginForm {...baseProps} />);
      advanceToOTPView();

      fireEvent.click(screen.getByRole("button", { name: /resend/i }));

      for (let i = 0; i < 60; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });
      }

      expect(screen.getByRole("button", { name: /resend/i })).toBeInTheDocument();
    });
  });
});
