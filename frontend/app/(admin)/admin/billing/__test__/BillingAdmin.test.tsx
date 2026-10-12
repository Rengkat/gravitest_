import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/Components/admin/billing/PlansAdmin", () => ({ default: () => <div>plans-screen</div> }));
vi.mock("@/Components/admin/billing/GatewaysAdmin", () => ({ default: () => <div>gateways-screen</div> }));
vi.mock("@/Components/admin/billing/FeatureRulesAdmin", () => ({ default: () => <div>rules-screen</div> }));

import BillingAdminClient from "../BillingAdminClient";

describe("admin Plans & Access page", () => {
  it("opens on plans & promos", () => {
    render(<BillingAdminClient />);
    expect(screen.getByRole("heading", { name: "Plans & Access" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Plans & promos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("plans-screen")).toBeInTheDocument();
  });

  it("each tab shows its own screen and only that one", async () => {
    render(<BillingAdminClient />);
    await userEvent.click(screen.getByRole("tab", { name: "Free vs paid" }));
    expect(screen.getByText("rules-screen")).toBeInTheDocument();
    expect(screen.queryByText("plans-screen")).toBeNull();

    await userEvent.click(screen.getByRole("tab", { name: "Payment methods" }));
    expect(screen.getByText("gateways-screen")).toBeInTheDocument();
    expect(screen.queryByText("rules-screen")).toBeNull();
  });

  it("tells the admin what each tab is for, and marks the selected one for assistive tech", async () => {
    render(<BillingAdminClient />);
    expect(screen.getByText(/run timed promotions/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Payment methods" }));
    expect(screen.getByText(/which payment options customers see/)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Plans & promos" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "billing-tab-payments");
  });
});
