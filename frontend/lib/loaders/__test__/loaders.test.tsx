import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  FullPage,
  TripleRingSpinner,
  DotBounceSpinner,
  ProgressBar,
  LogoPulse,
  ButtonSpinner,
  OverlayLoader,
  ExamLoader,
  DashboardSkeleton,
  ExamSkeleton,
  DualRingSpinner,
} from "../index";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

/* ─────────────────────────────────────────────────────────
   SplashLoader
───────────────────────────────────────────────────────── */
describe("SplashLoader", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("has role=status and aria-label", () => {
    render(<FullPage />);
    const el = screen.getByRole("status", { name: /loading Gravitest/i });
    expect(el).toBeInTheDocument();
  });

  it("renders bottom progress bar", () => {
    const { container } = render(<FullPage />);
    // The bar has a specific gradient background
    const bars = container.querySelectorAll('[style*="indeterminate"]');
    expect(bars.length).toBeGreaterThanOrEqual(1);
  });
});

/* ─────────────────────────────────────────────────────────
   OverlayLoader
───────────────────────────────────────────────────────── */
describe("OverlayLoader", () => {
  it("renders with testid", () => {
    render(<OverlayLoader />);
    expect(screen.getByTestId("overlay-loader")).toBeInTheDocument();
  });

  it("has role=dialog", () => {
    render(<OverlayLoader />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows default message", () => {
    render(<OverlayLoader />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows custom message", () => {
    render(<OverlayLoader message="Processing payment…" />);
    expect(screen.getByText("Processing payment…")).toBeInTheDocument();
  });

  it("shows sub text when provided", () => {
    render(<OverlayLoader message="Generating…" sub="Do not close this window" />);
    expect(screen.getByText("Do not close this window")).toBeInTheDocument();
  });

  it("renders G logo inside the spinner", () => {
    render(<OverlayLoader />);
    expect(screen.getByTestId("overlay-loader").textContent).toContain("G");
  });

  it("is aria-live assertive", () => {
    render(<OverlayLoader />);
    expect(screen.getByTestId("overlay-loader")).toHaveAttribute("aria-live", "assertive");
  });
});

/* ─────────────────────────────────────────────────────────
   ExamLoader
───────────────────────────────────────────────────────── */
describe("ExamLoader", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders with testid", () => {
    render(<ExamLoader />);
    expect(screen.getByTestId("exam-loader")).toBeInTheDocument();
  });

  it("shows default title", () => {
    render(<ExamLoader />);
    expect(screen.getByText("Preparing your exam session")).toBeInTheDocument();
  });

  it("shows custom title", () => {
    render(<ExamLoader title="Loading JAMB Mock" />);
    expect(screen.getByText("Loading JAMB Mock")).toBeInTheDocument();
  });

  it("renders all 4 steps", () => {
    render(<ExamLoader />);
    expect(screen.getByTestId("exam-step-0")).toBeInTheDocument();
    expect(screen.getByTestId("exam-step-1")).toBeInTheDocument();
    expect(screen.getByTestId("exam-step-2")).toBeInTheDocument();
    expect(screen.getByTestId("exam-step-3")).toBeInTheDocument();
  });

  it("step labels are present", () => {
    render(<ExamLoader />);
    const text = screen.getByTestId("exam-loader").textContent ?? "";
    expect(text).toContain("Fetching past questions");
    expect(text).toContain("Randomising question order");
    expect(text).toContain("Setting up your timer");
    expect(text).toContain("Session ready!");
  });

  it("steps complete over time", () => {
    render(<ExamLoader />);
    act(() => {
      vi.advanceTimersByTime(900);
    });
    const step0 = screen.getByTestId("exam-step-0");
    // After 900ms step 1 (index 0) should be done - check for tick
    expect(step0.textContent).toContain("✓");
  });

  it("has role=status", () => {
    render(<ExamLoader />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

/* ─────────────────────────────────────────────────────────
   DashboardSkeleton
───────────────────────────────────────────────────────── */
describe("DashboardSkeleton", () => {
  it("renders with testid", () => {
    render(<DashboardSkeleton />);
    expect(screen.getByTestId("dashboard-skeleton")).toBeInTheDocument();
  });

  it("has aria-busy=true", () => {
    render(<DashboardSkeleton />);
    expect(screen.getByTestId("dashboard-skeleton")).toHaveAttribute("aria-busy", "true");
  });

  it("has role=status", () => {
    render(<DashboardSkeleton />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders skeleton bones", () => {
    const { container } = render(<DashboardSkeleton />);
    // Should have many shimmer elements
    const bones = container.querySelectorAll('[style*="sk-shimmer"]');
    expect(bones.length).toBeGreaterThan(10);
  });
});

/* ─────────────────────────────────────────────────────────
   ExamSkeleton
───────────────────────────────────────────────────────── */
describe("ExamSkeleton", () => {
  it("renders with testid", () => {
    render(<ExamSkeleton />);
    expect(screen.getByTestId("exam-skeleton")).toBeInTheDocument();
  });

  it("has aria-busy=true", () => {
    render(<ExamSkeleton />);
    expect(screen.getByTestId("exam-skeleton")).toHaveAttribute("aria-busy", "true");
  });

  it("has role=status", () => {
    render(<ExamSkeleton />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders skeleton bones", () => {
    const { container } = render(<ExamSkeleton />);
    const bones = container.querySelectorAll('[style*="sk-shimmer"]');
    expect(bones.length).toBeGreaterThan(5);
  });
});

/* ─────────────────────────────────────────────────────────
   Inline Spinners
───────────────────────────────────────────────────────── */
describe("DualRingSpinner", () => {
  it("renders with testid", () => {
    render(<DualRingSpinner />);
    expect(screen.getByTestId("dual-ring-spinner")).toBeInTheDocument();
  });
  it("has role=status", () => {
    render(<DualRingSpinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
  it("accepts size prop", () => {
    render(<DualRingSpinner size="md" />);
    expect(screen.getByTestId("dual-ring-spinner")).toHaveStyle({ width: "28px" });
  });
});

describe("TripleRingSpinner", () => {
  it("renders with testid", () => {
    render(<TripleRingSpinner />);
    expect(screen.getByTestId("triple-ring-spinner")).toBeInTheDocument();
  });
  it("has role=status", () => {
    render(<TripleRingSpinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
  it("respects custom size", () => {
    render(<TripleRingSpinner size={48} />);
    expect(screen.getByTestId("triple-ring-spinner")).toHaveStyle({ width: "48px" });
  });
});

describe("DotBounceSpinner", () => {
  it("renders with testid", () => {
    render(<DotBounceSpinner />);
    expect(screen.getByTestId("dot-bounce-spinner")).toBeInTheDocument();
  });
  it("has role=status", () => {
    render(<DotBounceSpinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
  it("renders three dots", () => {
    const { container } = render(<DotBounceSpinner />);
    expect(container.querySelectorAll(".rounded-full").length).toBe(3);
  });
});

describe("ProgressBar", () => {
  it("renders with testid", () => {
    render(<ProgressBar />);
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
  });
  it("has correct role", () => {
    render(<ProgressBar />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
  it("shows label when provided", () => {
    render(<ProgressBar label="Uploading students…" />);
    expect(screen.getByText("Uploading students…")).toBeInTheDocument();
  });
  it("shows percentage for determinate mode", () => {
    render(<ProgressBar value={64} label="Uploading…" />);
    expect(screen.getByText("64%")).toBeInTheDocument();
  });
  it("sets aria-valuenow for determinate", () => {
    render(<ProgressBar value={40} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
  });
  it("does not set aria-valuenow for indeterminate", () => {
    render(<ProgressBar />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
  });
});

describe("LogoPulse", () => {
  it("renders with testid", () => {
    render(<LogoPulse />);
    expect(screen.getByTestId("logo-pulse")).toBeInTheDocument();
  });
  it("has role=status", () => {
    render(<LogoPulse />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
  it("shows the G letter", () => {
    render(<LogoPulse />);
    expect(screen.getByTestId("logo-pulse").textContent).toContain("G");
  });
});

describe("ButtonSpinner", () => {
  it("renders with testid", () => {
    render(<ButtonSpinner />);
    expect(screen.getByTestId("button-spinner")).toBeInTheDocument();
  });
  it("is disabled by default", () => {
    render(<ButtonSpinner />);
    expect(screen.getByTestId("button-spinner")).toBeDisabled();
  });
  it("shows custom label", () => {
    render(<ButtonSpinner label="Saving…" />);
    expect(screen.getByText("Saving…")).toBeInTheDocument();
  });
  it("renders dark variant by default", () => {
    render(<ButtonSpinner />);
    expect(screen.getByTestId("button-spinner")).toHaveStyle({ background: "#1a4a2e" });
  });
  it("renders light variant", () => {
    render(<ButtonSpinner variant="light" />);
    expect(screen.getByTestId("button-spinner")).toHaveStyle({ background: "white" });
  });
});
