import { apiClient } from "./client";
import type { PaginatedResult } from "./notifications";

// ── Backend shapes (Transaction entity, Subscription entity, plan config) ──

export type BackendTransactionStatus = "pending" | "success" | "failed" | "abandoned" | "reversed";
export type BackendTransactionType = "subscription" | "content_purchase" | "wallet_funding" | "other";
export type BackendTransactionChannel =
  | "card" | "bank" | "bank_transfer" | "ussd" | "qr" | "mobile_money" | "apple_pay";

/** Payment rails. Add new gateway codes here as the backend adds them. */
export type PaymentGatewayCode = "paystack" | "opay";

export interface BackendTransaction {
  id: string;
  userId: string;
  type: BackendTransactionType;
  status: BackendTransactionStatus;
  amountKobo: number;
  reference: string;
  /** Which rail collected this payment. Rows from before OPay are "paystack". */
  gateway: PaymentGatewayCode;
  /** The provider's own id (Paystack transaction id / OPay order number). */
  gatewayReference: string | null;
  /** @deprecated Alias of `gatewayReference`, kept so existing readers (invoice download) keep working. */
  paystackReference: string | null;
  channel: BackendTransactionChannel | null;
  cardLast4: string | null;
  cardType: string | null;
  bank: string | null;
  gatewayMessage: string | null;
  /** Plan code for subscription payments (renewals end in "_renewal"). */
  purpose: string | null;
  metadata: Record<string, unknown> | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export type BackendSubscriptionStatus = "pending" | "active" | "cancelled" | "expired" | "past_due";
export type BackendBillingInterval = "monthly" | "quarterly" | "annually";
export type BackendSubscriptionTier = "free" | "basic" | "standard" | "premium" | "enterprise";

export interface BackendSubscription {
  id: string;
  tier: BackendSubscriptionTier;
  status: BackendSubscriptionStatus;
  billingInterval: BackendBillingInterval | null;
  amountKobo: number;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
  autoRenew: boolean;
  createdAt: string;
  /** Snapshot of the plan bought (plans can later be re-priced or retired). */
  planId: string | null;
  planCode: string | null;
  gateway: PaymentGatewayCode | null;
  /** What each renewal costs — fixed at signup, so later price changes don't affect this subscriber. */
  renewalAmountKobo: number | null;
}

/**
 * A purchasable plan as the backend sells it right now. Admin-editable, so
 * never hardcode plan names/prices in the UI — render these.
 */
export interface BackendPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  tier: BackendSubscriptionTier;
  interval: BackendBillingInterval | null;
  currency: string;
  /** What the customer pays TODAY (promo-aware), in kobo. */
  amountKobo: number;
  /** Regular price in kobo. Equals amountKobo when there is no live promo. */
  listAmountKobo: number;
  isPromo: boolean;
  promoLabel: string | null;
  /** ISO time the promo price stops applying. */
  promoEndsAt: string | null;
  discountPercent: number;
  features: string[];
  badge: string | null;
  /** false = "contact sales": don't offer a checkout button. */
  isSelfServe: boolean;
}

export interface PaymentGatewayOption {
  code: PaymentGatewayCode;
  displayName: string;
  /** Pre-select this one. */
  isDefault: boolean;
  capabilities: {
    /** true = card is saved and renewals are charged automatically. */
    recurringCharge: boolean;
    savedCards: boolean;
    methods: string[];
  };
}

export interface BackendPaymentMethod {
  id: string;
  userId: string;
  last4: string;
  cardType: string | null;
  bank: string | null;
  expMonth: string;
  expYear: string;
  holderName: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface UsageSummaryResponse {
  periodStart: string;
  periodEnd: string;
  examSessions: number;
  questionsAnswered: number;
  aiRequestsUsed: number;
}

// ── Transactions ─────────────────────────────────────────────────────────

export async function getTransactions(filters: {
  status?: BackendTransactionStatus;
  type?: BackendTransactionType;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResult<BackendTransaction>> {
  const { data } = await apiClient.get("/billing/transactions", { params: filters });
  return data;
}

export async function getTransaction(id: string): Promise<BackendTransaction> {
  const { data } = await apiClient.get(`/billing/transactions/${id}`);
  return data;
}

export async function resendReceipt(id: string): Promise<{ sent: boolean }> {
  const { data } = await apiClient.post(`/billing/transactions/${id}/resend-receipt`);
  return data;
}

export async function verifyCheckout(reference: string): Promise<BackendTransaction> {
  const { data } = await apiClient.get(`/billing/verify/${reference}`);
  return data;
}

// ── Payment methods ──────────────────────────────────────────────────────

export async function getPaymentMethods(): Promise<BackendPaymentMethod[]> {
  const { data } = await apiClient.get("/billing/payment-methods");
  return data;
}

export async function setDefaultPaymentMethod(id: string): Promise<BackendPaymentMethod> {
  const { data } = await apiClient.patch(`/billing/payment-methods/${id}/default`);
  return data;
}

export async function removePaymentMethod(id: string): Promise<{ deleted: boolean }> {
  const { data } = await apiClient.delete(`/billing/payment-methods/${id}`);
  return data;
}

// ── Subscription & plans ─────────────────────────────────────────────────

// Gateways the admin currently offers at checkout (enabled + configured), in
// display order. Always render from this — never assume Paystack-only.
export async function getPaymentGateways(): Promise<PaymentGatewayOption[]> {
  const { data } = await apiClient.get("/billing/gateways");
  return data;
}

export async function getPlans(): Promise<BackendPlan[]> {
  const { data } = await apiClient.get("/subscriptions/plans");
  return data;
}

export async function getMySubscription(): Promise<BackendSubscription | null> {
  const { data } = await apiClient.get("/subscriptions/me");
  return data;
}

export async function getMySubscriptionHistory(): Promise<BackendSubscription[]> {
  const { data } = await apiClient.get("/subscriptions/me/history");
  return data;
}

export async function getMyUsage(): Promise<UsageSummaryResponse> {
  const { data } = await apiClient.get("/subscriptions/me/usage");
  return data;
}

export interface SubscribePayload {
  /** Preferred: the `id` of a plan from getPlans(). */
  planId?: string;
  /** @deprecated Legacy selector, used only when planId is absent. */
  tier?: BackendSubscriptionTier;
  /** @deprecated See `tier`. */
  interval?: BackendBillingInterval;
  /** Charge this saved card directly (Paystack only, no redirect). */
  paymentMethodId?: string;
  /** Which gateway to check out with. Omit for the admin's default. */
  gateway?: PaymentGatewayCode;
}

// Returns either { authorizationUrl, gateway, subscription } — redirect the
// browser to authorizationUrl to pay on the gateway's hosted checkout — or
// just { subscription } if it activated immediately (a free plan, or a saved
// card was charged directly).
export async function subscribe(
  payload: SubscribePayload,
): Promise<{ authorizationUrl?: string; gateway?: PaymentGatewayCode; subscription: BackendSubscription }> {
  const { data } = await apiClient.post("/subscriptions/subscribe", payload);
  return data;
}

export async function cancelSubscription(): Promise<BackendSubscription> {
  const { data } = await apiClient.patch("/subscriptions/cancel");
  return data;
}
