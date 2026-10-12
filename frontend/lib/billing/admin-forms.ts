import type { AdminFeatureRule, CreatePlanInput, SetPromoInput, UpdateFeatureRuleInput } from "@/lib/api/billing-admin";
import type { BackendBillingInterval, BackendSubscriptionTier } from "@/lib/api/billing";
import { formatKobo, nairaToKobo } from "./pricing";

/** Result of validating an admin form: either a ready-to-send payload or a message to show. */
export type Built<T> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

/** A <input type="datetime-local"> value ("2026-10-05T18:00") → ISO, in the admin's local time. */
export function localToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Inverse, for pre-filling an input. */
export function isoToLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** "Free for the next N hours" quick action. */
export function freeForHours(hours: number, now: Date = new Date()): string {
  return new Date(now.getTime() + hours * 3_600_000).toISOString();
}

// ── plans ────────────────────────────────────────────────────────────────

export const GATEWAY_MIN_PROMO_KOBO = 10_000; // ₦100 — mirrors the backend floor

export function buildPromoInput(
  f: { priceNaira: string; label: string; endsAtLocal: string },
  listKobo: number,
  now: Date = new Date(),
): Built<SetPromoInput> {
  const kobo = nairaToKobo(f.priceNaira);
  if (kobo === null) return fail("Enter the promo price in naira, e.g. 3500 or 3499.50.");
  if (kobo < GATEWAY_MIN_PROMO_KOBO) return fail(`Promo price must be at least ${formatKobo(GATEWAY_MIN_PROMO_KOBO)}.`);
  if (kobo >= listKobo) return fail(`Promo price must be lower than the regular price (${formatKobo(listKobo)}).`);
  const ends = localToIso(f.endsAtLocal);
  if (!ends) return fail("Choose when the promo ends — every promo needs an end date.");
  if (new Date(ends) <= now) return fail("The promo must end in the future.");
  return { ok: true, value: { promoAmountKobo: kobo, promoEndsAt: ends, ...(f.label.trim() ? { promoLabel: f.label.trim() } : {}) } };
}

export function buildPriceUpdate(priceNaira: string): Built<{ amountKobo: number }> {
  const kobo = nairaToKobo(priceNaira);
  if (kobo === null || kobo <= 0) return fail("Enter a price above ₦0, e.g. 5000.");
  return { ok: true, value: { amountKobo: kobo } };
}

export interface NewPlanForm {
  code: string; name: string; tier: BackendSubscriptionTier; interval: BackendBillingInterval | "";
  priceNaira: string; featuresText: string; badge: string; isSelfServe: boolean; isPublic: boolean;
}

export function buildCreatePlan(f: NewPlanForm): Built<CreatePlanInput> {
  const code = f.code.trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code)) return fail('Code must be lowercase letters, numbers and dashes, e.g. "standard-monthly".');
  if (!f.name.trim()) return fail("Give the plan a name.");
  const free = f.tier === "free";
  if (!free && !f.interval) return fail("Choose a billing interval (monthly, quarterly or annually).");

  let amountKobo = 0;
  if (!free) {
    const k = nairaToKobo(f.priceNaira);
    if (k === null) return fail("Enter the price in naira, e.g. 5000.");
    if (k === 0 && f.isSelfServe) return fail('A self-serve plan needs a price above ₦0 (untick "Self-serve" for contact-sales plans).');
    amountKobo = k;
  }
  const features = f.featuresText.split("\n").map((s) => s.trim()).filter(Boolean);
  if (features.length > 12) return fail("At most 12 feature bullets.");

  return {
    ok: true,
    value: {
      code, name: f.name.trim(), tier: f.tier, amountKobo, features,
      ...(free ? {} : { interval: f.interval as BackendBillingInterval }),
      ...(f.badge.trim() ? { badge: f.badge.trim() } : {}),
      isSelfServe: f.isSelfServe, isPublic: f.isPublic,
    },
  };
}

// ── feature rules ────────────────────────────────────────────────────────

export interface FeatureRuleForm {
  mode: AdminFeatureRule["mode"];
  minTier: BackendSubscriptionTier | "";
  freeQuota: string;
  quotaPeriod: "daily" | "monthly" | "";
  freeUntilLocal: string;
}

export function ruleToForm(r: AdminFeatureRule): FeatureRuleForm {
  return {
    mode: r.mode,
    minTier: r.minTier ?? "",
    freeQuota: r.freeQuota ? String(r.freeQuota) : "",
    quotaPeriod: r.quotaPeriod ?? "",
    freeUntilLocal: r.promoActive ? isoToLocal(r.freeUntil) : "",
  };
}

export function buildFeatureRuleUpdate(f: FeatureRuleForm, now: Date = new Date()): Built<UpdateFeatureRuleInput> {
  if (f.mode !== "paid") return { ok: true, value: { mode: f.mode } }; // server clears the paid-only knobs

  if (!f.minTier || f.minTier === "free") return fail("Choose the lowest plan that gets this feature.");

  const out: UpdateFeatureRuleInput = { mode: "paid", minTier: f.minTier };

  const q = f.freeQuota.trim();
  if (q === "" || q === "0") {
    out.freeQuota = null;
  } else {
    if (!/^\d+$/.test(q) || Number(q) > 100000) return fail("Free uses must be a whole number, e.g. 5.");
    if (!f.quotaPeriod) return fail("Choose whether the free allowance resets daily or monthly.");
    out.freeQuota = Number(q);
    out.quotaPeriod = f.quotaPeriod;
  }

  if (f.freeUntilLocal) {
    const iso = localToIso(f.freeUntilLocal);
    if (!iso) return fail("That free-until date isn't valid.");
    if (new Date(iso) <= now) return fail("The free window must end in the future (or leave it blank to end it).");
    out.freeUntil = iso;
  } else {
    out.freeUntil = null; // blank = no promo
  }
  return { ok: true, value: out };
}
