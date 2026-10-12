import { describe, it, expect } from "vitest";
import type { PublicFeatureRule } from "@/lib/api/entitlements";
import { buildCompareRows, compareCell, tierColumns } from "./compare";

const rule = (o: Partial<PublicFeatureRule> = {}): PublicFeatureRule => ({
  featureKey: "ai_explain", label: "AI Explain", description: "d",
  mode: "paid", minTier: "basic", freeQuota: null, quotaPeriod: null, freeUntil: null, ...o,
});
const NOW = new Date("2026-10-04T12:00:00Z");

describe("compareCell", () => {
  it("free feature: included on every plan", () => {
    expect(compareCell(rule({ mode: "free", minTier: null }), "free", NOW)).toEqual({ kind: "yes" });
  });
  it("paid feature: included from minTier up, not below", () => {
    const r = rule({ minTier: "standard" });
    expect(compareCell(r, "free", NOW)).toEqual({ kind: "no" });
    expect(compareCell(r, "basic", NOW)).toEqual({ kind: "no" });
    expect(compareCell(r, "standard", NOW)).toEqual({ kind: "yes" });
    expect(compareCell(r, "premium", NOW)).toEqual({ kind: "yes" });
  });
  it("a free allowance shows as a number for plans below minTier", () => {
    const r = rule({ freeQuota: 5, quotaPeriod: "daily" });
    expect(compareCell(r, "free", NOW)).toEqual({ kind: "text", text: "5 / day" });
    expect(compareCell(rule({ freeQuota: 20, quotaPeriod: "monthly" }), "free", NOW)).toEqual({ kind: "text", text: "20 / month" });
    expect(compareCell(r, "basic", NOW)).toEqual({ kind: "yes" });
  });
  it("a running free promo shows an end date; an ended one is ignored", () => {
    const live = compareCell(rule({ freeUntil: "2026-10-10T00:00:00Z" }), "free", NOW);
    expect(live.kind).toBe("text");
    expect((live as { text: string }).text).toMatch(/^Free until /);
    expect(compareCell(rule({ freeUntil: "2026-10-01T00:00:00Z" }), "free", NOW)).toEqual({ kind: "no" });
  });
  it("a switched-off feature shows as paused for everyone", () => {
    expect(compareCell(rule({ mode: "disabled" }), "premium", NOW)).toEqual({ kind: "text", text: "Paused" });
  });
});

describe("table building", () => {
  it("one row per feature, one cell per column, in order", () => {
    const rows = buildCompareRows([rule(), rule({ featureKey: "cbt_mock", mode: "free", minTier: null })], ["free", "basic"], NOW);
    expect(rows).toHaveLength(2);
    expect(rows[0].cells).toEqual([{ kind: "no" }, { kind: "yes" }]);
    expect(rows[1].cells).toEqual([{ kind: "yes" }, { kind: "yes" }]);
  });
  it("columns are the distinct tiers, cheapest first", () => {
    expect(tierColumns([{ tier: "premium" }, { tier: "free" }, { tier: "standard" }, { tier: "standard" }])).toEqual(["free", "standard", "premium"]);
  });
});
