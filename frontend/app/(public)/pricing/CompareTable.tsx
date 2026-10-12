"use client";

import { Check, Minus } from "lucide-react";
import { usePlans } from "@/lib/hooks/useBilling";
import { useFeatureCatalog } from "@/lib/hooks/useFeatureCatalog";
import { buildPricingCards } from "@/lib/billing/pricing-page";
import { buildCompareRows, tierColumns, type CompareCell } from "@/lib/billing/compare";

/* ─── Cell renderer ──────────────────────────────────────────────────────── */
function Cell({ cell, highlight }: { cell: CompareCell; highlight: boolean }) {
  if (cell.kind === "text") {
    return (
      <span className={highlight ? "text-green-800 font-semibold text-sm" : "text-text-muted text-sm"}>
        {cell.text}
      </span>
    );
  }
  if (cell.kind === "yes") {
    return (
      <div className="flex justify-center" role="img" aria-label="Included">
        <Check size={17} strokeWidth={2.5} className="text-green-600" />
      </div>
    );
  }
  return (
    <div className="flex justify-center" role="img" aria-label="Not included">
      <Minus size={16} strokeWidth={2} className="text-text-light" />
    </div>
  );
}

/**
 * "Compare plans" — generated from the admin's live plans and free/paid rules,
 * so it can never promise something the product doesn't do. If either list
 * can't be loaded the section simply doesn't render (no stale promises).
 */
export default function CompareTable() {
  const { data: plans } = usePlans();
  const { data: rules } = useFeatureCatalog();
  if (!plans?.length || !rules?.length) return null;

  const tiers = tierColumns(plans);
  const cards = buildPricingCards(plans, "monthly");
  const headerFor = (tier: string) => cards.find((c) => c.plan.tier === tier);
  const rows = buildCompareRows(rules, tiers);

  return (
    <section className="px-[5%] py-[100px]">
      <h2
        className="font-serif text-green-900 text-center tracking-[-0.8px] mb-3"
        style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}>
        Compare plans in detail
      </h2>
      <p className="text-base text-text-muted text-center mb-14">Every feature, side by side. No surprises.</p>

      <div className="overflow-x-auto">
        <table className="w-full max-w-[860px] mx-auto border-collapse">
          <thead>
            <tr>
              <th className="px-6 py-5 text-left" />
              {tiers.map((t) => {
                const card = headerFor(t);
                const popular = !!card?.popular;
                return (
                  <th key={t} className="p-0 text-center">
                    <div className={popular ? "bg-green-800 rounded-[16px_16px_0_0] px-4 py-5" : "px-4 py-5"}>
                      <div
                        className={`text-[11px] font-bold tracking-[0.1em] uppercase mb-1 ${
                          popular ? "text-white/60" : "text-text-muted"
                        }`}>
                        {card?.plan.name ?? t}
                      </div>
                      <div className={`font-serif text-[20px] ${popular ? "text-white" : "text-green-900"}`}>
                        {card?.contactSales ? "Custom" : card?.perMonthLabel}
                        {card && !card.contactSales && !card.isFree && (
                          <span
                            className={`font-sans text-sm font-medium ${popular ? "text-white/50" : "text-text-muted"}`}>
                            /mo
                          </span>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={row.key}
                className={`border-b border-cream-border transition-colors duration-150 hover:bg-green-800/[0.02] ${
                  ri === rows.length - 1 ? "border-b-0" : ""
                }`}>
                <td className="px-6 py-[14px] text-[13.5px] font-medium text-text-main">
                  {row.label}
                  <span className="block text-[11px] text-text-light mt-0.5">{row.note}</span>
                </td>
                {row.cells.map((cell, ci) => {
                  const popular = !!headerFor(tiers[ci])?.popular;
                  return (
                    <td
                      key={tiers[ci]}
                      className={`px-4 py-[14px] text-[13.5px] text-center ${popular ? "bg-green-800/[0.04]" : ""}`}>
                      <Cell cell={cell} highlight={popular} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mx-auto mt-6 max-w-[860px] text-center text-[12.5px] text-text-light">
        Some library books and resources are sold individually. You can buy them on any plan, including Free.
      </p>
    </section>
  );
}
