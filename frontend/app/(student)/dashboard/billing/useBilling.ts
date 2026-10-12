"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import * as billingApi from "@/lib/api/billing";
import type {
  BackendTransaction,
  BackendSubscription,
  BackendPlan,
  BackendPaymentMethod,
} from "@/lib/api/billing";
import type {
  Transaction,
  SavedCard,
  SubscriptionHistory,
  UsageSummary,
  PlanOption,
  TransactionStatus,
  PaymentChannel,
  CardBrand,
  PlanTier,
} from "@/types/billing";
import type { PaymentGatewayOption } from "@/lib/api/billing";
import { extractErrorMessage } from "@/lib/api/client";
import { redirectToCheckout } from "@/lib/billing/checkout";

// ── Mappers: backend shape -> existing frontend display types ───────────
// Keeping the original component-facing types intact means CurrentPlanCard,
// TransactionHistory, etc. barely change — they just stop importing MOCK_*
// and take real (mapped) data as props instead.

function mapTxStatus(s: BackendTransaction["status"]): TransactionStatus {
  if (s === "success") return "paid";
  if (s === "reversed") return "refunded";
  if (s === "failed") return "failed";
  return "pending"; // pending | abandoned
}

function mapChannel(c: BackendTransaction["channel"]): PaymentChannel {
  if (c === "bank" || c === "bank_transfer") return "bank_transfer";
  if (c === "ussd") return "ussd";
  if (c === "qr") return "qr";
  return "card"; // card | mobile_money | apple_pay | null — closest visual bucket
}

