import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import FooterCta from "../FooterCta";

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("FooterCta", () => {
  test("renders children correctly", () => {
    render(<FooterCta>Click Me</FooterCta>);

    expect(screen.getByRole("link", { name: /click me/i })).toBeInTheDocument();
  });

  test("renders as an anchor tag", () => {
    render(<FooterCta>Go somewhere</FooterCta>);

    const link = screen.getByRole("link", { name: /go somewhere/i });
    expect(link.tagName).toBe("A");
  });

  test("has the correct href", () => {
    render(<FooterCta>Click Me</FooterCta>);

    const link = screen.getByRole("link", { name: /click me/i });
    expect(link).toHaveAttribute("href", "#");
  });

  test("applies the correct base styles", () => {
    render(<FooterCta>Click Me</FooterCta>);

    const link = screen.getByRole("link", { name: /click me/i });
    expect(link).toHaveClass(
      "group",
      "flex",
      "items-center",
      "gap-1.5",
      "text-green-700",
      "font-bold",
      "no-underline",
    );
  });

  test("renders non-string children (e.g. JSX)", () => {
    render(
      <FooterCta>
        <span data-testid="icon">→</span> Learn more
      </FooterCta>,
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText(/learn more/i)).toBeInTheDocument();
  });
});
