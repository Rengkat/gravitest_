"use client";

import { useState } from "react";
import { Crown, Zap, X, Loader2, AlertTriangle, ArrowUpRight } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/constants/billing";
import { extractErrorMessage } from "@/lib/api/client";
import { gatewayLabel } from "@/lib/billing/gateways";
import type { BackendSubscription } from "@/lib/api/billing";
import { prettifyPlanCode } from "../useBilling";

interface CurrentPlanCardProps {
  subscription: BackendSubscription | null;
  onUpgrade: () => void;
  onCancel: () => Promise<unknown>;
}

const FREE_PLAN_LABEL = "Free Plan";

const INTERVAL_LABEL = { monthly: "Monthly", quarterly: "Quarterly", annually: "Annually" } as const;
const INTERVAL_UNIT = { monthly: "month", quarterly: "quarter", annually: "year" } as const;
const INTERVAL_DAYS = { monthly: 30, quarterly: 90, annually: 365 } as const;

/**
 * What is true about how this subscription is paid for — so the card never
 * claims "billed automatically" for a prepaid OPay plan or a cancelled one.
 *  - renewing:  we charge a saved card at the end of each period
 *  - ending:    the user cancelled; access runs to the period end, no more charges
 *  - prepaid:   paid for one period (e.g. OPay); the user must pay again to continue
 */
export type RenewalMode = "renewing" | "ending" | "prepaid";
export function renewalMode(s: Pick<BackendSubscription, "autoRenew" | "cancelledAt">): RenewalMode {
  if (s.autoRenew) return "renewing";
  return s.cancelledAt ? "ending" : "prepaid";
}

