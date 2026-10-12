import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import NavBtn from "../NavBtn";

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    ...rest
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

describe("NavBtn", () => {
  test("renders children", () => {
    render(
      <NavBtn href="/login" variant="ghost">
        Log In
      </NavBtn>,
    );

    expect(screen.getByText("Log In")).toBeInTheDocument();
  });

  test("renders with correct href", () => {
    render(
      <NavBtn href="/signup" variant="primary">
        Sign Up
      </NavBtn>,
    );

    expect(screen.getByRole("link")).toHaveAttribute("href", "/signup");
  });

  test("applies ghost variant classes", () => {
    render(
      <NavBtn href="#" variant="ghost">
        Log In
      </NavBtn>,
    );

    expect(screen.getByRole("link")).toHaveClass("border", "border-green-800", "bg-transparent");
  });

  test("applies primary variant classes", () => {
    render(
      <NavBtn href="#" variant="primary">
        Sign Up
      </NavBtn>,
    );

    expect(screen.getByRole("link")).toHaveClass("bg-green-800", "text-white");
  });

  test("renders testId when provided", () => {
    render(
      <NavBtn href="#" variant="ghost" testId="nav-login">
        Log In
      </NavBtn>,
    );

    expect(screen.getByTestId("nav-login")).toBeInTheDocument();
  });
});