/** "standard-monthly" -> "Standard Monthly". */
export function prettifyPlanCode(code: string): string {
  return code
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function describeTransaction(t: BackendTransaction): string {
  if (t.type === "subscription") {
    const purpose = t.purpose ?? "";
    const isRenewal = t.metadata?.renewal === true || purpose.endsWith("_renewal");
    const kind = isRenewal ? "Renewal" : "Subscription";
    // New payments carry the plan code; payments from before plans were
    // admin-editable carried only a tier in metadata.
    const code = (t.metadata?.planCode as string) || purpose.replace(/_renewal$/, "");
    if (code) return `${prettifyPlanCode(code)} — ${kind}`;
    const tier = (t.metadata?.tier as string) ?? "";
    return tier ? `${tier[0].toUpperCase()}${tier.slice(1)} Plan — ${kind}` : `${kind} payment`;
  }
  if (t.type === "content_purchase") return "Content purchase";
  if (t.type === "wallet_funding") return "Wallet funding";
  return "Payment";
}

export function mapTransaction(t: BackendTransaction): Transaction {
  return {
    id: t.id,
    date: t.paidAt ?? t.createdAt,
    description: describeTransaction(t),
    amount: Math.round(t.amountKobo / 100),
    status: mapTxStatus(t.status),
    paystackReference: t.gatewayReference ?? t.paystackReference ?? t.reference,
    gateway: t.gateway,
    cardUsed: t.cardLast4 ? `${(t.cardType ?? "Card").toUpperCase()} •••• ${t.cardLast4}` : (t.channel ?? "—"),
    channel: mapChannel(t.channel),
    invoiceUrl: t.status === "success" ? "#" : undefined,
  };
}

function mapCardBrand(cardType: string | null): CardBrand {
  const t = (cardType ?? "").toLowerCase();
  if (t.includes("master")) return "mastercard";
  if (t.includes("verve")) return "verve";
  return "visa";
}

export function mapPaymentMethod(pm: BackendPaymentMethod): SavedCard {
  return {
    id: pm.id,
    last4: pm.last4,
    brand: mapCardBrand(pm.cardType),
    expMonth: Number(pm.expMonth),
    expYear: Number(pm.expYear),
    isDefault: pm.isDefault,
    holderName: pm.holderName ?? undefined,
  };
}

function mapSubStatus(s: BackendSubscription["status"]): SubscriptionHistory["status"] {
  if (s === "active" || s === "past_due") return "active";
  if (s === "cancelled") return "cancelled";
  return "expired";
}

const INTERVAL_ADJ = { monthly: "Monthly", quarterly: "Quarterly", annually: "Annual" } as const;
const INTERVAL_PERIOD = { monthly: "Monthly", quarterly: "Quarterly", annually: "Annually" } as const;

export function mapSubscriptionHistory(s: BackendSubscription): SubscriptionHistory {
  const tier = `${s.tier[0].toUpperCase()}${s.tier.slice(1)}`;
  return {
    id: s.id,
    plan: s.billingInterval ? `${tier} ${INTERVAL_ADJ[s.billingInterval]}` : tier,
    period: s.billingInterval ? INTERVAL_PERIOD[s.billingInterval] : "—",
    startDate: s.startedAt,
    endDate: s.cancelledAt ?? (s.status === "expired" ? s.expiresAt : null),
    status: mapSubStatus(s.status),
    // What was actually paid first (a promo plan's first payment is its promo price).
    amount: s.amountKobo / 100,
  };
}

const PERIOD = { monthly: "month", quarterly: "quarter", annually: "year" } as const;

/**
 * Is `current` the plan `p`? Subscriptions made after plans became
 * admin-editable carry the plan id; older ones only have tier + interval.
 */
export function isCurrentPlan(p: BackendPlan, current: BackendSubscription | null): boolean {
  if (!current) return false;
  if (current.planId) return current.planId === p.id;
  return current.tier === p.tier && (current.billingInterval ?? null) === (p.interval ?? null);
}

export function mapPlan(p: BackendPlan, current: BackendSubscription | null): PlanOption {
  const isCurrent = isCurrentPlan(p, current);
  return {
    id: p.tier as PlanTier,
    planId: p.id,
    code: p.code,
    interval: p.interval,
    name: p.name,
    // Exact (not rounded): admin prices can legitimately be e.g. ₦2,499.50.
    price: p.amountKobo / 100,
    listPrice: p.listAmountKobo / 100,
    period: p.interval ? PERIOD[p.interval] : "forever",
    badge: isCurrent ? "Current Plan" : (p.badge ?? undefined),
    isCurrent,
    features: p.features,
    isPromo: p.isPromo,
    promoLabel: p.promoLabel,
    promoEndsAt: p.promoEndsAt,
    discountPercent: p.discountPercent,
    isSelfServe: p.isSelfServe,
  };
}

export function useBilling() {
  const [transactions, setTransactions] = useState<BackendTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<BackendPaymentMethod[]>([]);
  const [subscription, setSubscription] = useState<BackendSubscription | null>(null);
  const [history, setHistory] = useState<BackendSubscription[]>([]);
  const [plans, setPlans] = useState<BackendPlan[]>([]);
  const [gateways, setGateways] = useState<PaymentGatewayOption[]>([]);
  const [usage, setUsage] = useState<billingApi.UsageSummaryResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [txResult, methods, sub, subHistory, planList, usageResult, gatewayList] = await Promise.all([
        billingApi.getTransactions({ limit: 100 }),
        billingApi.getPaymentMethods(),
        billingApi.getMySubscription(),
        billingApi.getMySubscriptionHistory(),
        billingApi.getPlans(),
        billingApi.getMyUsage(),
        // Non-essential: if it fails the page still works (checkout uses the default gateway).
        billingApi.getPaymentGateways().catch(() => [] as PaymentGatewayOption[]),
      ]);
      setTransactions(txResult.data);
      setPaymentMethods(methods);
      setSubscription(sub);
      setHistory(subHistory);
      setPlans(planList);
      setUsage(usageResult);
      setGateways(gatewayList);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Mapped, component-ready data ─────────────────────────────────────
  const mappedTransactions = useMemo(() => transactions.map(mapTransaction), [transactions]);
  const contentPurchases = useMemo(
    () => transactions.filter((t) => t.type === "content_purchase").map(mapTransaction),
    [transactions],
  );
  const mappedCards = useMemo(() => paymentMethods.map(mapPaymentMethod), [paymentMethods]);
  const mappedHistory = useMemo(() => history.map(mapSubscriptionHistory), [history]);
  const mappedPlans = useMemo(() => plans.map((p) => mapPlan(p, subscription)), [plans, subscription]);

  const usageSummary: UsageSummary | null = useMemo(() => {
    if (!usage) return null;
    return {
      examSessions: usage.examSessions,
      questionsAnswered: usage.questionsAnswered,
      aiExplanations: usage.aiRequestsUsed,
      // Not tracked anywhere in this schema — see comment on
      // StudentsService.getExamUsageStats on the backend. Left at 0 rather
      // than omitted so UsageSummary's shape doesn't have to change; the
      // component hides these two stats when they're exactly 0.
      videoMinutesWatched: 0,
      storageUsedMB: 0,
      storageLimitMB: 0,
      periodStart: usage.periodStart,
      periodEnd: usage.periodEnd,
    };
  }, [usage]);

  // ── Actions ────────────────────────────────────────────────────────────

  const doResendReceipt = useCallback(async (transactionId: string) => {
    await billingApi.resendReceipt(transactionId);
  }, []);

  const doSetDefaultCard = useCallback(async (id: string) => {
    const prev = paymentMethods;
    setPaymentMethods((p) => p.map((m) => ({ ...m, isDefault: m.id === id })));
    try {
      await billingApi.setDefaultPaymentMethod(id);
    } catch (err) {
      setPaymentMethods(prev);
      throw err;
    }
  }, [paymentMethods]);

  const doRemoveCard = useCallback(async (id: string) => {
    const prev = paymentMethods;
    setPaymentMethods((p) => p.filter((m) => m.id !== id));
    try {
      await billingApi.removePaymentMethod(id);
    } catch (err) {
      setPaymentMethods(prev);
      throw err;
    }
  }, [paymentMethods]);

  const doSubscribe = useCallback(async (payload: billingApi.SubscribePayload) => {
    const result = await billingApi.subscribe(payload);
    if (result.authorizationUrl) {
      redirectToCheckout(result.authorizationUrl);
      return result;
    }
    await load();
    return result;
  }, [load]);

  const doCancelSubscription = useCallback(async () => {
    const updated = await billingApi.cancelSubscription();
    setSubscription(updated);
    return updated;
  }, []);

  return {
    isLoading,
    error,
    reload: load,

    subscription,
    transactions: mappedTransactions,
    contentPurchases,
    paymentMethods: mappedCards,
    subscriptionHistory: mappedHistory,
    plans: mappedPlans,
    gateways,
    usage: usageSummary,

    resendReceipt: doResendReceipt,
    setDefaultCard: doSetDefaultCard,
    removeCard: doRemoveCard,
    subscribe: doSubscribe,
    cancelSubscription: doCancelSubscription,
  };
}
