"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import CurrentPlanCard from "./CurrentPlanCard";
import PlanComparison from "./PlanComparison";
import UsageStats from "./UsageStats";
import PaymentMethods from "./PaymentMethods";
import TransactionHistory from "./TransactionHistory";
import { SubscriptionHistory, ContentPurchases } from "./HistorySections";
import InvoicesSection from "./InvoicesSection";
import { useBilling } from "../useBilling";

export default function BillingPage() {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const {
    isLoading,
    error,
    reload,
    subscription,
    transactions,
    contentPurchases,
    paymentMethods,
    subscriptionHistory,
    plans,
    gateways,
    gatewaysFailed,
    refreshGateways,
    usage,
    resendReceipt,
    setDefaultCard,
    removeCard,
    subscribe,
    cancelSubscription,
  } = useBilling();

  // "?upgrade=1" is how other pages (library paywall, pricing links) send a
  // student straight to the plan chooser. "Open" is DERIVED from the URL once
  // the plans have loaded (no state synced in an effect); closing the chooser
  // dismisses it and drops the parameter so a refresh doesn't bring it back.
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const wantsUpgrade = params.get("upgrade") === "1";
  const [autoDismissed, setAutoDismissed] = useState(false);
  const autoOpen = wantsUpgrade && !autoDismissed && !isLoading && plans.length > 0;
  const planModalOpen = showPlanModal || autoOpen;

  // Always show the CURRENT set of payment methods when the chooser opens (an
  // admin may have switched one on since this page loaded).
  useEffect(() => {
    if (planModalOpen) void refreshGateways();
  }, [planModalOpen, refreshGateways]);

  const closePlanModal = () => {
    setShowPlanModal(false);
    setAutoDismissed(true); // don't flicker back open while the URL change is in flight
    if (wantsUpgrade) router.replace(pathname, { scroll: false });
  };

  // Nothing to show (no plans): there is nothing to open, so just tidy the URL.
  useEffect(() => {
    if (wantsUpgrade && !isLoading && plans.length === 0) router.replace(pathname, { scroll: false });
  }, [wantsUpgrade, isLoading, plans.length, router, pathname]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-[24px] font-black text-gray-900">Billing & Subscription</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Manage your plan, payment methods, transactions, and invoices
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-green-600" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <p className="text-[14px] text-red-600">{error}</p>
          <button
            onClick={reload}
            className="px-4 py-2 rounded-xl bg-green-700 text-white text-[13px] font-medium hover:bg-green-800 transition-all">
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current plan */}
          <CurrentPlanCard
            subscription={subscription}
            onUpgrade={() => setShowPlanModal(true)}
            onCancel={cancelSubscription}
          />

          {/* Usage this billing period */}
          <UsageStats usage={usage} />

          {/* Payment methods */}
          <PaymentMethods
            cards={paymentMethods}
            onSetDefault={setDefaultCard}
            onRemove={removeCard}
            onAddCard={() => setShowPlanModal(true)}
          />

          {/* Transaction history */}
          <TransactionHistory transactions={transactions} onResendReceipt={resendReceipt} />

          {/* Subscription timeline */}
          <SubscriptionHistory history={subscriptionHistory} />

          {/* Content purchases */}
          <ContentPurchases transactions={contentPurchases} />

          {/* Invoices */}
          <InvoicesSection transactions={transactions} onResendReceipt={resendReceipt} />
        </div>
      )}

      {/* Plan comparison modal */}
      <PlanComparison
        isOpen={planModalOpen}
        onClose={closePlanModal}
        plans={plans}
        gateways={gateways}
        gatewaysError={gatewaysFailed}
        onSubscribe={subscribe}
      />
    </div>
  );
}
