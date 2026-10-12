import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import Step2Details from "../Step2Details";

// ─── Mock external utils ──────────────────────────────────────────────────────
vi.mock("@/utils/registerUtils", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const z = require("zod");

  const buildSchema = () =>
    z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      email: z.string().email("Enter a valid email"),
      phone: z.string().min(1, "Phone is required"),
      subject: z.string().optional(),
      lga: z.string().optional(),
      examTarget: z.string().optional(),
      password: z.string().min(8, "Password must be at least 8 characters"),
      confirm: z.string().min(1, "Please confirm your password"),
      agreeTerms: z
        .boolean()
        .refine((val: boolean) => val === true, { message: "You must agree to the terms" }),
      agreeMarketing: z.boolean().optional(),
    });

  const EXAM_TARGETS = [
    { value: "jamb", label: "JAMB", Icon: () => null },
    { value: "waec", label: "WAEC", Icon: () => null },
    { value: "postutme", label: "Post-UTME", Icon: () => null },
  ];

  const FieldLabel = ({ text }: { text: string }) => <label>{text}</label>;

  const getStrength = (pw: string) => {
    if (!pw) return { score: 0, label: "" };
    if (pw.length < 6) return { score: 1, label: "Weak" };
    if (pw.length < 10) return { score: 2, label: "Fair" };
    if (pw.length < 14) return { score: 3, label: "Strong" };
    return { score: 4, label: "Very Strong" };
  };

  const baseConfig = {
    label: "Student",
    heading: "Create your account",
    sub: "Join thousands of students",
    Icon: () => null,
    showSubject: false,
    showLGA: false,
    showExamTarget: false,
  };

  const ROLE_CONFIG: Record<string, typeof baseConfig> = {
    student: { ...baseConfig },
    teacher: {
      ...baseConfig,
      label: "Teacher",
      heading: "Create your teacher account",
      showSubject: true,
      showLGA: true,
    },
    professional: {
      ...baseConfig,
      label: "Professional",
      heading: "Create your professional account",
      showExamTarget: true,
    },
  };

  return { buildSchema, EXAM_TARGETS, FieldLabel, getStrength, ROLE_CONFIG };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockOnBack = vi.fn();
const mockOnSubmit = vi.fn();

const baseProps = {
  role: "student" as const,
  onBack: mockOnBack,
  onSubmit: mockOnSubmit,
};

