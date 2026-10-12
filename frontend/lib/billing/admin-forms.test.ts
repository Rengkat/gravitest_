import { describe, it, expect } from "vitest";
import type { AdminFeatureRule } from "@/lib/api/billing-admin";
import {
  buildCreatePlan, buildFeatureRuleUpdate, buildPromoInput, freeForHours, isoToLocal, localToIso, ruleToForm,
} from "./admin-forms";

const NOW = new Date("2026-10-01T12:00:00Z");

describe("buildPromoInput", () => {
  const ok = { priceNaira: "3500", label: " Back to school ", endsAtLocal: "2026-10-10T18:00" };

  it("converts naira to kobo, trims the label, and sends an ISO end date", () => {
    const r = buildPromoInput(ok, 500000, NOW);
    expect(r).toMatchObject({ ok: true, value: { promoAmountKobo: 350000, promoLabel: "Back to school" } });
    if (r.ok) expect(new Date(r.value.promoEndsAt).getTime()).toBeGreaterThan(NOW.getTime());
  });
  it("omits an empty label instead of sending an empty string", () => {
    const r = buildPromoInput({ ...ok, label: "  " }, 500000, NOW);
    expect(r.ok && "promoLabel" in r.value).toBe(false);
  });
  it.each([
    ["not a number", { priceNaira: "abc" }, /naira/],
    ["equal to the list price", { priceNaira: "5000" }, /lower than the regular price/],
    ["above the list price", { priceNaira: "9000" }, /lower than the regular price/],
    ["below the ₦100 gateway floor", { priceNaira: "50" }, /at least ₦100/],
    ["no end date", { endsAtLocal: "" }, /end date/],
    ["already in the past", { endsAtLocal: "2026-09-01T10:00" }, /future/],
  ])("rejects a promo that is %s, with a message an admin can act on", (_n, patch, msg) => {
    const r = buildPromoInput({ ...ok, ...patch }, 500000, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(msg);
  });
});

describe("buildCreatePlan", () => {
  const base = { code: "standard-monthly", name: "Standard", tier: "standard" as const, interval: "monthly" as const, priceNaira: "5000", featuresText: "A\n\n B \n", badge: "", isSelfServe: true, isPublic: true };

  it("builds a paid plan: kobo price, cleaned feature bullets, no empty badge", () => {
    expect(buildCreatePlan(base)).toEqual({
      ok: true,
      value: { code: "standard-monthly", name: "Standard", tier: "standard", interval: "monthly", amountKobo: 500000, features: ["A", "B"], isSelfServe: true, isPublic: true },
    });
  });
  it("a free plan needs no interval or price", () => {
    const r = buildCreatePlan({ ...base, code: "free", tier: "free", interval: "", priceNaira: "" });
    expect(r).toMatchObject({ ok: true, value: { amountKobo: 0 } });
    if (r.ok) expect("interval" in r.value).toBe(false);
  });
  it("allows a ₦0 placeholder only for contact-sales plans", () => {
    expect(buildCreatePlan({ ...base, priceNaira: "0" }).ok).toBe(false);
    expect(buildCreatePlan({ ...base, priceNaira: "0", isSelfServe: false }).ok).toBe(true);
  });
  it.each([
    ["an uppercase/spaced code", { code: "Standard Monthly" }],
    ["a blank name", { name: " " }],
    ["a paid plan without an interval", { interval: "" as const }],
    ["a bad price", { priceNaira: "5k" }],
    ["13 feature bullets", { featuresText: Array.from({ length: 13 }, (_, i) => `f${i}`).join("\n") }],
  ])("rejects %s", (_n, patch) => expect(buildCreatePlan({ ...base, ...patch }).ok).toBe(false));
});

const rule = (o: Partial<AdminFeatureRule> = {}): AdminFeatureRule => ({
  featureKey: "ai_tutor", label: "AI Tutor", description: "", enforcement: "", supportedModes: ["free", "paid", "disabled"],
  mode: "paid", minTier: "basic", freeQuota: null, quotaPeriod: null, freeUntil: null, promoActive: false, updatedBy: null, updatedAt: null, ...o,
});

describe("buildFeatureRuleUpdate", () => {
  const paid = { mode: "paid" as const, minTier: "basic" as const, freeQuota: "", quotaPeriod: "" as const, freeUntilLocal: "" };

  it("free / disabled send only the mode (the server clears paid-only settings)", () => {
    expect(buildFeatureRuleUpdate({ ...paid, mode: "free" })).toEqual({ ok: true, value: { mode: "free" } });
    expect(buildFeatureRuleUpdate({ ...paid, mode: "disabled" })).toEqual({ ok: true, value: { mode: "disabled" } });
  });
  it("paid: sends tier, and EXPLICITLY nulls the quota and promo when blank (so removing them actually removes them)", () => {
    expect(buildFeatureRuleUpdate(paid)).toEqual({ ok: true, value: { mode: "paid", minTier: "basic", freeQuota: null, freeUntil: null } });
  });
  it("paid + free allowance needs a period", () => {
    expect(buildFeatureRuleUpdate({ ...paid, freeQuota: "5", quotaPeriod: "daily" })).toMatchObject({ ok: true, value: { freeQuota: 5, quotaPeriod: "daily" } });
    expect(buildFeatureRuleUpdate({ ...paid, freeQuota: "5" }).ok).toBe(false);
  });
  it("0 removes the allowance", () => {
    expect(buildFeatureRuleUpdate({ ...paid, freeQuota: "0", quotaPeriod: "daily" })).toMatchObject({ ok: true, value: { freeQuota: null } });
  });
  it.each(["-1", "2.5", "abc", "1000000"])("rejects free uses %p", (q) =>
    expect(buildFeatureRuleUpdate({ ...paid, freeQuota: q, quotaPeriod: "daily" }).ok).toBe(false));
  it("paid needs a real minimum plan", () => {
    expect(buildFeatureRuleUpdate({ ...paid, minTier: "" }).ok).toBe(false);
    expect(buildFeatureRuleUpdate({ ...paid, minTier: "free" }).ok).toBe(false);
  });
  it("a free window must end in the future", () => {
    expect(buildFeatureRuleUpdate({ ...paid, freeUntilLocal: "2026-09-01T10:00" }, NOW).ok).toBe(false);
    const r = buildFeatureRuleUpdate({ ...paid, freeUntilLocal: "2026-10-05T10:00" }, NOW);
    expect(r).toMatchObject({ ok: true });
    if (r.ok) expect(typeof r.value.freeUntil).toBe("string");
  });
});

describe("ruleToForm", () => {
  it("prefills a running promo, but not an expired one", () => {
    expect(ruleToForm(rule({ promoActive: true, freeUntil: "2026-10-05T10:00:00Z" })).freeUntilLocal).not.toBe("");
    expect(ruleToForm(rule({ promoActive: false, freeUntil: "2026-09-01T10:00:00Z" })).freeUntilLocal).toBe("");
  });
  it("prefills quota and tier", () => {
    expect(ruleToForm(rule({ freeQuota: 5, quotaPeriod: "monthly", minTier: "standard" }))).toMatchObject({ freeQuota: "5", quotaPeriod: "monthly", minTier: "standard" });
  });
});

describe("date helpers", () => {
  it("freeForHours adds hours to now", () => {
    expect(freeForHours(24, NOW)).toBe("2026-10-02T12:00:00.000Z");
  });
  it("localToIso/isoToLocal round-trip and reject junk", () => {
    const iso = localToIso("2026-10-05T18:30")!;
    expect(isoToLocal(iso)).toBe("2026-10-05T18:30");
    expect(localToIso("")).toBeNull();
    expect(localToIso("garbage")).toBeNull();
    expect(isoToLocal(null)).toBe("");
  });
});
