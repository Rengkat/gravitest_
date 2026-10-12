import type { BackendSubscriptionTier } from "@/lib/api/billing";
import type { PublicFeatureRule } from "@/lib/api/entitlements";

/**
 * Builds the pricing page's "compare plans" table from the admin's live
 * free/paid rules, so the table can never disagree with what the product
 * actually does. Nothing here knows any feature's price or plan name.
 */
export type CompareCell =
  | { kind: "yes" }
  | { kind: "no" }
  | { kind: "text"; text: string };

const RANK: Record<BackendSubscriptionTier, number> = {
  free: 0, basic: 1, standard: 2, premium: 3, enterprise: 4,
};

export function compareCell(
  rule: PublicFeatureRule,
  tier: BackendSubscriptionTier,
  now: Date = new Date(),
): CompareCell {
  if (rule.mode === "disabled") return { kind: "text", text: "Paused" };
  if (rule.mode === "free") return { kind: "yes" };

  // paid
  if (rule.freeUntil && new Date(rule.freeUntil) > now) {
    const day = new Date(rule.freeUntil).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
    return { kind: "text", text: `Free until ${day}` };
  }
  const min = rule.minTier ?? "basic";
  if (RANK[tier] >= RANK[min]) return { kind: "yes" };
  if (rule.freeQuota && rule.freeQuota > 0 && rule.quotaPeriod) {
    return { kind: "text", text: `${rule.freeQuota} / ${rule.quotaPeriod === "monthly" ? "month" : "day"}` };
  }
  return { kind: "no" };
}

export interface CompareRow {
  key: string;
  label: string;
  note: string;
  cells: CompareCell[];
}

/** One row per feature, one cell per tier column (in the order given). */
export function buildCompareRows(
  rules: PublicFeatureRule[],
  tiers: BackendSubscriptionTier[],
  now: Date = new Date(),
): CompareRow[] {
  return rules.map((r) => ({
    key: r.featureKey,
    label: r.label,
    note: r.description,
    cells: tiers.map((t) => compareCell(r, t, now)),
  }));
}

/** Distinct tiers present in the catalogue, cheapest first. */
export function tierColumns(plans: { tier: BackendSubscriptionTier }[]): BackendSubscriptionTier[] {
  return [...new Set(plans.map((p) => p.tier))].sort((a, b) => RANK[a] - RANK[b]);
}
