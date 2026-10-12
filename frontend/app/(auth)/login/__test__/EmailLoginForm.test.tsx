import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import EmailLoginForm from "../EmailLoginForm";

describe("EmailLoginForm", () => {
  const mockOnSuccess = vi.fn();
  const mockOnForgot = vi.fn();
  const mockOnClearError = vi.fn();

  const baseProps = {
    onSuccess: mockOnSuccess,
    onForgot: mockOnForgot,
    onClearError: mockOnClearError,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─────────────────────────────────────────────
  // Rendering
  // ─────────────────────────────────────────────
  describe("Rendering", () => {
    test("renders email input, password input, and submit button", () => {
      render(<EmailLoginForm {...baseProps} />);

      expect(screen.getByPlaceholderText("adaeze@example.com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    });

    test("renders Forgot password button", () => {
      render(<EmailLoginForm {...baseProps} />);
      expect(screen.getByRole("button", { name: /forgot password/i })).toBeInTheDocument();
    });

    test("renders Keep me logged in checkbox checked by default", () => {
      render(<EmailLoginForm {...baseProps} />);
      expect(screen.getByRole("checkbox", { name: /keep me logged in/i })).toBeChecked();
    });

    test("renders trust signals", () => {
      render(<EmailLoginForm {...baseProps} />);
      expect(screen.getByText("256-bit SSL")).toBeInTheDocument();
      expect(screen.getByText("NDPR Compliant")).toBeInTheDocument();
      expect(screen.getByText("No card needed")).toBeInTheDocument();
    });

    test("password field is hidden by default", () => {
      render(<EmailLoginForm {...baseProps} />);
      expect(screen.getByPlaceholderText("Enter your password")).toHaveAttribute(
        "type",
        "password",
      );
    });
  });

  // ─────────────────────────────────────────────
  // Password Visibility Toggle
  // ─────────────────────────────────────────────
  describe("Password Visibility Toggle", () => {
    test("toggles password field to text when eye button is clicked", () => {
      render(<EmailLoginForm {...baseProps} />);
      const passwordInput = screen.getByPlaceholderText("Enter your password");

      // The toggle button sits inside the password field wrapper — filter by position
      const toggleBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.className.includes("absolute"));

      fireEvent.click(toggleBtn!);
      expect(passwordInput).toHaveAttribute("type", "text");
    });

    test("toggles back to password type on second click", () => {
      render(<EmailLoginForm {...baseProps} />);
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      const toggleBtn = screen
        .getAllByRole("button")
        .find((btn) => btn.className.includes("absolute"));

      fireEvent.click(toggleBtn!);
      expect(passwordInput).toHaveAttribute("type", "text");

      fireEvent.click(toggleBtn!);
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  // ─────────────────────────────────────────────
  // Remember Me
  // ─────────────────────────────────────────────
  describe("Remember Me", () => {
    test("unchecking remember me works", () => {
      render(<EmailLoginForm {...baseProps} />);
      const checkbox = screen.getByRole("checkbox", { name: /keep me logged in/i });

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    test("re-checking remember me works", () => {
      render(<EmailLoginForm {...baseProps} />);
      const checkbox = screen.getByRole("checkbox", { name: /keep me logged in/i });

      fireEvent.click(checkbox); // uncheck
      fireEvent.click(checkbox); // re-check
      expect(checkbox).toBeChecked();
    });
  });

  // ─────────────────────────────────────────────
  // Forgot Password
  // ─────────────────────────────────────────────
  describe("Forgot Password", () => {
    test("clicking Forgot password calls onForgot", () => {
      render(<EmailLoginForm {...baseProps} />);
      fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));
      expect(mockOnForgot).toHaveBeenCalledTimes(1);
    });

    test("clicking Forgot password does not submit the form", () => {
      render(<EmailLoginForm {...baseProps} />);
      fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────
  describe("Validation", () => {
    test("shows email error when submitted with empty email", async () => {
      render(<EmailLoginForm {...baseProps} />);

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /log in/i }).closest("form")!);
      });

      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    });

    test("shows email error when email format is invalid", async () => {
      render(<EmailLoginForm {...baseProps} />);

      fireEvent.change(screen.getByPlaceholderText("adaeze@example.com"), {
        target: { value: "notanemail" },
      });

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /log in/i }).closest("form")!);
      });

      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    });

    test("shows password error when submitted with empty password", async () => {
      render(<EmailLoginForm {...baseProps} />);

      fireEvent.change(screen.getByPlaceholderText("adaeze@example.com"), {
        target: { value: "ada@test.com" },
      });

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /log in/i }).closest("form")!);
      });

      expect(screen.getByText("Password must be at least 6 characters")).toBeInTheDocument();
    });

    test("shows password error when password is too short", async () => {
      render(<EmailLoginForm {...baseProps} />);

      fireEvent.change(screen.getByPlaceholderText("adaeze@example.com"), {
        target: { value: "ada@test.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "abc" },
      });

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /log in/i }).closest("form")!);
      });

      expect(screen.getByText("Password must be at least 6 characters")).toBeInTheDocument();
    });

    test("shows both errors when both fields are empty", async () => {
      render(<EmailLoginForm {...baseProps} />);

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /log in/i }).closest("form")!);
      });

      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
      expect(screen.getByText("Password must be at least 6 characters")).toBeInTheDocument();
    });

    test("clears email error when user starts typing", async () => {
      render(<EmailLoginForm {...baseProps} />);

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /log in/i }).closest("form")!);
      });

      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText("adaeze@example.com"), {
        target: { value: "a" },
      });

      expect(screen.queryByText("Please enter a valid email address")).not.toBeInTheDocument();
    });

    test("clears password error when user starts typing", async () => {
      render(<EmailLoginForm {...baseProps} />);

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /log in/i }).closest("form")!);
      });

      expect(screen.getByText("Password must be at least 6 characters")).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "a" },
      });

      expect(screen.queryByText("Password must be at least 6 characters")).not.toBeInTheDocument();
    });

    test("does not call onSuccess when form is invalid", async () => {
      render(<EmailLoginForm {...baseProps} />);

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /log in/i }).closest("form")!);
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // Submit & Loading State
  // ─────────────────────────────────────────────
  describe("Submit & Loading State", () => {
    function fillValidForm() {
      fireEvent.change(screen.getByPlaceholderText("adaeze@example.com"), {
        target: { value: "ada@test.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "password123" },
      });
    }

    test("shows loading state and disables button during submission", async () => {
      render(<EmailLoginForm {...baseProps} />);
      fillValidForm();

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /log in/i }).closest("form")!);
      });

      expect(screen.getByText(/logging in/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /logging in/i })).toBeDisabled();

      // Clean up pending timer
      await act(async () => {
        vi.advanceTimersByTime(1600);
      });
    });

    test("calls onClearError when form is valid and submitted", async () => {
      render(<EmailLoginForm {...baseProps} />);
      fillValidForm();

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /log in/i }).closest("form")!);
      });

      expect(mockOnClearError).toHaveBeenCalledTimes(1);

      await act(async () => {
        vi.advanceTimersByTime(1600);
      });
    });

    test("calls onSuccess with capitalised name from email after 1600ms", async () => {
      render(<EmailLoginForm {...baseProps} />);
      fillValidForm();

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /log in/i }).closest("form")!);
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(1600);
      });

      // email is "ada@test.com" → name is "Ada"
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnSuccess).toHaveBeenCalledWith("Ada");
    });

    test("button re-enables after loading completes", async () => {
      render(<EmailLoginForm {...baseProps} />);
      fillValidForm();

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /log in/i }).closest("form")!);
      });

      await act(async () => {
        vi.advanceTimersByTime(1600);
      });

      expect(screen.getByRole("button", { name: /log in/i })).not.toBeDisabled();
    });
  });

  // ─────────────────────────────────────────────
  // Wrong Credentials Path
  // ─────────────────────────────────────────────
  describe("Wrong Credentials", () => {
    test("calls onSuccess with __error__ when wrong@test.com is used", async () => {
      render(<EmailLoginForm {...baseProps} />);

      fireEvent.change(screen.getByPlaceholderText("adaeze@example.com"), {
        target: { value: "wrong@test.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "password123" },
      });

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /log in/i }).closest("form")!);
      });

      await act(async () => {
        vi.advanceTimersByTime(1600);
      });

      expect(mockOnSuccess).toHaveBeenCalledWith("__error__");
    });
  });
});
