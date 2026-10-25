import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const api = vi.hoisted(() => ({
  getTransactions: vi.fn(), getPaymentMethods: vi.fn(), getMySubscription: vi.fn(), getMySubscriptionHistory: vi.fn(),
  getPlans: vi.fn(), getMyUsage: vi.fn(), getPaymentGateways: vi.fn(),
}));
vi.mock("@/lib/api/billing", async (orig) => ({ ...(await orig<typeof import("@/lib/api/billing")>()), ...api }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

import { useBilling } from "../useBilling";

const PAYSTACK = { code: "paystack", displayName: "Paystack", isDefault: true, capabilities: { recurringCharge: true, savedCards: true, methods: ["Card"] } };
const OPAY = { code: "opay", displayName: "OPay", isDefault: false, capabilities: { recurringCharge: false, savedCards: false, methods: ["OPay wallet"] } };

beforeEach(() => {
  vi.resetAllMocks();
  api.getTransactions.mockResolvedValue({ data: [] });
  api.getPaymentMethods.mockResolvedValue([]);
  api.getMySubscription.mockResolvedValue(null);
  api.getMySubscriptionHistory.mockResolvedValue([]);
  api.getPlans.mockResolvedValue([]);
  api.getMyUsage.mockResolvedValue(null);
});

describe("useBilling — payment methods", () => {
  it("loads the offered gateways with the page", async () => {
    api.getPaymentGateways.mockResolvedValue([PAYSTACK, OPAY]);
    const { result } = renderHook(() => useBilling());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.gateways.map((g) => g.code)).toEqual(["paystack", "opay"]);
    expect(result.current.gatewaysFailed).toBe(false);
  });

  it("REGRESSION: a failing /billing/gateways is FLAGGED (it used to be swallowed), and the page still loads", async () => {
    api.getPaymentGateways.mockRejectedValue(new Error("500"));
    const { result } = renderHook(() => useBilling());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull(); // page itself is fine
    expect(result.current.gateways).toEqual([]);
    expect(result.current.gatewaysFailed).toBe(true);
  });

  it("REGRESSION: refreshGateways picks up a gateway an admin enabled AFTER the page loaded", async () => {
    api.getPaymentGateways.mockResolvedValueOnce([PAYSTACK]);
    const { result } = renderHook(() => useBilling());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.gateways).toHaveLength(1);

    api.getPaymentGateways.mockResolvedValueOnce([PAYSTACK, OPAY]); // admin switched OPay on
    await act(async () => { await result.current.refreshGateways(); });
    expect(result.current.gateways.map((g) => g.code)).toEqual(["paystack", "opay"]);
  });

  it("a failed refresh keeps the previous list and flags the failure; a later success clears it", async () => {
    api.getPaymentGateways.mockResolvedValueOnce([PAYSTACK, OPAY]);
    const { result } = renderHook(() => useBilling());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    api.getPaymentGateways.mockRejectedValueOnce(new Error("offline"));
    await act(async () => { await result.current.refreshGateways(); });
    expect(result.current.gateways).toHaveLength(2);
    expect(result.current.gatewaysFailed).toBe(true);

    api.getPaymentGateways.mockResolvedValueOnce([PAYSTACK, OPAY]);
    await act(async () => { await result.current.refreshGateways(); });
    expect(result.current.gatewaysFailed).toBe(false);
  });
});
