import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import RegisterPage from "../RegisterClient";

// ─── Mock all child components ────────────────────────────────────────────────
// RegisterPage is an orchestration component. Its job is wiring state between
// steps — not rendering them. Mock every child so this stays a pure unit test.

vi.mock("../LeftPanel", () => ({ default: () => <div data-testid="left-panel" /> }));
vi.mock("../StepIndicator", () => ({
  default: ({ current }: { current: number }) => (
    <div data-testid="step-indicator" data-current={current} />
  ),
}));
vi.mock("../StepSuccess", () => ({ default: () => <div data-testid="step-success" /> }));

// Step mocks expose the callback props so tests can trigger them directly
vi.mock("../Step1RoleSelect", () => ({
  default: ({
    selected,
    onSelect,
    onContinue,
  }: {
    selected: string | null;
    onSelect: (id: string) => void;
    onContinue: () => void;
  }) => (
    <div data-testid="step1">
      <span data-testid="selected-role">{selected ?? "none"}</span>
      <button onClick={() => onSelect("student")}>Select Student</button>
      <button onClick={onContinue}>Continue</button>
    </div>
  ),
}));

vi.mock("../Step2Details", () => ({
  default: ({
    role,
    onBack,
    onSubmit,
  }: {
    role: string;
    onBack: () => void;
    onSubmit: (email: string) => void;
  }) => (
    <div data-testid="step2">
      <span data-testid="step2-role">{role}</span>
      <button onClick={onBack}>Back</button>
      <button onClick={() => onSubmit("ada@test.com")}>Submit</button>
    </div>
  ),
}));

vi.mock("../Step3Verify", () => ({
  default: ({ email, onVerified }: { email: string; onVerified: () => void }) => (
    <div data-testid="step3">
      <span data-testid="step3-email">{email}</span>
      <button onClick={onVerified}>Verified</button>
    </div>
  ),
}));

