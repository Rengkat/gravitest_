import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import LoginPage from "../PageClient";

// ─── Mock all child components ────────────────────────────────────────────────
vi.mock("../LoginLeftPanel", () => ({ default: () => <div data-testid="left-panel" /> }));

vi.mock("../LoginSuccess", () => ({
  default: ({ name }: { name: string }) => (
    <div data-testid="login-success">
      <span data-testid="success-name">{name}</span>
    </div>
  ),
}));

vi.mock("../ForgotPassword", () => ({
  default: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="forgot-password">
      <button onClick={onBack}>Back to login</button>
    </div>
  ),
}));

vi.mock("../EmailLoginForm", () => ({
  default: ({
    onSuccess,
    onForgot,
    onClearError,
  }: {
    onSuccess: (name: string) => void;
    onForgot: () => void;
    onClearError: () => void;
  }) => (
    <div data-testid="email-form">
      <button onClick={() => onSuccess("Ada")}>Login success</button>
      <button onClick={() => onSuccess("__error__")}>Login error</button>
      <button onClick={onForgot}>Forgot password</button>
      <button onClick={onClearError}>Clear error</button>
    </div>
  ),
}));

vi.mock("../PhoneLoginForm", () => ({
  default: ({ onSuccess }: { onSuccess: (name: string) => void }) => (
    <div data-testid="phone-form">
      <button onClick={() => onSuccess("Student")}>Phone success</button>
    </div>
  ),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // Initial Render
  // ─────────────────────────────────────────────
  describe("Initial Render", () => {
    test("renders login view on mount", () => {
      render(<LoginPage />);

      expect(screen.getByText("Welcome back")).toBeInTheDocument();
      expect(screen.getByTestId("email-form")).toBeInTheDocument();
    });

    test("email tab is active by default", () => {
      render(<LoginPage />);

      expect(screen.getByTestId("email-form")).toBeInTheDocument();
      expect(screen.queryByTestId("phone-form")).not.toBeInTheDocument();
    });

    test("renders Email and Phone/OTP tab buttons", () => {
      render(<LoginPage />);

      expect(screen.getByRole("button", { name: /email/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /phone \/ otp/i })).toBeInTheDocument();
    });

    test("renders Sign up free link", () => {
      render(<LoginPage />);
      expect(screen.getByRole("link", { name: /sign up free/i })).toBeInTheDocument();
    });

    test("does not render error banner on mount", () => {
      render(<LoginPage />);
      expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
    });

    test("does not render forgot or success view on mount", () => {
      render(<LoginPage />);

      expect(screen.queryByTestId("forgot-password")).not.toBeInTheDocument();
      expect(screen.queryByTestId("login-success")).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────
  // Tab Switching
  // ─────────────────────────────────────────────
  describe("Tab Switching", () => {
    test("switching to Phone tab shows PhoneLoginForm", () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /phone \/ otp/i }));

      expect(screen.getByTestId("phone-form")).toBeInTheDocument();
      expect(screen.queryByTestId("email-form")).not.toBeInTheDocument();
    });

    test("switching back to Email tab shows EmailLoginForm", () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /phone \/ otp/i }));
      fireEvent.click(screen.getByRole("button", { name: /email/i }));

      expect(screen.getByTestId("email-form")).toBeInTheDocument();
      expect(screen.queryByTestId("phone-form")).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────
  // Forgot Password Flow
  // ─────────────────────────────────────────────
  describe("Forgot Password Flow", () => {
    test("clicking Forgot password in EmailLoginForm shows ForgotPassword view", () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));

      expect(screen.getByTestId("forgot-password")).toBeInTheDocument();
      expect(screen.queryByTestId("email-form")).not.toBeInTheDocument();
    });

    test("ForgotPassword onBack returns to login view", () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));
      expect(screen.getByTestId("forgot-password")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /back to login/i }));

      expect(screen.queryByTestId("forgot-password")).not.toBeInTheDocument();
      expect(screen.getByTestId("email-form")).toBeInTheDocument();
    });

    test("login header is hidden while in forgot password view", () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));

      expect(screen.queryByText("Welcome back")).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────
  // Successful Login
  // ─────────────────────────────────────────────
  describe("Successful Login", () => {
    test("successful email login advances to success view", () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /login success/i }));

      expect(screen.getByTestId("login-success")).toBeInTheDocument();
      expect(screen.queryByTestId("email-form")).not.toBeInTheDocument();
    });

    test("passes the user name to LoginSuccess", () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /login success/i }));

      expect(screen.getByTestId("success-name")).toHaveTextContent("Ada");
    });

    test("successful phone login advances to success view", () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /phone \/ otp/i }));
      fireEvent.click(screen.getByRole("button", { name: /phone success/i }));

      expect(screen.getByTestId("login-success")).toBeInTheDocument();
    });

    test("login header is hidden in success view", () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /login success/i }));

      expect(screen.queryByText("Welcome back")).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────
  // Error Banner
  // ─────────────────────────────────────────────
  describe("Error Banner", () => {
    test("shows error banner when onSuccess is called with __error__", () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /login error/i }));

      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      expect(
        screen.getByText(/the email or password you entered is incorrect/i),
      ).toBeInTheDocument();
    });

    test("stays on login view when credentials are wrong", () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /login error/i }));

      expect(screen.getByTestId("email-form")).toBeInTheDocument();
      expect(screen.queryByTestId("login-success")).not.toBeInTheDocument();
    });
    test("dismiss button clears the error banner", () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /login error/i }));
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();

      fireEvent.click(screen.getByTitle("error"));

      expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
    });

    test("onClearError from EmailLoginForm clears the error banner", () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /login error/i }));
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /clear error/i }));

      expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
    });

    test("error banner does not appear on successful login", () => {
      render(<LoginPage />);

      fireEvent.click(screen.getByRole("button", { name: /login success/i }));

      expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
    });
  });
});
