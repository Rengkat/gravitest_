import type { BackendBillingInterval, BackendPlan } from "@/lib/api/billing";

/** ₦5,000 from 500000 kobo. Whole naira shows no decimals; ₦2,500.50 keeps them. */
export function formatKobo(kobo: number, currency = "NGN"): string {
  const major = kobo / 100;
  const symbol = currency === "NGN" ? "₦" : `${currency} `;
  return (
    symbol +
    major.toLocaleString("en-NG", {
      minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

const CADENCE: Record<BackendBillingInterval, string> = {
  monthly: "/month",
  quarterly: "/quarter",
  annually: "/year",
};

/** "/month", "/year", or "" for plans that are not billed (free). */
export function cadenceLabel(interval: BackendBillingInterval | null): string {
  return interval ? CADENCE[interval] : "";
}

export interface PromoCountdown {
  /** Whole days left, rounded UP (so "ends in 1 day" until it has really ended). */
  days: number;
  label: string;
  /** Under 48h: worth showing urgency styling. */
  urgent: boolean;
}

/** Human countdown to the end of a promo, or null if there's no live promo. */
export function promoCountdown(
  promoEndsAt: string | null,
  now: Date = new Date(),
): PromoCountdown | null {
  if (!promoEndsAt) return null;
  const ms = new Date(promoEndsAt).getTime() - now.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;

  const hours = ms / 3_600_000;
  if (hours < 1) return { days: 1, label: "Ends in under an hour", urgent: true };
  if (hours < 24) {
    const h = Math.ceil(hours);
    return { days: 1, label: `Ends in ${h} hour${h === 1 ? "" : "s"}`, urgent: true };
  }
  const days = Math.ceil(hours / 24);
  return { days, label: `Ends in ${days} day${days === 1 ? "" : "s"}`, urgent: hours < 48 };
}

/**
 * What to show for a plan's price. Derived from the API only — plans are
 * admin-editable, so nothing here (or in any component) may hardcode a plan.
 */
export function describePlanPrice(plan: BackendPlan, now: Date = new Date()) {
  const free = plan.amountKobo === 0 && plan.isSelfServe;
  // Trust the server's isPromo, but never render a "promo" that has already
  // lapsed in this browser's clock while the cached response was in flight.
  const countdown = plan.isPromo ? promoCountdown(plan.promoEndsAt, now) : null;
  const promoLive = plan.isPromo && (plan.promoEndsAt === null || countdown !== null);

  return {
    isFree: free,
    contactSales: !plan.isSelfServe,
    price: promoLive ? plan.amountKobo : plan.listAmountKobo,
    priceLabel: free
      ? "Free"
      : formatKobo(promoLive ? plan.amountKobo : plan.listAmountKobo, plan.currency),
    /** Struck-through list price, only while a promo is live. */
    struckPriceLabel: promoLive ? formatKobo(plan.listAmountKobo, plan.currency) : null,
    cadence: cadenceLabel(plan.interval),
    discountPercent: promoLive ? plan.discountPercent : 0,
    promoLabel: promoLive ? plan.promoLabel : null,
    countdown: promoLive ? countdown : null,
    promoLive,
  };
}

/**
 * Admin input: naira string → integer kobo. Rounds (never truncates) so
 * "19.99" is 1999 kobo, not 1998 from float error. Returns null for anything
 * that isn't a finite, non-negative amount with at most 2 decimals.
 */
export function nairaToKobo(input: string): number | null {
  const s = input.replace(/[₦,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const kobo = Math.round(parseFloat(s) * 100);
  return Number.isSafeInteger(kobo) ? kobo : null;
}

/** integer kobo → the plain number a naira input should show ("5000", "2500.5"). */
export function koboToNaira(kobo: number): string {
  return String(kobo / 100);
}
