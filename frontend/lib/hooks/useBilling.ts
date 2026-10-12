"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMySubscription,
  getPaymentGateways,
  getPlans,
  subscribe,
  verifyCheckout,
  type BackendTransaction,
  type SubscribePayload,
} from "@/lib/api/billing";
import { getMyEntitlements, type AccessDecision, type FeatureKey } from "@/lib/api/entitlements";
import { checkoutOutcome, redirectToCheckout } from "@/lib/billing/checkout";

export const billingKeys = {
  plans: ["billing", "plans"] as const,
  gateways: ["billing", "gateways"] as const,
  subscription: ["billing", "subscription"] as const,
  entitlements: ["billing", "entitlements"] as const,
  checkout: (reference: string) => ["billing", "checkout", reference] as const,
};

/** Public catalogue. Short stale time: an admin may start/stop a promo at any moment. */
export function usePlans() {
  return useQuery({ queryKey: billingKeys.plans, queryFn: getPlans, staleTime: 60_000 });
}

/** Payment methods the admin currently offers at checkout, default first. */
export function usePaymentGateways() {
  return useQuery({ queryKey: billingKeys.gateways, queryFn: getPaymentGateways, staleTime: 60_000 });
}

export function useMySubscription() {
  return useQuery({ queryKey: billingKeys.subscription, queryFn: getMySubscription, staleTime: 30_000 });
}

export function useMyEntitlements() {
  return useQuery({ queryKey: billingKeys.entitlements, queryFn: getMyEntitlements, staleTime: 30_000 });
}

export interface FeatureAccessState {
  /** Entitlements still loading for the first time. */
  isLoading: boolean;
  /** null until known — or if it could not be fetched (see `failedOpen`). */
  decision: AccessDecision | null;
  /**
   * UX-only decision. The SERVER enforces every gate, so if we cannot fetch
   * entitlements we fail OPEN (let the request through; the server's 403 will
   * decide) rather than lock a paying user out over a network blip.
   */
  allowed: boolean;
  failedOpen: boolean;
}

export function useFeatureAccess(feature: FeatureKey): FeatureAccessState {
  const { data, isLoading, isError } = useMyEntitlements();
  const decision = data?.features.find((f) => f.feature === feature) ?? null;
  const failedOpen = isError || (!isLoading && !decision);
  return {
    isLoading,
    decision,
    allowed: decision ? decision.allowed : failedOpen,
    failedOpen,
  };
}

/**
 * Starts a purchase. If the backend returns a checkout URL the browser is sent
 * there (this hook then never "finishes" on this page); if the plan activated
 * immediately (free plan / saved card) the caches are refreshed instead.
 */
export function useSubscribe(options: { onActivated?: () => void; navigate?: (url: string) => void } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubscribePayload) => subscribe(payload),
    onSuccess: async (result) => {
      if (result.authorizationUrl) {
        redirectToCheckout(result.authorizationUrl, options.navigate);
        return;
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: billingKeys.subscription }),
        qc.invalidateQueries({ queryKey: billingKeys.entitlements }),
      ]);
      options.onActivated?.();
    },
  });
}

/** Give the gateway ~1 minute to confirm before telling the user it's still processing. */
export const CHECKOUT_POLL_MS = 3000;
export const CHECKOUT_MAX_POLLS = 20;

/**
 * Confirms a payment after the customer returns from a gateway. Every poll
 * asks the backend, which asks the gateway directly — so this works even if
 * the webhook is slow. Polls only while the payment is still genuinely
 * pending, and stops after CHECKOUT_MAX_POLLS.
 */
export function useCheckoutStatus(reference: string | null, pollMs = CHECKOUT_POLL_MS) {
  const qc = useQueryClient();
  // Verify calls made for THIS reference. Keyed by reference so switching
  // references starts from zero without needing an effect to reset it.
  const [count, setCount] = useState<{ ref: string | null; n: number }>({ ref: reference, n: 0 });
  const polls = count.ref === reference ? count.n : 0;

  const query = useQuery<BackendTransaction>({
    queryKey: billingKeys.checkout(reference ?? "none"),
    queryFn: async () => {
      setCount((c) => ({ ref: reference, n: (c.ref === reference ? c.n : 0) + 1 }));
      return verifyCheckout(reference as string);
    },
    enabled: Boolean(reference),
    retry: 1,
    refetchInterval: (q) => {
      const tx = q.state.data;
      if (tx && checkoutOutcome(tx.status) !== "pending") return false;
      if (polls >= CHECKOUT_MAX_POLLS) return false;
      return pollMs;
    },
  });

  const outcome = query.data ? checkoutOutcome(query.data.status) : null;
  const timedOut = outcome === "pending" && polls >= CHECKOUT_MAX_POLLS;

  // Money moved → refresh what the rest of the app derives from it (once).
  useEffect(() => {
    if (outcome === "success") {
      void qc.invalidateQueries({ queryKey: billingKeys.subscription });
      void qc.invalidateQueries({ queryKey: billingKeys.entitlements });
    }
  }, [outcome, qc]);

  return { ...query, outcome, timedOut };
}
