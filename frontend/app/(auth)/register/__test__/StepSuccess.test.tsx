import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import StepSuccess from "../StepSuccess";

describe("StepSuccess", () => {
  test("renders welcome message and next steps", () => {
    render(<StepSuccess />);
    expect(screen.getByText("Welcome to Gravitest!")).toBeInTheDocument();
    expect(screen.getByText("Take a practice exam")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to my dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
