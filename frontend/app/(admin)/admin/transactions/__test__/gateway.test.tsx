import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AdminTransaction } from "@/lib/api/admin-dashboard";
import type { TransactionFilters } from "../types";
import { SearchFilterBar } from "../components/SearchFilterBar";
import { TransactionRow } from "../components/TransactionRow";

vi.mock("@/lib/hooks/useBillingAdmin", () => ({ useAdminGateways: vi.fn() }));
import { useAdminGateways } from "@/lib/hooks/useBillingAdmin";

const EMPTY: TransactionFilters = { status: "", type: "", gateway: "", search: "", from: "", to: "" };

// FilterSelect (existing component) renders a <label> that isn't linked to its <select>,
// so locate the select through the label's container.
const gatewaySelect = () => screen.getByText("Gateway").parentElement!.querySelector("select") as HTMLSelectElement;

function bar(filters = EMPTY) {
  const setFilters = vi.fn();
  render(
    <SearchFilterBar
      filters={filters} setFilters={setFilters} activeFilterCount={0} clearFilters={vi.fn()}
      sortField="date" setSortField={vi.fn()} sortDirection="desc" setSortDirection={vi.fn()} resultCount={3}
    />,
  );
  return setFilters;
}

beforeEach(() => vi.resetAllMocks());

describe("SearchFilterBar — gateway filter", () => {
  it("offers the gateways the admin has configured, so a new one appears with no code change", () => {
    vi.mocked(useAdminGateways).mockReturnValue({ data: [{ code: "paystack" }, { code: "opay" }, { code: "flutterwave" }] } as ReturnType<typeof useAdminGateways>);
    bar();
    const select = gatewaySelect();
    const labels = Array.from(select.querySelectorAll("option")).map((o) => o.textContent);
    expect(labels).toEqual(["All Gateways", "Paystack", "OPay", "Flutterwave"]);
  });

  it("falls back to Paystack and OPay while the list loads or if it fails", () => {
    vi.mocked(useAdminGateways).mockReturnValue({ data: undefined } as ReturnType<typeof useAdminGateways>);
    bar();
    const labels = Array.from(gatewaySelect().querySelectorAll("option")).map((o) => o.textContent);
    expect(labels).toEqual(["All Gateways", "Paystack", "OPay"]);
  });

  it("choosing a gateway updates the filters, keeping the others", async () => {
    vi.mocked(useAdminGateways).mockReturnValue({ data: undefined } as ReturnType<typeof useAdminGateways>);
    const setFilters = bar({ ...EMPTY, status: "success" });
    await userEvent.selectOptions(gatewaySelect(), "opay");
    expect(setFilters).toHaveBeenCalledWith({ ...EMPTY, status: "success", gateway: "opay" });
  });
});

const tx = (o: Partial<AdminTransaction> = {}): AdminTransaction => ({
  id: "t1", reference: "ref-123", userId: "u1", type: "subscription", description: null, amountKobo: 500000,
  currency: "NGN", status: "success", channel: "card", createdAt: "2026-10-01T10:00:00Z", paidAt: null, ...o,
});

describe("TransactionRow", () => {
  it("shows which gateway took the payment", () => {
    render(<TransactionRow transaction={tx({ gateway: "opay" })} />);
    expect(screen.getByText("OPay")).toBeInTheDocument();
  });
  it("shows nothing extra for a row without a gateway (older API)", () => {
    render(<TransactionRow transaction={tx({ gateway: undefined })} />);
    expect(screen.queryByText("OPay")).toBeNull();
    expect(screen.queryByText("Paystack")).toBeNull();
  });
});
