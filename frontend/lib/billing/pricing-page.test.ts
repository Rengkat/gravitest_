import { describe, it, expect } from "vitest";
import type { BackendPlan } from "@/lib/api/billing";
import { availableBillings, buildPricingCards, maxAnnualSavingPercent, savingsPercent } from "./pricing-page";

let n = 0;
const P = (o: Partial<BackendPlan>): BackendPlan => ({
  id: `p${++n}`, code: `c${n}`, name: "Plan", description: null, tier: "standard", interval: "monthly", currency: "NGN",
  amountKobo: 500000, listAmountKobo: 500000, isPromo: false, promoLabel: null, promoEndsAt: null, discountPercent: 0,
  features: [], badge: null, isSelfServe: true, ...o,
});

// A realistic catalogue, matching what is seeded on first boot
const FREE = P({ id: "free", name: "Free", tier: "free", interval: null, amountKobo: 0, listAmountKobo: 0 });
const BASIC = P({ id: "basic", name: "Basic Monthly", tier: "basic", amountKobo: 250000, listAmountKobo: 250000 });
const STD_M = P({ id: "std-m", name: "Standard Monthly", tier: "standard", badge: "Most Popular" });
const STD_A = P({ id: "std-a", name: "Standard Annual", tier: "standard", interval: "annually", amountKobo: 4800000, listAmountKobo: 4800000 });
const PREM = P({ id: "prem", name: "Premium Monthly", tier: "premium", amountKobo: 900000, listAmountKobo: 900000 });
const ENT = P({ id: "ent", name: "Enterprise", tier: "enterprise", interval: "annually", amountKobo: 0, listAmountKobo: 0, isSelfServe: false });
const ALL = [ENT, PREM, STD_A, FREE, STD_M, BASIC]; // deliberately shuffled

describe("buildPricingCards", () => {
  it("one card per tier, ordered free → enterprise regardless of API order", () => {
    expect(buildPricingCards(ALL, "monthly").map((c) => c.plan.tier)).toEqual(["free", "basic", "standard", "premium", "enterprise"]);
  });

  it("the monthly/annual toggle swaps the plan within a tier", () => {
    expect(buildPricingCards(ALL, "monthly").find((c) => c.plan.tier === "standard")!.plan.id).toBe("std-m");
    expect(buildPricingCards(ALL, "annual").find((c) => c.plan.tier === "standard")!.plan.id).toBe("std-a");
  });

  it("a tier without the chosen period shows what it has (monthly-only tiers stay put under 'Annual')", () => {
    const basic = buildPricingCards(ALL, "annual").find((c) => c.plan.tier === "basic")!;
    expect(basic.plan.id).toBe("basic");
    expect(basic.chargeUnit).toBe("/mo");
  });

  it("an annual plan shows its per-month equivalent, the real charge, and the saving vs monthly", () => {
    const c = buildPricingCards(ALL, "annual").find((x) => x.plan.id === "std-a")!;
    expect(c.perMonthLabel).toBe("₦4,000"); // 48,000 / 12
    expect(c.chargeLabel).toBe("₦48,000");
    expect(c.billedLabel).toBe("Billed ₦48,000/year — save 20%"); // 1 - 48000/(12*5000)
    expect(c.chargeUnit).toBe("/yr");
    expect(c.saveVsMonthlyPercent).toBe(20);
  });

  it("monthly plans say so and claim no saving", () => {
    const c = buildPricingCards(ALL, "monthly").find((x) => x.plan.id === "std-m")!;
    expect(c).toMatchObject({ perMonthLabel: "₦5,000", billedLabel: "Billed monthly", saveVsMonthlyPercent: null });
  });

  it("free and contact-sales cards never pretend to have a price", () => {
    const cards = buildPricingCards(ALL, "monthly");
    expect(cards[0]).toMatchObject({ isFree: true, perMonthLabel: "₦0", billedLabel: "Forever free. No card needed." });
    expect(cards.at(-1)).toMatchObject({ contactSales: true, perMonthLabel: "Custom", billedLabel: "Custom pricing" });
  });

  it("the admin's badge is what makes a card 'popular' (nothing hardcoded)", () => {
    const cards = buildPricingCards(ALL, "monthly");
    expect(cards.filter((c) => c.popular).map((c) => c.plan.id)).toEqual(["std-m"]);
    expect(cards.find((c) => c.popular)!.badge).toBe("Most Popular");
    expect(buildPricingCards([FREE, BASIC], "monthly").some((c) => c.popular)).toBe(false);
  });

  it("a promo shows the discounted per-month price with the regular one struck through", () => {
    const promo = P({ id: "std-m", tier: "standard", amountKobo: 400000, listAmountKobo: 500000, isPromo: true, promoLabel: "Back to school", discountPercent: 20, promoEndsAt: "2026-10-10T00:00:00Z" });
    const c = buildPricingCards([FREE, promo], "monthly").find((x) => x.plan.id === "std-m")!;
    expect(c).toMatchObject({ perMonthLabel: "₦4,000", struckPerMonthLabel: "₦5,000", promoLabel: "Back to school", discountPercent: 20, chargeLabel: "₦4,000" });
  });

  it("an annual promo is normalised per month on BOTH prices", () => {
    const promo = P({ tier: "standard", interval: "annually", amountKobo: 3600000, listAmountKobo: 4800000, isPromo: true, discountPercent: 25 });
    const c = buildPricingCards([promo], "annual")[0];
    expect(c.perMonthLabel).toBe("₦3,000");
    expect(c.struckPerMonthLabel).toBe("₦4,000");
    expect(c.chargeLabel).toBe("₦36,000");
  });

  it("when a tier has a promo plan AND a regular twin for the same period, the promo plan is shown", () => {
    const regular = P({ id: "reg", tier: "basic" });
    const promo = P({ id: "promo", tier: "basic", isPromo: true, amountKobo: 200000, listAmountKobo: 250000, discountPercent: 20 });
    expect(buildPricingCards([regular, promo], "monthly")[0].plan.id).toBe("promo");
    expect(buildPricingCards([promo, regular], "monthly")[0].plan.id).toBe("promo");
  });

  it("a non-self-serve plan never displaces a sellable one in the same tier", () => {
    const custom = P({ id: "custom", tier: "premium", isSelfServe: false, amountKobo: 0, listAmountKobo: 0 });
    const c = buildPricingCards([custom, PREM], "monthly").find((x) => x.plan.tier === "premium")!;
    expect(c.plan.id).toBe("prem");
    expect(c.contactSales).toBe(false);
  });

  it("handles quarterly plans", () => {
    const q = P({ tier: "basic", interval: "quarterly", amountKobo: 650000, listAmountKobo: 650000 });
    const c = buildPricingCards([BASIC, q], "annual").find((x) => x.plan.tier === "basic")!;
    expect(c.plan.id).toBe("basic"); // no annual → falls back to monthly before quarterly
    const only = buildPricingCards([q], "monthly")[0];
    expect(only).toMatchObject({ chargeUnit: "/quarter", perMonthLabel: "₦2,167" });
    expect(only.billedLabel).toBe("Billed ₦6,500/quarter");
  });

  it("per-month figures for multi-month plans are whole naira; monthly plans keep exact kobo", () => {
    const annual = P({ tier: "standard", interval: "annually", amountKobo: 2000000, listAmountKobo: 2000000 }); // ₦20,000/yr
    expect(buildPricingCards([annual], "annual")[0].perMonthLabel).toBe("₦1,667"); // not ₦1,666.67 (matches the original page)
    const odd = P({ tier: "basic", amountKobo: 249950, listAmountKobo: 249950 });
    expect(buildPricingCards([odd], "monthly")[0].perMonthLabel).toBe("₦2,499.50");
  });

  it("an empty catalogue yields no cards (the page then shows its static fallback)", () => {
    expect(buildPricingCards([], "monthly")).toEqual([]);
  });
});

