"use client";

import { useState } from "react";
import { Check, Crown, Zap, Star, X, Loader2, Mail } from "lucide-react";
import { formatCurrency } from "@/lib/constants/billing";
import { extractErrorMessage } from "@/lib/api/client";
import { promoCountdown } from "@/lib/billing/pricing";
import { gatewayLabel } from "@/lib/billing/gateways";
import GatewayPicker, { defaultGateway } from "@/Components/billing/GatewayPicker";
import type { PlanOption } from "@/types/billing";
import type { PaymentGatewayCode, PaymentGatewayOption, SubscribePayload } from "@/lib/api/billing";

interface PlanComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  plans: PlanOption[];
  /** Payment methods the admin currently offers. Empty = use the server default. */
  gateways?: PaymentGatewayOption[];
  /** The list of payment methods could not be loaded (so no choice is shown). */
  gatewaysError?: boolean;
  onSubscribe: (payload: SubscribePayload) => Promise<unknown>;
}

const SALES_EMAIL = "support@gravitest.ng";

/** "Pay securely with Paystack or OPay" — from what is actually enabled. */
export function paymentCopy(gateways: PaymentGatewayOption[]): string {
  if (gateways.length === 0) return "Pay securely online";
  if (gateways.length === 1) return `All plans are billed securely through ${labelOf(gateways[0])}`;
  return `Pay securely with ${gateways.map(labelOf).join(" or ")}`;
}
function labelOf(g: PaymentGatewayOption): string {
  return gatewayLabel(g.code);
}

const PLAN_ICONS: Record<string, any> = {
  free: ({ size }: any) => <span style={{ fontSize: size }}>🎓</span>,
  basic: Zap,
  standard: Crown,
  premium: Star,
};

const PLAN_GRADIENTS: Record<string, string> = {
  free: "from-gray-400 to-gray-500",
  basic: "from-sky-400 to-blue-500",
  standard: "from-amber-400 to-orange-500",
  premium: "from-green-500 to-emerald-600",
};

export default function PlanComparison({ isOpen, onClose, plans, gateways = [], gatewaysError = false, onSubscribe }: PlanComparisonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // null = "not chosen yet" -> the admin's default. Derived, so it stays right
  // if the list of enabled gateways changes.
  const [chosen, setChosen] = useState<PaymentGatewayCode | null>(null);
  const gateway: PaymentGatewayCode | null =
    chosen && gateways.some((g) => g.code === chosen) ? chosen : defaultGateway(gateways);

  if (!isOpen) return null;

  const handleUpgrade = async (plan: PlanOption) => {
    if (plan.isCurrent || !plan.isSelfServe) return;
    setSelected(plan.planId);
    setIsProcessing(true);
    setError(null);
    try {
      // Send the plan id, not tier+interval: with promos a tier can have
      // several plans, and the customer must pay for the one they were shown.
      // A free plan has no checkout, so no gateway is sent for it.
      await onSubscribe({ planId: plan.planId, ...(plan.price > 0 && gateway ? { gateway } : {}) });
      // If the subscribe call needed a hosted checkout it already redirected
      // the browser away — this line only runs for instant-activation paths
      // (free plan, existing saved card).
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsProcessing(false);
      setSelected(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-[20px] font-black text-gray-900">Choose Your Plan</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">{paymentCopy(gateways)}</p>
          </div>
          <button
            title="close"
            onClick={onClose}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-8 mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
            {error}
          </div>
        )}

        {gatewaysError && gateways.length < 2 && (
          <p role="status" className="mx-8 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            We couldn&apos;t load all payment options, so the default method will be used. Close this window and reopen it, or refresh the page, to try again.
          </p>
        )}

        {gateways.length > 1 && (
          <div className="mx-8 mt-4">
            <GatewayPicker gateways={gateways} value={gateway} onChange={setChosen} disabled={isProcessing} />
          </div>
        )}

        {/* Plans grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const isCurrentPlan = plan.isCurrent;
            const isLoading = selected === plan.planId && isProcessing;
            const countdown = plan.isPromo ? promoCountdown(plan.promoEndsAt) : null;
            // Trust the server's isPromo, but never show a promo that has already ended on this clock.
            const promoLive = plan.isPromo && (plan.promoEndsAt === null || countdown !== null);
            const shownPrice = promoLive ? plan.price : plan.listPrice;
            const PlanIcon = PLAN_ICONS[plan.id] ?? Crown;
            const gradient = PLAN_GRADIENTS[plan.id] ?? "from-gray-400 to-gray-500";

            return (
              <div
                key={plan.planId}
                className={`relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all ${
                  isCurrentPlan
                    ? "border-green-500 shadow-lg shadow-green-500/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}>
                {plan.badge && (
                  <div
                    className={`absolute top-0 left-0 right-0 text-center py-1.5 text-[11px] font-black uppercase tracking-wider ${
                      isCurrentPlan ? "bg-green-500 text-white" : "bg-emerald-500 text-white"
                    }`}>
                    {plan.badge}
                  </div>
                )}

                <div className={`p-6 flex flex-col flex-1 ${plan.badge ? "pt-10" : ""}`}>
                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                      <PlanIcon size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[16px] font-black text-gray-900">{plan.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {!plan.isSelfServe ? "Custom pricing" : shownPrice === 0 ? "Always free" : `per ${plan.period}`}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    {promoLive && (
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-amber-800">
                          {plan.promoLabel ?? "Limited offer"} · {plan.discountPercent}% off
                        </span>
                        {countdown && (
                          <span className={`text-[11px] ${countdown.urgent ? "font-bold text-red-600" : "text-gray-500"}`}>
                            {countdown.label}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="text-[32px] font-black text-gray-900">
                      {!plan.isSelfServe ? "Contact us" : shownPrice === 0 ? "Free" : formatCurrency(shownPrice)}
                    </span>
                    {plan.isSelfServe && shownPrice > 0 && (
                      <span className="text-[13px] text-gray-400 ml-1">/{plan.period}</span>
                    )}
                    {promoLive && (
                      <>
                        <s className="ml-2 text-[13px] text-gray-400" aria-label={`Regular price ${formatCurrency(plan.listPrice)}`}>
                          {formatCurrency(plan.listPrice)}
                        </s>
                        <p className="mt-1 text-[11px] text-gray-500">
                          Offer applies to your first payment. Renews at {formatCurrency(plan.listPrice)}/{plan.period}.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[13px] text-gray-700">
                        <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {!plan.isSelfServe ? (
                    <a
                      href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`${plan.name} plan enquiry`)}`}
                      className="w-full py-3 rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2 border-2 border-green-600 text-green-700 hover:bg-green-50">
                      <Mail size={15} /> Contact sales
                    </a>
                  ) : (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={isCurrentPlan || isProcessing}
                    className={`w-full py-3 rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2 ${
                      isCurrentPlan
                        ? "bg-green-100 text-green-700 cursor-default border border-green-200"
                        : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:opacity-90 shadow-md disabled:opacity-50"
                    }`}>
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isCurrentPlan ? (
                      <>
                        <Check size={15} /> Current Plan
                      </>
                    ) : (
                      <>
                        <Zap size={15} /> {shownPrice === 0 ? "Switch to Free" : "Upgrade Now"}
                      </>
                    )}
                  </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-8 pb-6 text-center text-[12px] text-gray-400">
          Cancel anytime. Prices shown in NGN.
        </div>
      </div>
    </div>
  );
}
