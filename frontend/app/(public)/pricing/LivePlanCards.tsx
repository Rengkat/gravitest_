"use client";

import Link from "next/link";
import { GraduationCap, Mail, Star, Zap } from "lucide-react";
import type { PricingCard } from "@/lib/billing/pricing-page";
import { promoCountdown } from "@/lib/billing/pricing";
import FeatureRow from "./FeatureRow";

const SALES_EMAIL = "support@gravitest.ng";

/** Grid sizing that keeps 1–4 cards centred and readable. */
function gridClass(n: number): string {
  if (n <= 1) return "max-w-[360px]";
  if (n === 2) return "md:grid-cols-2 max-w-[720px]";
  if (n === 3) return "md:grid-cols-2 lg:grid-cols-3 max-w-[1040px]";
  return "md:grid-cols-2 lg:grid-cols-4 max-w-[1200px]";
}

/**
 * The pricing cards, driven entirely by the admin-managed plans: names,
 * prices, promos, badges and feature bullets all come from the API.
 */
export default function LivePlanCards({ cards }: { cards: PricingCard[] }) {
  return (
    <div className={`grid grid-cols-1 gap-6 mx-auto relative z-[1] items-start ${gridClass(cards.length)}`}>
      {cards.map((c, i) => (
        <Card key={c.key} c={c} delay={0.1 + i * 0.08} />
      ))}
    </div>
  );
}

function Card({ c, delay }: { c: PricingCard; delay: number }) {
  const { plan, popular } = c;
  const countdown = c.promoEndsAt ? promoCountdown(c.promoEndsAt) : null;
  // The server says a promo is live; don't keep showing one that has already ended on this clock.
  const promoLive = c.struckPerMonthLabel !== null && (c.promoEndsAt === null || countdown !== null);

  const wrap = popular
    ? "border-green-700 bg-green-800 scale-[1.03] shadow-[var(--shadow-heavy)] hover:scale-[1.03]"
    : "border-cream-border bg-white hover:shadow-[var(--shadow-card)]";
  const iconBox = popular ? "bg-white/[0.12]" : "bg-green-500/10";
  const Icon = c.isFree ? GraduationCap : popular ? Zap : Star;
  const iconColor = popular ? "text-white" : "text-green-600";

  const cta = c.contactSales ? (
    <a
      href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`${plan.name} plan enquiry`)}`}
      className="w-full py-3.5 rounded-xl font-sans text-sm font-bold flex items-center justify-center gap-2 transition-all duration-[250ms] border-2 border-green-800 bg-transparent text-green-800 hover:bg-green-800 hover:text-white">
      <Mail size={15} /> Contact sales
    </a>
  ) : (
    <Link
      href="/register"
      className={`w-full py-3.5 rounded-xl font-sans text-sm font-bold text-center transition-all duration-[250ms] border-2 ${
        popular
          ? "bg-gold border-gold text-green-900 hover:bg-gold-dark hover:border-gold-dark hover:shadow-[0_8px_24px_rgba(245,200,66,0.4)]"
          : "border-green-800 bg-transparent text-green-800 hover:bg-green-800 hover:text-white hover:-translate-y-px"
      }`}>
      {c.isFree ? "Get Started Free" : `Start ${plan.name} — ${c.chargeLabel}${c.chargeUnit}`}
    </Link>
  );

  return (
    <div
      data-testid="plan-card"
      className={`rounded-[24px] px-8 py-10 border-[1.5px] relative flex flex-col text-left transition-all duration-300 hover:-translate-y-1 ${wrap}`}
      style={{ animation: `fadeUp 0.6s ${delay}s ease both` }}>
      {popular && c.badge && (
        <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 bg-gold text-green-900 text-[11px] font-extrabold tracking-[0.08em] uppercase px-[18px] py-[5px] rounded-full whitespace-nowrap">
          {c.badge}
        </div>
      )}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${iconBox}`}>
        <Icon size={20} strokeWidth={1.75} className={iconColor} />
      </div>
      <div className={`text-xs font-bold tracking-[0.1em] uppercase mb-2 ${popular ? "text-white/55" : "text-text-muted"}`}>
        {plan.name}
      </div>

      {promoLive && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.04em] text-gold-dark">
            {c.promoLabel ?? "Limited offer"} · {c.discountPercent}% off
          </span>
          {countdown && (
            <span className={`text-[11px] font-semibold ${countdown.urgent ? "text-red-500" : popular ? "text-white/60" : "text-text-muted"}`}>
              {countdown.label}
            </span>
          )}
        </div>
      )}

      <div className={`font-serif text-[48px] leading-none mb-1 flex items-baseline gap-2 flex-wrap ${popular ? "text-white" : "text-green-900"}`}>
        <span>{c.perMonthLabel}</span>
        {!c.contactSales && (
          <sub className={`font-sans text-base font-medium ${popular ? "text-white/50" : "text-text-muted"}`}>/mo</sub>
        )}
        {promoLive && c.struckPerMonthLabel && (
          <s aria-label={`Regular price ${c.struckPerMonthLabel} per month`} className={`font-sans text-base font-medium ${popular ? "text-white/40" : "text-text-light"}`}>
            {c.struckPerMonthLabel}
          </s>
        )}
      </div>
      <div className={`text-xs mb-2 ${popular ? "text-white/40" : "text-text-light"}`}>{c.billedLabel}</div>
      {promoLive && (
        <div className={`text-[11px] mb-2 ${popular ? "text-white/50" : "text-text-light"}`}>
          Offer applies to your first payment; renews at the regular price.
        </div>
      )}
      <div className={`text-[13px] leading-[1.6] mb-6 min-h-[40px] ${popular ? "text-white/55" : "text-text-muted"}`}>
        {plan.description ?? ""}
      </div>
      <div className={`h-px mb-6 ${popular ? "bg-white/[0.12]" : "bg-cream-border"}`} />
      <div className="flex flex-col gap-[11px] mb-8 flex-1">
        {plan.features.map((f) => (
          <FeatureRow key={f} text={f} included popular={popular} />
        ))}
      </div>
      {cta}
    </div>
  );
}

/** Shown while the plans load, so visitors never see placeholder prices flash to the real ones. */
export function PlanCardsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading plans" className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1040px] mx-auto">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-[24px] border-[1.5px] border-cream-border bg-white px-8 py-10 animate-pulse">
          <div className="w-11 h-11 rounded-xl bg-green-500/10 mb-5" />
          <div className="h-3 w-24 rounded bg-cream-border mb-4" />
          <div className="h-12 w-40 rounded bg-cream-border mb-6" />
          {[0, 1, 2, 3].map((j) => <div key={j} className="h-3 w-full rounded bg-cream-border mb-3" />)}
        </div>
      ))}
    </div>
  );
}
