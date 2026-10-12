import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import DropdownItem from "../DropdownItem";

const MockIcon = () => <svg data-testid="mock-icon" />;

const baseProps = {
  icon: MockIcon,
  color: "green" as const,
  title: "CBT Exam Practice",
  desc: "Pixel-perfect JAMB simulators",
};

vi.mock("@/lib/NavUtils", () => ({
  ICON_CLASSES: {
    green: "bg-green-500/10 text-green-600",
    gold: "bg-gold/15 text-gold-dark",
    blue: "bg-blue-500/10 text-blue-600",
    orange: "bg-orange-500/10 text-orange-600",
    purple: "bg-purple-500/10 text-purple-600",
  },
  INLINE_BADGE_CLASSES: {
    gold: "bg-gold/15 text-gold-dark",
    new: "bg-gold-light text-amber-800",
  },
}));

describe("DropdownItem", () => {
  test("renders title and description", () => {
    render(<DropdownItem {...baseProps} />);

    expect(screen.getByText("CBT Exam Practice")).toBeInTheDocument();
    expect(screen.getByText("Pixel-perfect JAMB simulators")).toBeInTheDocument();
  });

  test("renders as an anchor with href='#'", () => {
    render(<DropdownItem {...baseProps} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "#");
  });

  test("renders the icon", () => {
    render(<DropdownItem {...baseProps} />);

    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
  });

  test("renders badge when badge and badgeStyle are provided", () => {
    render(<DropdownItem {...baseProps} badge="40k+ Qs" badgeStyle="gold" />);

    expect(screen.getByText("40k+ Qs")).toBeInTheDocument();
  });

  test("does not render badge when badge is null", () => {
    render(<DropdownItem {...baseProps} badge={null} badgeStyle={null} />);

    // only title + desc should be text nodes — no badge
    expect(screen.queryByText("40k+ Qs")).not.toBeInTheDocument();
  });

  test("applies correct color class to icon wrapper", () => {
    render(<DropdownItem {...baseProps} color="blue" />);

    // the icon wrapper div carries the ICON_CLASSES value
    const iconWrapper = screen.getByTestId("mock-icon").parentElement;
    expect(iconWrapper).toHaveClass("bg-blue-500/10", "text-blue-600");
  });
});
