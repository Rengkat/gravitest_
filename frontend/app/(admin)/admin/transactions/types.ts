// Matches the real backend enums (common/enums/enums.ts) — the previous
// version invented statuses/channels with no backend support (disputed,
// flutterwave, opay, palmpay) and fields with no data source at all
// (IP address, device info, location, fraud flags). Trimmed to reality.
export type TransactionStatus = "pending" | "success" | "failed" | "abandoned" | "reversed";
export type TransactionChannel = "card" | "bank" | "bank_transfer" | "ussd" | "qr" | "mobile_money" | "apple_pay";
export type TransactionType = "subscription" | "content_purchase" | "wallet_funding" | "other";
export type SubscriptionTier = "free" | "basic" | "standard" | "premium" | "enterprise";
export type SubscriptionStatus = "pending" | "active" | "expired" | "cancelled" | "trial" | "past_due";
export type SortField = "date" | "amount" | "status";
export type ViewMode = "transactions" | "subscriptions" | "analytics";

export interface Transaction {
  id: string;
  reference: string;
  /** Which payment gateway collected it ("paystack" / "opay" / …). */
  gateway?: string;
  /** The gateway's own id for the payment. */
  gatewayReference?: string | null;
  /** @deprecated Alias of gatewayReference (kept: the API still sends it). */
  paystackReference: string | null;
  purpose: string | null;
  amountKobo: number;
  currency: string;
  status: TransactionStatus;
  channel: TransactionChannel | null;
  type: TransactionType;
  userId: string;
  cardLast4: string | null;
  cardType: string | null;
  bank: string | null;
  gatewayMessage: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface Subscription {
  id: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingInterval: string | null;
  amountKobo: number;
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
  autoRenew: boolean;
}

// Composed from real /transactions/stats + /subscriptions/stats — see
// lib/api/admin-dashboard.ts. Dropped: churnRate, conversionRate,
// customerLifetimeValue, topCustomers, customerAcquisition,
// revenueByRole — none of these have any backend data source; the old
// version fabricated all of them with Math.random().
export interface RevenueStats {
  totalRevenueKobo: number;
  revenueThisMonthKobo: number;
  revenueLastMonthKobo: number;
  countByStatus: Record<string, number>;
  countByType: Record<string, number>;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  expiredSubscriptions: number;
  pastDueSubscriptions: number;
  estimatedMrrKobo: number;
}

export interface TransactionFilters {
  status: TransactionStatus | "";
  type: TransactionType | "";
  gateway: string;
  search: string;
  from: string;
  to: string;
}
