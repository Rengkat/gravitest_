import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search),
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard/billing",
}));

const hook = vi.fn();
vi.mock("../useBilling", () => ({ useBilling: () => hook() }));
// Only the modal's open state matters here; stub the heavy children.
vi.mock("../components/PlanComparison", () => ({
  default: ({ isOpen, onClose, gatewaysError }: { isOpen: boolean; onClose: () => void; gatewaysError?: boolean }) => (
    <div data-testid="plan-modal">{isOpen ? "open" : "closed"}{gatewaysError ? " gateways-error" : ""}<button onClick={onClose}>close-modal</button></div>
  ),
}));
vi.mock("../components/CurrentPlanCard", () => ({ default: () => <div /> }));
vi.mock("../components/UsageStats", () => ({ default: () => <div /> }));
vi.mock("../components/PaymentMethods", () => ({ default: () => <div /> }));
vi.mock("../components/TransactionHistory", () => ({ default: () => <div /> }));
vi.mock("../components/HistorySections", () => ({ SubscriptionHistory: () => <div />, ContentPurchases: () => <div /> }));
vi.mock("../components/InvoicesSection", () => ({ default: () => <div /> }));

import BillingClientPage from "../components/BillingClientPage";

const loaded = (over: Record<string, unknown> = {}) => ({
  isLoading: false, error: null, reload: vi.fn(), subscription: null, transactions: [], contentPurchases: [],
  paymentMethods: [], subscriptionHistory: [], plans: [{ planId: "p1" }], gateways: [], gatewaysFailed: false, refreshGateways: vi.fn(), usage: null,
  resendReceipt: vi.fn(), setDefaultCard: vi.fn(), removeCard: vi.fn(), subscribe: vi.fn(), cancelSubscription: vi.fn(), ...over,
});

beforeEach(() => { replace.mockReset(); hook.mockReset(); search = ""; });

describe("billing page: ?upgrade=1 (sent by the library paywall and 'View Plans' links)", () => {
  it("opens the plan chooser once loaded", () => {
    search = "upgrade=1"; hook.mockReturnValue(loaded());
    render(<BillingClientPage />);
    expect(screen.getByTestId("plan-modal")).toHaveTextContent("open");
  });

  it("closing it drops the parameter (so a refresh doesn't reopen it) and it stays closed — even while the URL change is still in flight", async () => {
    search = "upgrade=1"; hook.mockReturnValue(loaded());
    render(<BillingClientPage />); // replace() is a no-op mock: the param is STILL in the URL
    await userEvent.click(screen.getByText("close-modal"));
    expect(replace).toHaveBeenCalledWith("/dashboard/billing", { scroll: false });
    expect(screen.getByTestId("plan-modal")).toHaveTextContent("closed");
  });

  it("closing a chooser opened by a normal button click leaves the URL alone", async () => {
    hook.mockReturnValue(loaded());
    render(<BillingClientPage />);
    await userEvent.click(screen.getByText("close-modal"));
    expect(replace).not.toHaveBeenCalled();
  });

  it("waits for the data: no premature open and no premature URL cleanup while loading", () => {
    search = "upgrade=1"; hook.mockReturnValue(loaded({ isLoading: true }));
    render(<BillingClientPage />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByTestId("plan-modal")).toHaveTextContent("closed"); // still closed while loading
  });

  it("opens after loading finishes (not lost if it arrives later)", () => {
    search = "upgrade=1"; hook.mockReturnValue(loaded({ isLoading: true }));
    const { rerender } = render(<BillingClientPage />);
    hook.mockReturnValue(loaded());
    rerender(<BillingClientPage />);
    expect(screen.getByTestId("plan-modal")).toHaveTextContent("open");
  });

  it("is a no-op without the parameter", () => {
    hook.mockReturnValue(loaded());
    render(<BillingClientPage />);
    expect(screen.getByTestId("plan-modal")).toHaveTextContent("closed");
    expect(replace).not.toHaveBeenCalled();
  });

  it("ignores other values of the parameter", () => {
    search = "upgrade=0"; hook.mockReturnValue(loaded());
    render(<BillingClientPage />);
    expect(screen.getByTestId("plan-modal")).toHaveTextContent("closed");
    expect(replace).not.toHaveBeenCalled();
  });

  it("with no plans to show it does not open an empty chooser, but still cleans the URL", () => {
    search = "upgrade=1"; hook.mockReturnValue(loaded({ plans: [] }));
    render(<BillingClientPage />);
    expect(screen.getByTestId("plan-modal")).toHaveTextContent("closed");
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("re-renders don't re-clean the URL or flip the chooser", () => {
    search = "upgrade=1"; hook.mockReturnValue(loaded());
    const { rerender } = render(<BillingClientPage />);
    rerender(<BillingClientPage />); rerender(<BillingClientPage />);
    expect(screen.getByTestId("plan-modal")).toHaveTextContent("open");
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("billing page: always offers the CURRENT payment methods", () => {
  it("re-reads the payment methods when the plan chooser opens (an admin may have enabled one since page load)", () => {
    const refreshGateways = vi.fn();
    search = "upgrade=1"; hook.mockReturnValue(loaded({ refreshGateways }));
    render(<BillingClientPage />);
    expect(refreshGateways).toHaveBeenCalledTimes(1);
  });

  it("does not refresh while the chooser is closed", () => {
    const refreshGateways = vi.fn();
    hook.mockReturnValue(loaded({ refreshGateways }));
    render(<BillingClientPage />);
    expect(refreshGateways).not.toHaveBeenCalled();
  });

  it("tells the chooser when the payment methods could not be loaded", () => {
    search = "upgrade=1"; hook.mockReturnValue(loaded({ gatewaysFailed: true }));
    render(<BillingClientPage />);
    expect(screen.getByTestId("plan-modal")).toHaveTextContent("gateways-error");
  });
});
