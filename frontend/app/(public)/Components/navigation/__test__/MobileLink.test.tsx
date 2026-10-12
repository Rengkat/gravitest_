import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import MobileLink from "../MobileLink";

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("next/link", () => ({
  default: ({
    href,
    onClick,
    className,
    children,
  }: {
    href: string;
    onClick?: () => void;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/NavUtils");

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MockIcon = () => <svg data-testid="mock-icon" />;

const baseProps = {
  icon: MockIcon,
  children: "Dashboard",
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("MobileLink", () => {
  test("renders children", () => {
    render(<MobileLink {...baseProps} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  test("renders as a link with default href='#'", () => {
    render(<MobileLink {...baseProps} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "#");
  });

  test("renders with a custom href", () => {
    render(<MobileLink {...baseProps} href="/practice" />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/practice");
  });

  test("renders the icon", () => {
    render(<MobileLink {...baseProps} />);

    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
  });

  test("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<MobileLink {...baseProps} onClick={handleClick} />);

    await user.click(screen.getByRole("link"));

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
