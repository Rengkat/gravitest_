import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import MegaDropdown from "../MegaDropdown";
import { NavItemData } from "@/lib/constants/NavConstants";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/NavUtils", () => ({
  FOOTER_BADGE_CLASSES: {
    green: "bg-green-500/10 text-green-600",
    gold: "bg-gold/15 text-gold-dark",
    new: "bg-gold-light text-amber-800",
  },
}));

vi.mock("../DropdownItem", () => ({
  default: ({ title, desc }: { title: string; desc: string }) => (
    <div data-testid="dropdown-item">
      <span>{title}</span>
      <span>{desc}</span>
    </div>
  ),
}));

vi.mock("../FooterCta", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <a href="#" data-testid="footer-cta">
      {children}
    </a>
  ),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MockIcon = () => <svg />;

const mockItems: NavItemData[] = [
  { icon: MockIcon, color: "green", title: "Item One", desc: "Desc one" },
  { icon: MockIcon, color: "blue", title: "Item Two", desc: "Desc two" },
];

const baseProps = {
  label: "Products",
  items: mockItems,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("MegaDropdown", () => {
  test("renders the section label", () => {
    render(<MegaDropdown {...baseProps} />);

    expect(screen.getByText("Products")).toBeInTheDocument();
  });

  test("renders a DropdownItem for each item", () => {
    render(<MegaDropdown {...baseProps} />);

    expect(screen.getAllByTestId("dropdown-item")).toHaveLength(mockItems.length);
  });

  test("renders item titles via DropdownItem", () => {
    render(<MegaDropdown {...baseProps} />);

    expect(screen.getByText("Item One")).toBeInTheDocument();
    expect(screen.getByText("Item Two")).toBeInTheDocument();
  });

  test("renders FooterCta when footerCta prop is provided", () => {
    render(<MegaDropdown {...baseProps} footerCta="Explore all" />);

    expect(screen.getByTestId("footer-cta")).toBeInTheDocument();
    expect(screen.getByText(/explore all/i)).toBeInTheDocument();
  });

  test("renders footer badge when footerBadge prop is provided", () => {
    render(<MegaDropdown {...baseProps} footerBadge="Free Trial" />);

    expect(screen.getByText("Free Trial")).toBeInTheDocument();
  });

  test("renders neither footer section when both props are omitted", () => {
    render(<MegaDropdown {...baseProps} />);

    expect(screen.queryByTestId("footer-cta")).not.toBeInTheDocument();
    expect(screen.queryByText("Free Trial")).not.toBeInTheDocument();
  });

  test("applies correct minWidth from width prop", () => {
    render(<MegaDropdown {...baseProps} width={400} />);

    // the outermost div carries the inline style
    const container = screen.getByText("Products").closest("div");
    expect(container).toHaveStyle({ minWidth: 400 });
  });
});
