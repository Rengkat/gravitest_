import type { BackendPlan, BackendSubscriptionTier } from "@/lib/api/billing";
import { formatKobo } from "./pricing";

/**
 * Turns the admin-managed plan list into the cards of the public pricing page.
 *
 * Nothing here knows any plan's name or price: the page shows whatever the
 * admin has configured. Rules:
 *  - one card per access level (tier), so "Standard Monthly" and "Standard
 *    Annual" are one card that follows the monthly/annual toggle;
 *  - if a tier has no plan for the chosen billing period, its available plan is
 *    shown with its own cadence (e.g. a monthly-only tier under "Annual");
 *  - a plan running a promo wins over its regular twin;
 *  - non-self-serve plans (Enterprise) become "contact us" cards.
 */
export type Billing = "monthly" | "annual";

const TIER_ORDER: Record<BackendSubscriptionTier, number> = {
  free: 0, basic: 1, standard: 2, premium: 3, enterprise: 4,
};

export interface PricingCard {
  key: string;
  plan: BackendPlan;
  isFree: boolean;
  contactSales: boolean;
  /** Admin gave this plan a badge ("Most Popular"): render it highlighted. */
  popular: boolean;
  badge: string | null;
  /** "₦2,500" — headline price per MONTH (annual/quarterly plans show their monthly equivalent). */
  perMonthLabel: string;
  /** The price actually charged for the first period, "₦20,000". */
  chargeLabel: string;
  /** "Billed monthly" / "Billed ₦20,000/year — save 33%" / "Forever free…". */
  billedLabel: string;
  /** Regular per-month price, only while a promo is live. */
  struckPerMonthLabel: string | null;
  promoLabel: string | null;
  discountPercent: number;
  promoEndsAt: string | null;
  /** Short suffix for the CTA button: "/mo", "/yr", "/quarter". */
  chargeUnit: string;
  /** Percent saved vs paying monthly, for annual/quarterly plans with a monthly twin. */
  saveVsMonthlyPercent: number | null;
}

const MONTHS = { monthly: 1, quarterly: 3, annually: 12 } as const;
const UNIT = { monthly: "/mo", quarterly: "/quarter", annually: "/yr" } as const;
const BILLED = { monthly: "Billed monthly", quarterly: "every 3 months", annually: "year" } as const;

function pickPlan(candidates: BackendPlan[], billing: Billing): BackendPlan {
  const want = billing === "annual" ? "annually" : "monthly";
  const preferred = [want, "monthly", "annually", "quarterly"] as const; // fallback order
  for (const interval of preferred) {
    const matches = candidates.filter((p) => p.interval === interval);
    if (matches.length) return matches.find((p) => p.isPromo) ?? matches[0];
  }
  return candidates[0];
}

/** Percent saved by an annual/quarterly list price vs 12/3 monthly payments. null if not comparable. */
export function savingsPercent(plan: BackendPlan, all: BackendPlan[]): number | null {
  if (!plan.interval || plan.interval === "monthly") return null;
  const monthly = all.find((p) => p.tier === plan.tier && p.interval === "monthly" && p.isSelfServe);
  if (!monthly || monthly.listAmountKobo <= 0) return null;
  const full = monthly.listAmountKobo * MONTHS[plan.interval];
  const pct = Math.round((1 - plan.listAmountKobo / full) * 100);
  return pct > 0 ? pct : null;
}

export function availableBillings(plans: BackendPlan[]): { monthly: boolean; annual: boolean } {
  const paid = plans.filter((p) => p.isSelfServe && p.tier !== "free");
  return {
    monthly: paid.some((p) => p.interval === "monthly"),
    annual: paid.some((p) => p.interval === "annually"),
  };
}

/** The biggest annual saving across tiers, for the toggle's "Save N%" pill. null = don't show one. */
export function maxAnnualSavingPercent(plans: BackendPlan[]): number | null {
  const savings = plans
    .filter((p) => p.interval === "annually" && p.isSelfServe)
    .map((p) => savingsPercent(p, plans))
    .filter((n): n is number => n !== null);
  return savings.length ? Math.max(...savings) : null;
}

/**
 * The cheapest self-serve paid price per month across the catalogue (promo-aware),
 * for "from ₦X/mo" copy. null when nothing is for sale. Multi-month plans are
 * normalised per month and rounded to whole naira, like the pricing cards.
 */
export function lowestPerMonthKobo(plans: BackendPlan[]): number | null {
  const prices = plans
    .filter((p) => p.isSelfServe && p.tier !== "free" && p.interval && p.amountKobo > 0)
    .map((p) => {
      const months = MONTHS[p.interval!];
      return months === 1 ? p.amountKobo : Math.round(p.amountKobo / months / 100) * 100;
    });
  return prices.length ? Math.min(...prices) : null;
}

export function buildPricingCards(plans: BackendPlan[], billing: Billing): PricingCard[] {
  const byTier = new Map<BackendSubscriptionTier, BackendPlan[]>();
  for (const p of plans) byTier.set(p.tier, [...(byTier.get(p.tier) ?? []), p]);

  const cards: PricingCard[] = [];
  for (const [tier, candidates] of byTier) {
    const sellable = candidates.filter((p) => p.isSelfServe);
    const plan = pickPlan(sellable.length ? sellable : candidates, billing);
    const isFree = tier === "free";
    const contactSales = !plan.isSelfServe;
    const months = plan.interval ? MONTHS[plan.interval] : 1;

    // What is charged now vs the regular price, both normalised to per-month.
    // A per-month figure for a multi-month plan is an approximation, so it is
    // rounded to whole naira ("₦1,667", not "₦1,666.67"); a monthly plan keeps
    // its exact price (admins may legitimately price at ₦2,499.50). The exact
    // amount actually charged is always shown separately.
    const chargeKobo = plan.amountKobo;
    const perMonth = (kobo: number) => (months === 1 ? kobo : Math.round(kobo / months / 100) * 100);
    const perMonthKobo = perMonth(chargeKobo);
    const perMonthListKobo = perMonth(plan.listAmountKobo);
    const save = savingsPercent(plan, plans);

    let billedLabel: string;
    if (isFree) billedLabel = "Forever free. No card needed.";
    else if (contactSales) billedLabel = "Custom pricing";
    else if (plan.interval === "monthly" || !plan.interval) billedLabel = BILLED.monthly;
    else {
      const per = plan.interval === "annually" ? "year" : "3 months";
      billedLabel = `Billed ${formatKobo(chargeKobo, plan.currency)}/${per === "year" ? "year" : "quarter"}${save ? ` — save ${save}%` : ""}`;
    }

    cards.push({
      key: plan.id,
      plan,
      isFree,
      contactSales,
      popular: !!plan.badge,
      badge: plan.badge,
      perMonthLabel: isFree ? "₦0" : contactSales ? "Custom" : formatKobo(perMonthKobo, plan.currency),
      chargeLabel: formatKobo(chargeKobo, plan.currency),
      billedLabel,
      struckPerMonthLabel: plan.isPromo && !isFree ? formatKobo(perMonthListKobo, plan.currency) : null,
      promoLabel: plan.isPromo ? plan.promoLabel : null,
      discountPercent: plan.isPromo ? plan.discountPercent : 0,
      promoEndsAt: plan.isPromo ? plan.promoEndsAt : null,
      chargeUnit: plan.interval ? UNIT[plan.interval] : "",
      saveVsMonthlyPercent: save,
    });
  }
  return cards.sort((a, b) => TIER_ORDER[a.plan.tier] - TIER_ORDER[b.plan.tier]);
}