// ─── Mock window.scrollTo ─────────────────────────────────────────────────────
const mockScrollTo = vi.fn();

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = mockScrollTo;
  });

  // ───────────────────────────────────────────
  // Initial render
  // ───────────────────────────────────────────
  describe("Initial Render", () => {
    test("renders Step 1 on mount", () => {
      render(<RegisterPage />);

      expect(screen.getByTestId("step1")).toBeInTheDocument();
      expect(screen.queryByTestId("step2")).not.toBeInTheDocument();
      expect(screen.queryByTestId("step3")).not.toBeInTheDocument();
      expect(screen.queryByTestId("step-success")).not.toBeInTheDocument();
    });

    test("no role is selected on mount", () => {
      render(<RegisterPage />);
      expect(screen.getByTestId("selected-role")).toHaveTextContent("none");
    });

    test("StepIndicator is rendered on step 1 with current=1", () => {
      render(<RegisterPage />);
      const indicator = screen.getByTestId("step-indicator");
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute("data-current", "1");
    });

    test("renders the Log in link", () => {
      render(<RegisterPage />);
      expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────
  // Step 1 — Role selection
  // ───────────────────────────────────────────
  describe("Step 1 — Role Selection", () => {
    test("clicking Continue without a role shows error message", () => {
      render(<RegisterPage />);

      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      expect(screen.getByText("Please select an account type to continue.")).toBeInTheDocument();
      // Must stay on step 1
      expect(screen.getByTestId("step1")).toBeInTheDocument();
    });

    test("selecting a role clears the role error", () => {
      render(<RegisterPage />);

      // Trigger the error first
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));
      expect(screen.getByText("Please select an account type to continue.")).toBeInTheDocument();

      // Selecting a role should clear it
      fireEvent.click(screen.getByRole("button", { name: /select student/i }));
      expect(
        screen.queryByText("Please select an account type to continue."),
      ).not.toBeInTheDocument();
    });

    test("selecting a role updates the selected prop passed to Step1RoleSelect", () => {
      render(<RegisterPage />);

      fireEvent.click(screen.getByRole("button", { name: /select student/i }));
      expect(screen.getByTestId("selected-role")).toHaveTextContent("student");
    });

    test("Continue with a role selected advances to Step 2", () => {
      render(<RegisterPage />);

      fireEvent.click(screen.getByRole("button", { name: /select student/i }));
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      expect(screen.queryByTestId("step1")).not.toBeInTheDocument();
      expect(screen.getByTestId("step2")).toBeInTheDocument();
    });

    test("advancing to Step 2 calls window.scrollTo(0, 0)", () => {
      render(<RegisterPage />);

      fireEvent.click(screen.getByRole("button", { name: /select student/i }));
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
    });

    test("StepIndicator shows current=2 after advancing to Step 2", () => {
      render(<RegisterPage />);

      fireEvent.click(screen.getByRole("button", { name: /select student/i }));
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      expect(screen.getByTestId("step-indicator")).toHaveAttribute("data-current", "2");
    });
  });

  // ───────────────────────────────────────────
  // Step 2 — Details form
  // ───────────────────────────────────────────
  describe("Step 2 — Details Form", () => {
    function advanceToStep2() {
      fireEvent.click(screen.getByRole("button", { name: /select student/i }));
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    }

    test("Step 2 receives the selected role as a prop", () => {
      render(<RegisterPage />);
      advanceToStep2();

      expect(screen.getByTestId("step2-role")).toHaveTextContent("student");
    });

    test("Back button in Step 2 returns to Step 1", () => {
      render(<RegisterPage />);
      advanceToStep2();

      fireEvent.click(screen.getByRole("button", { name: /back/i }));

      expect(screen.getByTestId("step1")).toBeInTheDocument();
      expect(screen.queryByTestId("step2")).not.toBeInTheDocument();
    });

    test("submitting Step 2 advances to Step 3", () => {
      render(<RegisterPage />);
      advanceToStep2();

      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      expect(screen.queryByTestId("step2")).not.toBeInTheDocument();
      expect(screen.getByTestId("step3")).toBeInTheDocument();
    });

    test("submitting Step 2 passes email to Step 3", () => {
      render(<RegisterPage />);
      advanceToStep2();

      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      expect(screen.getByTestId("step3-email")).toHaveTextContent("ada@test.com");
    });

    test("advancing to Step 3 calls window.scrollTo(0, 0)", () => {
      render(<RegisterPage />);
      advanceToStep2();
      mockScrollTo.mockClear(); // clear the scroll from step1→step2

      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
    });

    test("StepIndicator shows current=3 after advancing to Step 3", () => {
      render(<RegisterPage />);
      advanceToStep2();
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      expect(screen.getByTestId("step-indicator")).toHaveAttribute("data-current", "3");
    });
  });

  // ───────────────────────────────────────────
  // Step 3 — Verification
  // ───────────────────────────────────────────
  describe("Step 3 — Verification", () => {
    function advanceToStep3() {
      fireEvent.click(screen.getByRole("button", { name: /select student/i }));
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    }

    test("onVerified advances to success screen", () => {
      render(<RegisterPage />);
      advanceToStep3();

      fireEvent.click(screen.getByRole("button", { name: /verified/i }));

      expect(screen.queryByTestId("step3")).not.toBeInTheDocument();
      expect(screen.getByTestId("step-success")).toBeInTheDocument();
    });

    test("advancing to success calls window.scrollTo(0, 0)", () => {
      render(<RegisterPage />);
      advanceToStep3();
      mockScrollTo.mockClear();

      fireEvent.click(screen.getByRole("button", { name: /verified/i }));

      expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
    });
  });

  // ───────────────────────────────────────────
  // Success screen
  // ───────────────────────────────────────────
  describe("Success Screen", () => {
    function advanceToSuccess() {
      fireEvent.click(screen.getByRole("button", { name: /select student/i }));
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));
      fireEvent.click(screen.getByRole("button", { name: /verified/i }));
    }

    test("StepIndicator is hidden on success screen", () => {
      render(<RegisterPage />);
      advanceToSuccess();

      expect(screen.queryByTestId("step-indicator")).not.toBeInTheDocument();
    });

    test("only StepSuccess is rendered on success", () => {
      render(<RegisterPage />);
      advanceToSuccess();

      expect(screen.getByTestId("step-success")).toBeInTheDocument();
      expect(screen.queryByTestId("step1")).not.toBeInTheDocument();
      expect(screen.queryByTestId("step2")).not.toBeInTheDocument();
      expect(screen.queryByTestId("step3")).not.toBeInTheDocument();
    });
  });
});