export default function CurrentPlanCard({ subscription, onUpgrade, onCancel }: CurrentPlanCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const isFree = !subscription || subscription.tier === "free";
  const planName = isFree
    ? FREE_PLAN_LABEL
    : subscription.planCode
      ? prettifyPlanCode(subscription.planCode)
      : `${subscription.tier[0].toUpperCase()}${subscription.tier.slice(1)} Plan`;
  const interval = subscription?.billingInterval ?? null;
  const mode: RenewalMode | null = subscription && !isFree ? renewalMode(subscription) : null;
  // What each period costs from now on. `amountKobo` is only the FIRST payment
  // (it can be a promo price), so showing it as "per month" would be wrong.
  const renewalKobo = subscription ? (subscription.renewalAmountKobo ?? subscription.amountKobo) : 0;
  const amountPerCycle = renewalKobo / 100;
  const paidFirstKobo = subscription?.amountKobo ?? 0;
  const hadPromo = !!subscription && subscription.renewalAmountKobo != null && paidFirstKobo < subscription.renewalAmountKobo;
  const cycleLabel = interval ? INTERVAL_UNIT[interval] : "—";
  const gatewayName = gatewayLabel(subscription?.gateway ?? "paystack"); // legacy rows (no gateway recorded) were Paystack

  const daysRemaining = (() => {
    if (!subscription?.expiresAt) return null;
    const ms = new Date(subscription.expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 86400000));
  })();

  const cycleLengthDays = interval ? INTERVAL_DAYS[interval] : 30;
  const renewalPct =
    daysRemaining != null ? Math.max(0, Math.min(100, (daysRemaining / cycleLengthDays) * 100)) : 0;

  const handleCancel = async () => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      await onCancel();
      setShowCancelModal(false);
    } catch (err) {
      setCancelError(extractErrorMessage(err));
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-emerald-400" />

        <div className="p-6">
          {/* Plan name row */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shrink-0">
                <Crown size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[20px] font-black text-gray-900">{planName}</h2>
                  {!isFree && subscription && (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        mode === "ending"
                          ? "bg-gray-100 text-gray-600 border-gray-200"
                          : subscription.status === "active"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : subscription.status === "past_due"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {mode === "ending" && subscription.expiresAt
                        ? `Ends ${formatDate(subscription.expiresAt)}`
                        : subscription.status === "active"
                        ? "Active"
                        : subscription.status === "past_due"
                          ? "Payment overdue"
                          : subscription.status}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  {isFree || !interval
                    ? "No active subscription"
                    : mode === "renewing"
                      ? `${INTERVAL_LABEL[interval]} · Renews automatically via ${gatewayName}`
                      : mode === "ending"
                        ? `${INTERVAL_LABEL[interval]} · Cancelled — no further charges`
                        : `${INTERVAL_LABEL[interval]} · Prepaid via ${gatewayName} — renew to keep access`}
                </p>
              </div>
            </div>
            {!isFree && (
              <div className="text-right shrink-0">
                <p className="text-[24px] font-black text-green-700">{formatCurrency(amountPerCycle)}</p>
                <p className="text-[12px] text-gray-400">per {cycleLabel}</p>
                {hadPromo && (
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Your first {cycleLabel} was {formatCurrency(paidFirstKobo / 100)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Details grid */}
          {!isFree && subscription && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[
                { label: "Plan Started", value: formatDate(subscription.startedAt) },
                {
                  // A prepaid or cancelled plan doesn't "renew" — it ends.
                  label: mode === "renewing" ? "Next Renewal" : mode === "ending" ? "Access Ends" : "Expires",
                  value: subscription.expiresAt ? formatDate(subscription.expiresAt) : "—",
                },
                {
                  label: "Billing Cycle",
                  value: interval ? INTERVAL_LABEL[interval] : "—",
                },
                { label: "Days Remaining", value: daysRemaining != null ? `${daysRemaining} days` : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p className="text-[14px] font-bold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Failed renewal: tell the customer what's happening and what to do */}
          {subscription?.status === "past_due" && (
            <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                We couldn&apos;t renew your plan with your saved card. We&apos;ll try again automatically for a few
                days — to keep your access, renew now or add a different payment method.
              </span>
            </div>
          )}

          {/* Renewal progress bar */}
          {!isFree && daysRemaining != null && (
            <div className="mb-5">
              <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
                <span>Billing period</span>
                <span>
                  {mode === "renewing" ? `${daysRemaining} days until next charge` : `${daysRemaining} days of access left`}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${100 - renewalPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onUpgrade}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-[14px] font-bold hover:bg-green-700 transition-colors shadow-sm">
              <Zap size={15} className="fill-white" />
              {isFree ? "Upgrade Plan" : mode === "renewing" && subscription?.status !== "past_due" ? "Change Plan" : "Renew / Change Plan"}
              <ArrowUpRight size={14} />
            </button>
            {/* Only a plan that renews itself has anything to cancel. */}
            {mode === "renewing" && subscription?.status !== "cancelled" && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-5 py-2.5 border border-red-200 text-red-600 rounded-xl text-[14px] font-semibold hover:bg-red-50 transition-colors">
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && subscription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">Cancel Subscription</h3>
                  <p className="text-[12px] text-gray-500">
                    Your access ends{" "}
                    {subscription.expiresAt ? formatDate(subscription.expiresAt) : "at the end of this period"}
                  </p>
                </div>
              </div>
              <button
                title="close modal"
                onClick={() => setShowCancelModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Reason — cosmetic for now, backend cancel endpoint doesn't
                  currently accept a reason field. Kept for UX continuity;
                  wire it through if/when the backend adds one. */}
              <div>
                <label className="block text-[12px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Reason for cancelling (optional)
                </label>
                <select
                  title="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:border-red-300 bg-white">
                  <option value="">Select a reason</option>
                  <option value="too_expensive">Too expensive</option>
                  <option value="not_using">Not using it enough</option>
                  <option value="missing_features">Missing features I need</option>
                  <option value="switching">Switching to another platform</option>
                  <option value="exams_done">Finished my exams</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <p className="text-[12px] text-gray-500">
                Your access continues until{" "}
                <span className="font-semibold">
                  {subscription.expiresAt ? formatDate(subscription.expiresAt) : "the end of this period"}
                </span>
                . No further charges will be made.
              </p>

              {cancelError && <p className="text-[12px] text-red-600">{cancelError}</p>}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-[14px] font-bold hover:bg-green-700">
                Keep My Plan
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-[1] py-2.5 border border-red-200 text-red-600 rounded-xl text-[14px] font-semibold hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2">
                {isCancelling ? <Loader2 size={14} className="animate-spin" /> : null}
                Cancel Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
