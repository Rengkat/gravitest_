import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import MobileSectionTitle from "../MobileSectionTitle";

describe("MobileSectionTitle", () => {
  test("renders children", () => {
    render(<MobileSectionTitle>Products</MobileSectionTitle>);

    expect(screen.getByText("Products")).toBeInTheDocument();
  });

  test("applies first styles when first={true}", () => {
    render(<MobileSectionTitle first>Products</MobileSectionTitle>);

    expect(screen.getByText("Products")).toHaveClass("pt-1");
  });

  test("applies non-first styles by default", () => {
    render(<MobileSectionTitle>Products</MobileSectionTitle>);

    const el = screen.getByText("Products");
    expect(el).toHaveClass("pt-4", "mt-2", "border-t");
  });

  test("does not apply non-first styles when first={true}", () => {
    render(<MobileSectionTitle first>Products</MobileSectionTitle>);

    const el = screen.getByText("Products");
    expect(el).not.toHaveClass("pt-4", "mt-2", "border-t");
  });
});