describe("savings and toggle availability", () => {
  it("savingsPercent compares list prices and ignores non-comparable plans", () => {
    expect(savingsPercent(STD_A, ALL)).toBe(20);
    expect(savingsPercent(STD_M, ALL)).toBeNull();
    expect(savingsPercent(P({ tier: "premium", interval: "annually", amountKobo: 10800000, listAmountKobo: 10800000 }), ALL)).toBeNull(); // no premium monthly twin
    expect(savingsPercent(P({ tier: "standard", interval: "annually", amountKobo: 6000000, listAmountKobo: 6000000 }), ALL)).toBeNull(); // dearer than monthly
  });
  it("uses LIST prices, so a monthly promo doesn't inflate the annual 'saving'", () => {
    const monthlyOnPromo = P({ id: "m", tier: "standard", amountKobo: 300000, listAmountKobo: 500000, isPromo: true });
    expect(savingsPercent(STD_A, [monthlyOnPromo, STD_A])).toBe(20);
  });
  it("maxAnnualSavingPercent powers the toggle pill; absent when there is nothing to claim", () => {
    expect(maxAnnualSavingPercent(ALL)).toBe(20);
    expect(maxAnnualSavingPercent([FREE, BASIC, STD_M])).toBeNull();
  });
  it("availableBillings tells the page whether to show a toggle at all", () => {
    expect(availableBillings(ALL)).toEqual({ monthly: true, annual: true });
    expect(availableBillings([FREE, BASIC])).toEqual({ monthly: true, annual: false });
    expect(availableBillings([FREE, ENT])).toEqual({ monthly: false, annual: false }); // contact-sales doesn't count
  });
});

import { lowestPerMonthKobo } from "./pricing-page";

describe("lowestPerMonthKobo (the paywall's 'from ₦X/mo')", () => {
  it("is the cheapest paid plan per month", () => {
    expect(lowestPerMonthKobo(ALL)).toBe(250000);
  });
  it("is promo-aware", () => {
    const promo = P({ tier: "basic", amountKobo: 150000, listAmountKobo: 250000, isPromo: true });
    expect(lowestPerMonthKobo([FREE, promo, STD_M])).toBe(150000);
  });
  it("compares annual plans by their per-month equivalent", () => {
    expect(lowestPerMonthKobo([FREE, STD_A, PREM])).toBe(400000); // 48,000/12 beats 9,000/mo
  });
  it("ignores free, contact-sales and unpriced plans", () => {
    expect(lowestPerMonthKobo([FREE, ENT])).toBeNull();
    expect(lowestPerMonthKobo([])).toBeNull();
  });
});
