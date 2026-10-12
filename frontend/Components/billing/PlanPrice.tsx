import type { BackendPlan } from "@/lib/api/billing";
import { describePlanPrice } from "@/lib/billing/pricing";

/**
 * A plan's price, promo-aware. Renders whatever the API says the plan costs
 * today — plans are admin-editable, so never hardcode a price or a promo.
 */
export default function PlanPrice({ plan, now }: { plan: BackendPlan; now?: Date }) {
  const d = describePlanPrice(plan, now);

  if (d.contactSales) {
    return <p className="font-serif text-2xl text-green-800">Contact us</p>;
  }

  return (
    <div>
      {d.promoLive && (
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] text-green-900">
            {d.promoLabel ?? "Limited offer"} · {d.discountPercent}% off
          </span>
          {d.countdown && (
            <span className={`text-xs ${d.countdown.urgent ? "font-semibold text-red-700" : "text-green-800/70"}`}>
              {d.countdown.label}
            </span>
          )}
        </div>
      )}
      <p className="flex items-baseline gap-2">
        <span className="font-serif text-3xl text-green-900">{d.priceLabel}</span>
        {d.cadence && <span className="text-sm text-green-800/70">{d.cadence}</span>}
        {d.struckPriceLabel && (
          <s aria-label={`Regular price ${d.struckPriceLabel}`} className="text-sm text-green-800/50">
            {d.struckPriceLabel}
          </s>
        )}
      </p>
      {d.promoLive && (
        <p className="mt-1 text-xs text-green-800/60">
          Offer price applies to your first payment. Renewals are at {d.struckPriceLabel}.
        </p>
      )}
    </div>
  );
}