async function fillValidForm() {
  await act(async () => {
    fireEvent.change(screen.getByPlaceholderText("Adaeze"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByPlaceholderText("Okonkwo"), { target: { value: "Okonkwo" } });
    fireEvent.change(screen.getByPlaceholderText("adaeze@example.com"), {
      target: { value: "ada@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("0801 234 5678"), {
      target: { value: "08012345678" },
    });
    fireEvent.change(screen.getByPlaceholderText("Minimum 8 characters"), {
      target: { value: "Password1!" },
    });
    fireEvent.change(screen.getByPlaceholderText("Re-enter your password"), {
      target: { value: "Password1!" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /terms of service/i }));
  });
}

async function submitAndFlush() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
  });
  await act(async () => {
    vi.advanceTimersByTime(1800);
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Step2Details", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    test("renders header, OAuth buttons, and form for student role", () => {
      render(<Step2Details {...baseProps} />);

      expect(screen.getByText("Create your account")).toBeInTheDocument();
      expect(screen.getByText("Join thousands of students")).toBeInTheDocument();

      expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /continue with phone number/i }),
      ).toBeInTheDocument();

      expect(screen.getByPlaceholderText("Adaeze")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Okonkwo")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("adaeze@example.com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("0801 234 5678")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Minimum 8 characters")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Re-enter your password")).toBeInTheDocument();

      expect(screen.getByText(/terms of service/i)).toBeInTheDocument();
      expect(screen.getByText(/send me jamb tips/i)).toBeInTheDocument();

      expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();

      expect(screen.getByText("SSL Secured")).toBeInTheDocument();
      expect(screen.getByText("Data Protected")).toBeInTheDocument();
      expect(screen.getByText("No Card Needed")).toBeInTheDocument();
    });

    test("back button is rendered and calls onBack when clicked", () => {
      render(<Step2Details {...baseProps} />);
      fireEvent.click(screen.getByRole("button", { name: /back/i }));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("Conditional Fields", () => {
    test("student role: does NOT show subject, LGA, or exam target", () => {
      render(<Step2Details {...baseProps} />);

      expect(screen.queryByTitle("subject")).not.toBeInTheDocument();
      expect(screen.queryByTitle("select lga")).not.toBeInTheDocument();
      expect(screen.queryByText("JAMB")).not.toBeInTheDocument();
    });

    test("teacher role: shows subject dropdown and LGA selector", () => {
      render(<Step2Details role="teacher" onBack={mockOnBack} onSubmit={mockOnSubmit} />);
      expect(screen.getByTitle("subject")).toBeInTheDocument();
      expect(screen.getByTitle("select lga")).toBeInTheDocument();
    });

    test("professional role: shows exam target radio buttons", () => {
      render(<Step2Details role="professional" onBack={mockOnBack} onSubmit={mockOnSubmit} />);
      expect(screen.getByText("JAMB")).toBeInTheDocument();
      expect(screen.getByText("WAEC")).toBeInTheDocument();
      expect(screen.getByText("Post-UTME")).toBeInTheDocument();
    });

    test("exam target selection updates active styling", () => {
      render(<Step2Details role="professional" onBack={mockOnBack} onSubmit={mockOnSubmit} />);

      const jambRadio = screen.getByRole("radio", { name: /jamb/i });
      fireEvent.click(jambRadio);
      expect(jambRadio).toBeChecked();

      const waecRadio = screen.getByRole("radio", { name: /waec/i });
      fireEvent.click(waecRadio);
      expect(waecRadio).toBeChecked();
      expect(jambRadio).not.toBeChecked();
    });
  });

  describe("Email Validation Indicator", () => {
    test("check icon appears when a valid email is typed", () => {
      render(<Step2Details {...baseProps} />);
      const emailInput = screen.getByPlaceholderText("adaeze@example.com");

      fireEvent.change(emailInput, { target: { value: "notvalid" } });
      expect(document.querySelector(".text-green-500")).not.toBeInTheDocument();

      fireEvent.change(emailInput, { target: { value: "ada@test.com" } });
      expect(document.querySelector(".text-green-500")).toBeInTheDocument();
    });
  });

  describe("Password Visibility Toggle", () => {
    test("password field is hidden by default and toggles to text", () => {
      render(<Step2Details {...baseProps} />);
      const passwordInput = screen.getByPlaceholderText("Minimum 8 characters");

      expect(passwordInput).toHaveAttribute("type", "password");

      const toggleButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.className.includes("absolute"));
      fireEvent.click(toggleButtons[0]);

      expect(passwordInput).toHaveAttribute("type", "text");
    });

    test("confirm password field toggles independently", () => {
      render(<Step2Details {...baseProps} />);
      const confirmInput = screen.getByPlaceholderText("Re-enter your password");

      expect(confirmInput).toHaveAttribute("type", "password");

      const toggleButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.className.includes("absolute"));
      fireEvent.click(toggleButtons[1]);

      expect(confirmInput).toHaveAttribute("type", "text");
    });

    test("toggling password back hides the value again", () => {
      render(<Step2Details {...baseProps} />);
      const passwordInput = screen.getByPlaceholderText("Minimum 8 characters");
      const toggleButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.className.includes("absolute"));

      fireEvent.click(toggleButtons[0]);
      expect(passwordInput).toHaveAttribute("type", "text");

      fireEvent.click(toggleButtons[0]);
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("Password Strength Indicator", () => {
    test("no strength label shown when password is empty", () => {
      render(<Step2Details {...baseProps} />);
      expect(screen.queryByText("Weak")).not.toBeInTheDocument();
      expect(screen.queryByText("Fair")).not.toBeInTheDocument();
    });

    test("shows Weak label for short password", () => {
      render(<Step2Details {...baseProps} />);
      fireEvent.change(screen.getByPlaceholderText("Minimum 8 characters"), {
        target: { value: "abc" },
      });
      expect(screen.getByText("Weak")).toBeInTheDocument();
    });

    test("shows Fair label for medium password", () => {
      render(<Step2Details {...baseProps} />);
      fireEvent.change(screen.getByPlaceholderText("Minimum 8 characters"), {
        target: { value: "abcdefgh" },
      });
      expect(screen.getByText("Fair")).toBeInTheDocument();
    });

    test("shows Strong label for longer password", () => {
      render(<Step2Details {...baseProps} />);
      fireEvent.change(screen.getByPlaceholderText("Minimum 8 characters"), {
        target: { value: "abcdefghij" },
      });
      expect(screen.getByText("Strong")).toBeInTheDocument();
    });

    test("shows Very Strong label for very long password", () => {
      render(<Step2Details {...baseProps} />);
      fireEvent.change(screen.getByPlaceholderText("Minimum 8 characters"), {
        target: { value: "abcdefghijklmno" },
      });
      expect(screen.getByText("Very Strong")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    test("shows required errors when submitted with empty fields", async () => {
      render(<Step2Details {...baseProps} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));
      });

      expect(screen.getByText("First name is required")).toBeInTheDocument();
      expect(screen.getByText("Last name is required")).toBeInTheDocument();
      expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
      expect(screen.getByText("You must agree to the terms")).toBeInTheDocument();
    });

    test("shows password too short error", async () => {
      render(<Step2Details {...baseProps} />);

      fireEvent.change(screen.getByPlaceholderText("Minimum 8 characters"), {
        target: { value: "short" },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));
      });

      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    });

    test("does not call onSubmit when form is invalid", async () => {
      render(<Step2Details {...baseProps} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));
      });

      expect(screen.getByText("First name is required")).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("clears error once user corrects the field", async () => {
      render(<Step2Details {...baseProps} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));
      });

      expect(screen.getByText("First name is required")).toBeInTheDocument();

      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText("Adaeze"), { target: { value: "Ada" } });
      });

      expect(screen.queryByText("First name is required")).not.toBeInTheDocument();
    });
  });

  describe("Submit & Loading State", () => {
    test("shows loading spinner and disables button during submission", async () => {
      render(<Step2Details {...baseProps} />);
      await fillValidForm();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));
      });

      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled();

      await act(async () => {
        vi.advanceTimersByTime(1800);
      });
    });

    test("calls onSubmit with the entered email after 1800ms", async () => {
      render(<Step2Details {...baseProps} />);
      await fillValidForm();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(1800);
      });

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith("ada@test.com");
    });

    test("submit button re-enables and shows Create Account after loading", async () => {
      render(<Step2Details {...baseProps} />);
      await fillValidForm();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));
      });

      await act(async () => {
        vi.advanceTimersByTime(1800);
      });

      expect(screen.getByRole("button", { name: /create account/i })).not.toBeDisabled();
    });
  });

  describe("Agreements", () => {
    test("agreeTerms checkbox is unchecked by default", () => {
      render(<Step2Details {...baseProps} />);
      expect(screen.getByRole("checkbox", { name: /terms of service/i })).not.toBeChecked();
    });

    test("agreeTerms checkbox can be checked and unchecked", () => {
      render(<Step2Details {...baseProps} />);
      const checkbox = screen.getByRole("checkbox", { name: /terms of service/i });

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    test("agreeMarketing checkbox is optional — unchecked by default", () => {
      render(<Step2Details {...baseProps} />);
      expect(screen.getByRole("checkbox", { name: /send me jamb tips/i })).not.toBeChecked();
    });

    test("form submits successfully without agreeMarketing checked", async () => {
      render(<Step2Details {...baseProps} />);
      await fillValidForm();

      await submitAndFlush();

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe("Teacher-specific fields", () => {
    test("LGA dropdown contains state options", () => {
      render(<Step2Details role="teacher" onBack={mockOnBack} onSubmit={mockOnSubmit} />);

      expect(screen.getByTitle("select lga")).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Lagos" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Abuja" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Kano" })).toBeInTheDocument();
    });

    test("subject dropdown contains subject options", () => {
      render(<Step2Details role="teacher" onBack={mockOnBack} onSubmit={mockOnSubmit} />);

      expect(screen.getByRole("option", { name: "Physics" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "English Language" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Accounting" })).toBeInTheDocument();
    });

    test("selecting a subject updates the select value", () => {
      render(<Step2Details role="teacher" onBack={mockOnBack} onSubmit={mockOnSubmit} />);
      const subjectSelect = screen.getByTitle("subject");

      fireEvent.change(subjectSelect, { target: { value: "Physics" } });
      expect(subjectSelect).toHaveValue("Physics");
    });

    test("selecting a state updates the LGA select value", () => {
      render(<Step2Details role="teacher" onBack={mockOnBack} onSubmit={mockOnSubmit} />);
      const lgaSelect = screen.getByTitle("select lga");

      fireEvent.change(lgaSelect, { target: { value: "Lagos" } });
      expect(lgaSelect).toHaveValue("Lagos");
    });
  });
});
