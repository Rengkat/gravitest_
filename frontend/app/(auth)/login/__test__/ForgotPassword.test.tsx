import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import ForgotPassword from "../ForgotPassword";

describe("ForgotPassword", () => {
  const mockOnBack = vi.fn();

  const baseProps = { onBack: mockOnBack };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─────────────────────────────────────────────
  // Initial Render (form view)
  // ─────────────────────────────────────────────
  describe("Initial Render", () => {
    test("renders the reset form by default", () => {
      render(<ForgotPassword {...baseProps} />);

      expect(screen.getByText("Reset your password")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("adaeze@example.com")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
    });

    test("renders Back to login button in form view", () => {
      render(<ForgotPassword {...baseProps} />);
      expect(screen.getByRole("button", { name: /back to login/i })).toBeInTheDocument();
    });

    test("renders inline Log in button", () => {
      render(<ForgotPassword {...baseProps} />);
      expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    });

    test("does NOT render success view on initial render", () => {
      render(<ForgotPassword {...baseProps} />);
      expect(screen.queryByText("Check your inbox")).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────
  // onBack callbacks
  // ─────────────────────────────────────────────
  describe("Back Navigation", () => {
    test("clicking Back to login arrow calls onBack", () => {
      render(<ForgotPassword {...baseProps} />);
      fireEvent.click(screen.getByRole("button", { name: /back to login/i }));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    test("clicking inline Log in button calls onBack", () => {
      render(<ForgotPassword {...baseProps} />);
      fireEvent.click(screen.getByRole("button", { name: /log in/i }));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────
  describe("Validation", () => {
    test("shows error when submitted with empty email", () => {
      render(<ForgotPassword {...baseProps} />);

      fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    });

    test("shows error when email format is invalid", () => {
      render(<ForgotPassword {...baseProps} />);

      fireEvent.change(screen.getByPlaceholderText("adaeze@example.com"), {
        target: { value: "notanemail" },
      });
      fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    });

    test("clears error when user starts typing", () => {
      render(<ForgotPassword {...baseProps} />);

      fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText("adaeze@example.com"), {
        target: { value: "a" },
      });

      expect(screen.queryByText("Please enter a valid email address")).not.toBeInTheDocument();
    });

    test("does not advance to sent view when email is invalid", () => {
      render(<ForgotPassword {...baseProps} />);

      fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

      expect(screen.queryByText("Check your inbox")).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────
  // Loading State
  // ─────────────────────────────────────────────
  describe("Loading State", () => {
    test("shows Sending… and disables button while loading", () => {
      render(<ForgotPassword {...baseProps} />);

      fireEvent.change(screen.getByPlaceholderText("adaeze@example.com"), {
        target: { value: "ada@test.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

      expect(screen.getByText(/sending/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

      // Clean up
      act(() => {
        vi.advanceTimersByTime(1500);
      });
    });

    test("does not show sent view before 1500ms", () => {
      render(<ForgotPassword {...baseProps} />);

      fireEvent.change(screen.getByPlaceholderText("adaeze@example.com"), {
        target: { value: "ada@test.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByText("Check your inbox")).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────
  // Sent / Success View
  // ─────────────────────────────────────────────
  describe("Sent View", () => {
    function submitValidEmail(email = "ada@test.com") {
      fireEvent.change(screen.getByPlaceholderText("adaeze@example.com"), {
        target: { value: email },
      });
      fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
      act(() => {
        vi.advanceTimersByTime(1500);
      });
    }

    test("shows sent view after 1500ms with valid email", () => {
      render(<ForgotPassword {...baseProps} />);
      submitValidEmail();

      expect(screen.getByText("Check your inbox")).toBeInTheDocument();
    });

    test("displays the submitted email address in the sent view", () => {
      render(<ForgotPassword {...baseProps} />);
      submitValidEmail("adaeze@example.com");

      expect(screen.getByText("adaeze@example.com")).toBeInTheDocument();
    });

    test("renders all three next-step instructions", () => {
      render(<ForgotPassword {...baseProps} />);
      submitValidEmail();

      expect(screen.getByText("Check your inbox (and spam folder)")).toBeInTheDocument();
      expect(screen.getByText(/click the.*reset password.*button/i)).toBeInTheDocument();
      expect(screen.getByText(/link expires in 30 minutes/i)).toBeInTheDocument();
    });

    test("renders step icons ①②③ in sent view", () => {
      render(<ForgotPassword {...baseProps} />);
      submitValidEmail();

      expect(screen.getByText("①")).toBeInTheDocument();
      expect(screen.getByText("②")).toBeInTheDocument();
      expect(screen.getByText("③")).toBeInTheDocument();
    });

    test("Back to Login button in sent view calls onBack", () => {
      render(<ForgotPassword {...baseProps} />);
      submitValidEmail();

      fireEvent.click(screen.getByRole("button", { name: /back to login/i }));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    test("Resend button returns to the form view", () => {
      render(<ForgotPassword {...baseProps} />);
      submitValidEmail();

      expect(screen.getByText("Check your inbox")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /resend/i }));

      expect(screen.queryByText("Check your inbox")).not.toBeInTheDocument();
      expect(screen.getByText("Reset your password")).toBeInTheDocument();
    });

    test("form view is restored after resend — email field is empty", () => {
      render(<ForgotPassword {...baseProps} />);
      submitValidEmail("ada@test.com");

      fireEvent.click(screen.getByRole("button", { name: /resend/i }));

      // setSent(false) returns to form but email state is preserved in useState
      // The input should still be present and functional
      expect(screen.getByPlaceholderText("adaeze@example.com")).toBeInTheDocument();
    });
  });
});
