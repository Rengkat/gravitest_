import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import userEvent from "@testing-library/user-event";
import NavItemWithDropdown from "../NavItemWithDropdown";

describe("NavItemWithDropdown", () => {
  test("renders the label", () => {
    render(<NavItemWithDropdown label="Products">content</NavItemWithDropdown>);

    expect(screen.getByRole("button", { name: /products/i })).toBeInTheDocument();
  });

  test("hides children by default", () => {
    render(
      <NavItemWithDropdown label="Products">
        <div data-testid="dropdown">content</div>
      </NavItemWithDropdown>,
    );

    expect(screen.queryByTestId("dropdown")).not.toBeInTheDocument();
  });

  test("shows children on mouse enter", async () => {
    const user = userEvent.setup();
    render(
      <NavItemWithDropdown label="Products">
        <div data-testid="dropdown">content</div>
      </NavItemWithDropdown>,
    );

    await user.hover(screen.getByRole("button", { name: /products/i }));

    expect(screen.getByTestId("dropdown")).toBeInTheDocument();
  });

  test("hides children on mouse leave", async () => {
    const user = userEvent.setup();
    render(
      <NavItemWithDropdown label="Products">
        <div data-testid="dropdown">content</div>
      </NavItemWithDropdown>,
    );

    await user.hover(screen.getByRole("button", { name: /products/i }));
    await user.unhover(screen.getByRole("button", { name: /products/i }));

    expect(screen.queryByTestId("dropdown")).not.toBeInTheDocument();
  });
});
