import { describe, it, expect, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import type { BackendPlan } from "@/lib/api/billing";
import { cadenceLabel, describePlanPrice, formatKobo, koboToNaira, nairaToKobo, promoCountdown } from "./pricing";
import { parseAccessError } from "./errors";
import { checkoutOutcome, parseCheckoutReturn, redirectToCheckout } from "./checkout";

const NOW = new Date("2026-10-01T12:00:00Z");
const inHours = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();

const plan = (o: Partial<BackendPlan> = {}): BackendPlan => ({
  id: "p1", code: "standard-monthly", name: "Standard", description: null, tier: "standard",
  interval: "monthly", currency: "NGN", amountKobo: 500000, listAmountKobo: 500000,
  isPromo: false, promoLabel: null, promoEndsAt: null, discountPercent: 0,
  features: [], badge: null, isSelfServe: true, ...o,
});

describe("formatKobo", () => {
  it.each([
    [500000, "₦5,000"],
    [4800000, "₦48,000"],
    [250050, "₦2,500.50"],
    [0, "₦0"],
    [10000, "₦100"],
  ])("%i kobo → %s", (k, out) => expect(formatKobo(k)).toBe(out));
});

describe("cadenceLabel", () => {
  it("maps intervals and treats null (free) as no cadence", () => {
    expect(cadenceLabel("monthly")).toBe("/month");
    expect(cadenceLabel("annually")).toBe("/year");
    expect(cadenceLabel(null)).toBe("");
  });
});

describe("promoCountdown", () => {
  it("is null with no promo or once it has ended", () => {
    expect(promoCountdown(null, NOW)).toBeNull();
    expect(promoCountdown(inHours(-1), NOW)).toBeNull();
    expect(promoCountdown(inHours(0), NOW)).toBeNull();
  });
  it("counts hours under a day, and flags urgency", () => {
    expect(promoCountdown(inHours(5), NOW)).toMatchObject({ label: "Ends in 5 hours", urgent: true });
    expect(promoCountdown(inHours(0.5), NOW)).toMatchObject({ label: "Ends in under an hour", urgent: true });
    expect(promoCountdown(inHours(1), NOW)?.label).toBe("Ends in 1 hour");
  });
  it("rounds days UP so it never says 'ends in 0 days'", () => {
    expect(promoCountdown(inHours(25), NOW)).toMatchObject({ days: 2, label: "Ends in 2 days", urgent: true });
    expect(promoCountdown(inHours(24 * 3 + 1), NOW)).toMatchObject({ days: 4, urgent: false });
    expect(promoCountdown(inHours(24), NOW)?.label).toBe("Ends in 1 day");
  });
  it("survives garbage dates", () => {
    expect(promoCountdown("not-a-date", NOW)).toBeNull();
  });
});

describe("describePlanPrice", () => {
  it("shows the list price, no strike-through, for a normal plan", () => {
    expect(describePlanPrice(plan(), NOW)).toMatchObject({
      priceLabel: "₦5,000", struckPriceLabel: null, cadence: "/month", promoLive: false, isFree: false,
    });
  });
  it("shows promo price with the list price struck through", () => {
    const d = describePlanPrice(
      plan({ isPromo: true, amountKobo: 400000, discountPercent: 20, promoLabel: "Back to school", promoEndsAt: inHours(72) }), NOW);
    expect(d).toMatchObject({
      priceLabel: "₦4,000", struckPriceLabel: "₦5,000", discountPercent: 20,
      promoLabel: "Back to school", promoLive: true,
    });
    expect(d.countdown?.label).toBe("Ends in 3 days");
  });
  it("stops showing a promo the moment it lapses locally, even if the cached API response still says isPromo", () => {
    const d = describePlanPrice(plan({ isPromo: true, amountKobo: 400000, promoEndsAt: inHours(-1) }), NOW);
    expect(d).toMatchObject({ priceLabel: "₦5,000", struckPriceLabel: null, promoLive: false, discountPercent: 0 });
  });
  it("labels the free plan 'Free' and a contact-sales plan as such", () => {
    expect(describePlanPrice(plan({ tier: "free", interval: null, amountKobo: 0, listAmountKobo: 0 }), NOW))
      .toMatchObject({ priceLabel: "Free", isFree: true, cadence: "" });
    expect(describePlanPrice(plan({ tier: "enterprise", amountKobo: 0, listAmountKobo: 0, isSelfServe: false }), NOW))
      .toMatchObject({ contactSales: true, isFree: false });
  });
});

function axios403(data: unknown, status = 403): AxiosError {
  const err = new AxiosError("Request failed", "ERR_BAD_REQUEST");
  err.response = { status, data, statusText: "", headers: {}, config: { headers: new AxiosHeaders() } };
  return err;
}

describe("parseAccessError", () => {
  it("extracts the structured upgrade prompt", () => {
    expect(parseAccessError(axios403({
      statusCode: 403, code: "UPGRADE_REQUIRED", feature: "ai_tutor", requiredTier: "basic", quota: null,
      message: "AI Tutor is available on paid plans.",
    }))).toEqual({
      code: "UPGRADE_REQUIRED", feature: "ai_tutor", requiredTier: "basic", quota: null,
      message: "AI Tutor is available on paid plans.",
    });
  });
  it("carries quota details for an exhausted free allowance", () => {
    const quota = { limit: 5, used: 5, remaining: 0, period: "daily", resetsAt: "2026-10-01T23:00:00Z" };
    expect(parseAccessError(axios403({ code: "QUOTA_EXHAUSTED", feature: "ai_explain", requiredTier: "basic", quota, message: "x" }))?.quota)
      .toEqual(quota);
  });
  it.each([
    ["a plain permission 403 with no code", axios403({ statusCode: 403, message: "Forbidden resource" })],
    ["an unrelated code", axios403({ code: "SOMETHING_ELSE" })],
    ["a non-403 with a valid code", axios403({ code: "UPGRADE_REQUIRED" }, 429)],
    ["an empty body", axios403(undefined)],
    ["a non-axios error", new Error("boom")],
    ["a string", "nope"],
  ])("returns null for %s, so normal error handling still runs", (_n, e) => {
    expect(parseAccessError(e)).toBeNull();
  });
  it("supplies a safe default message if the server omitted one", () => {
    expect(parseAccessError(axios403({ code: "FEATURE_DISABLED", feature: "ai_tutor" }))?.message).toMatch(/isn't available/);
  });
});

describe("parseCheckoutReturn", () => {
  it("reads Paystack's return (?reference= or ?trxref=)", () => {
    expect(parseCheckoutReturn("?reference=abc")).toEqual({ reference: "abc", gateway: null, cancelled: false });
    expect(parseCheckoutReturn("?trxref=xyz&reference=abc").reference).toBe("abc");
    expect(parseCheckoutReturn("?trxref=xyz").reference).toBe("xyz");
  });
  it("reads OPay's return, including cancellation", () => {
    expect(parseCheckoutReturn("?reference=r1&gateway=opay")).toEqual({ reference: "r1", gateway: "opay", cancelled: false });
    expect(parseCheckoutReturn("?reference=r1&gateway=opay&cancelled=1").cancelled).toBe(true);
  });
  it("ignores an unknown gateway value rather than trusting it", () => {
    expect(parseCheckoutReturn("?reference=r1&gateway=evilpay").gateway).toBeNull();
  });
  it("accepts URLSearchParams and Next-style record objects", () => {
    expect(parseCheckoutReturn(new URLSearchParams("reference=a&gateway=paystack"))).toMatchObject({ reference: "a", gateway: "paystack" });
    expect(parseCheckoutReturn({ reference: ["first", "second"], gateway: "opay" })).toMatchObject({ reference: "first", gateway: "opay" });
  });
  it("returns nulls for a bare page load", () => {
    expect(parseCheckoutReturn("")).toEqual({ reference: null, gateway: null, cancelled: false });
    expect(parseCheckoutReturn("?reference=%20%20").reference).toBeNull();
  });
});

describe("checkoutOutcome", () => {
  it("only 'pending' keeps polling; abandoned/reversed are final (no infinite spinner)", () => {
    expect(checkoutOutcome("success")).toBe("success");
    expect(checkoutOutcome("pending")).toBe("pending");
    for (const s of ["failed", "abandoned", "reversed"] as const) expect(checkoutOutcome(s)).toBe("failed");
  });
});

describe("redirectToCheckout", () => {
  it("navigates to an https gateway URL", () => {
    const nav = vi.fn();
    redirectToCheckout("https://checkout.paystack.com/abc", nav);
    expect(nav).toHaveBeenCalledWith("https://checkout.paystack.com/abc");
  });
  it("allows http only for localhost (dev/sandbox)", () => {
    const nav = vi.fn();
    redirectToCheckout("http://localhost:4000/pay", nav);
    expect(nav).toHaveBeenCalled();
  });
  it.each(["javascript:alert(1)", "http://evil.example/pay", "data:text/html,x", "not a url", ""])(
    "refuses %p and never navigates",
    (bad) => {
      const nav = vi.fn();
      expect(() => redirectToCheckout(bad, nav)).toThrow();
      expect(nav).not.toHaveBeenCalled();
    },
  );
});

describe("nairaToKobo (admin price input)", () => {
  it.each([
    ["5000", 500000],
    ["19.99", 1999], // 19.99*100 === 1998.9999999999998 in floats; must round, not truncate
    ["0.29", 29],
    ["1,250", 125000],
    ["₦ 4,800", 480000],
    ["2500.5", 250050],
    ["0", 0],
  ])("%s → %i kobo", (input, kobo) => expect(nairaToKobo(input)).toBe(kobo));

  it.each(["", "abc", "-5", "12.345", "1e5", "5,000.", ".5", "9".repeat(20)])(
    "rejects %p instead of guessing", (bad) => expect(nairaToKobo(bad)).toBeNull());

  it("round-trips with koboToNaira", () => {
    for (const k of [1, 29, 1999, 250050, 500000]) expect(nairaToKobo(koboToNaira(k))).toBe(k);
  });
});
