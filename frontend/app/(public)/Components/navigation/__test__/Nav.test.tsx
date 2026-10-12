import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import Navbar from "../Nav";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/components/Gravitas-logo", () => ({
  GravitasWordmark: () => <svg data-testid="Gravitest-wordmark" />,
}));

vi.mock("@/lib/constants/NavConstants", () => ({
  NAV_PRODUCTS: [
    { icon: () => <svg />, color: "green", title: "CBT Exam Practice", desc: "desc" },
    { icon: () => <svg />, color: "gold", title: "Gravitest-Tutor AI", desc: "desc" },
  ],
  NAV_EXAMS: [{ icon: () => <svg />, color: "green", title: "JAMB / UTME", desc: "desc" }],
  PAST_QUESTIONS: [
    { icon: () => <svg />, color: "green", title: "Primary School Exams", desc: "desc" },
  ],
  NAV_RESOURCES: [{ icon: () => <svg />, color: "green", title: "Blog", desc: "desc" }],
}));

vi.mock("../NavItemWithDropdown", () => ({
  default: ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <button>{label}</button>
      {children}
    </div>
  ),
}));

vi.mock("../MegaDropdown", () => ({
  default: ({ label }: { label: string }) => <div data-testid="mega-dropdown">{label}</div>,
}));

vi.mock("../MobileLink", () => ({
  default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <a data-testid="mobile-link" onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock("../MobileSectionTitle", () => ({
  default: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

vi.mock("../NavBtn", () => ({
  default: ({
    children,
    testId,
    href,
  }: {
    children: React.ReactNode;
    testId?: string;
    href: string;
  }) => (
    <a href={href} data-testid={testId}>
      {children}
    </a>
  ),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Navbar", () => {
  test("renders the navbar", () => {
    render(<Navbar />);

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
  });

  test("renders the logo", () => {
    render(<Navbar />);

    expect(screen.getByTestId("Gravitest-wordmark")).toBeInTheDocument();
  });

  test("renders desktop CTA buttons", () => {
    render(<Navbar />);

    expect(screen.getByTestId("nav-login")).toBeInTheDocument();
    expect(screen.getByTestId("nav-register")).toBeInTheDocument(); // Fixed: changed from nav-signup
  });

  test("mobile menu is hidden by default", () => {
    render(<Navbar />);

    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
  });

  test("opens mobile menu when hamburger is clicked", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByTestId("mobile-hamburger"));

    expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
  });

  test("closes mobile menu when hamburger is clicked again", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByTestId("mobile-hamburger"));
    await user.click(screen.getByTestId("mobile-hamburger"));

    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
  });

  test("hamburger aria-label updates with menu state", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const btn = screen.getByTestId("mobile-hamburger");
    expect(btn).toHaveAttribute("aria-label", "Open menu");

    await user.click(btn);
    expect(btn).toHaveAttribute("aria-label", "Close menu");
  });

  test("mobile menu closes when a mobile link is clicked", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByTestId("mobile-hamburger"));
    expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();

    await user.click(screen.getAllByTestId("mobile-link")[0]);
    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
  });
});
