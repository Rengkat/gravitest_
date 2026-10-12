import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import LoginSuccess from "../LoginSuccess";

describe("LoginSuccess", () => {
  test("renders the user's name", () => {
    render(<LoginSuccess name="Adaeze" />);
    expect(screen.getByText("Adaeze")).toBeInTheDocument();
  });

  test("dashboard link points to /dashboard", () => {
    render(<LoginSuccess name="Adaeze" />);
    expect(screen.getByRole("link", { name: /go to dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
