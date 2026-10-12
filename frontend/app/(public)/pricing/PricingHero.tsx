"use client";

import { useState } from "react";
import { usePlans } from "@/lib/hooks/useBilling";
import {
  availableBillings,
  buildPricingCards,
  maxAnnualSavingPercent,
  type Billing,
} from "@/lib/billing/pricing-page";
import LivePlanCards, { PlanCardsSkeleton } from "./LivePlanCards";

/* ─── Section ──────────────────────────────────────────────
   Every card, price and promo here comes from the admin-managed plans.
   There is deliberately NO hard-coded fallback: if the plans can't be
   loaded we say so, rather than show prices that may no longer be true.   */
export default function PricingHero() {
  const [picked, setBilling] = useState<Billing>("monthly");
  const { data: plans, isLoading, refetch } = usePlans();
  const live = !!plans && plans.length > 0;

  // The toggle only exists if the live catalogue actually sells both periods.
  const avail = live ? availableBillings(plans) : { monthly: true, annual: true };
  const showToggle = live && avail.monthly && avail.annual;
  // If only one period is sold, use it regardless of what was last clicked.
  const billing: Billing = !avail.annual ? "monthly" : !avail.monthly ? "annual" : picked;
  const annual = billing === "annual";
  const savePercent = live ? maxAnnualSavingPercent(plans) : null;

  return (
    <section className="pt-[140px] pb-20 px-[5%] text-center relative overflow-hidden bg-cream">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(46,139,87,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(245,200,66,0.05) 0%, transparent 60%)",
        }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(26,74,46,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(26,74,46,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)",
        }}
      />

      <div className="relative z-[1]">
        {/* Label */}
        <div className="inline-flex items-center gap-2 mb-4 [animation:fadeUp_0.6s_ease_both] before:content-[''] before:block before:w-6 before:h-0.5 before:rounded-sm before:bg-green-500">
          <span className="text-[11px] font-bold text-green-600 tracking-[0.12em] uppercase">Pricing</span>
        </div>

        {/* Headline */}
        <h1
          className="font-serif text-green-900 leading-[1.08] tracking-[-1.5px] mb-5 [animation:fadeUp_0.6s_0.1s_ease_both]"
          style={{ fontSize: "clamp(42px, 5vw, 68px)" }}>
          Simple pricing.
          <br />
          <em className="not-italic text-green-600">Big results.</em>
        </h1>

        {/* Sub */}
        <p className="text-lg text-text-muted max-w-[520px] mx-auto mb-12 leading-[1.7] [animation:fadeUp_0.6s_0.2s_ease_both]">
          Start free. Upgrade when you&apos;re ready. No hidden fees, no tricks, no
          &ldquo;gotcha&rdquo; moments.
        </p>

        {/* Billing toggle */}
        <div className={`flex justify-center mb-16 [animation:fadeUp_0.6s_0.25s_ease_both] ${showToggle ? "" : "hidden"}`}>
          <div className="inline-flex items-center bg-white border border-cream-border rounded-xl p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-6 py-2 rounded-lg font-sans text-sm font-semibold cursor-pointer transition-all duration-200 border-none ${
                !annual
                  ? "bg-green-800 text-white shadow-[0_2px_12px_rgba(26,74,46,0.25)]"
                  : "bg-transparent text-text-muted"
              }`}>
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-6 py-2 rounded-lg font-sans text-sm font-semibold cursor-pointer transition-all duration-200 border-none flex items-center gap-2 ${
                annual
                  ? "bg-green-800 text-white shadow-[0_2px_12px_rgba(26,74,46,0.25)]"
                  : "bg-transparent text-text-muted"
              }`}>
              Annual
              {savePercent !== null && (
                <span className="inline-flex items-center px-2.5 py-0.5 bg-gold/15 rounded-full text-[11px] font-extrabold text-gold-dark tracking-[0.04em]">
                  Save up to {savePercent}%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Cards: skeleton while loading → live plans → honest "unavailable" */}
        {isLoading ? (
          <PlanCardsSkeleton />
        ) : live ? (
          <LivePlanCards cards={buildPricingCards(plans, billing)} />
        ) : (
          <div
            role="alert"
            className="mx-auto max-w-md rounded-[20px] border border-cream-border bg-white p-8 text-center">
            <h2 className="mb-2 font-serif text-xl text-green-900">Prices are unavailable right now</h2>
            <p className="mb-4 text-sm text-text-muted">
              We couldn&apos;t load our plans. Please try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => void refetch?.()}
              className="rounded-full border border-green-800 px-5 py-2 text-sm font-semibold text-green-800 hover:bg-green-800 hover:text-white">
              Try again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
