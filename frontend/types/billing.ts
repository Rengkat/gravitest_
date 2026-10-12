export type CardBrand = "visa" | "mastercard" | "verve";
export type TransactionStatus = "paid" | "failed" | "refunded" | "pending";
export type PaymentChannel = "card" | "bank_transfer" | "ussd" | "qr";
export type ContentPurchaseType = "past_papers" | "video_bundle" | "ebook" | "practice_set";
export type SubscriptionStatus = "active" | "cancelled" | "expired";
export type PlanTier = "free" | "basic" | "standard" | "premium" | "enterprise";
export type PlanInterval = "monthly" | "quarterly" | "annually";

export interface SavedCard {
  id: string;
  last4: string;
  brand: CardBrand;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  holderName?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: TransactionStatus;
  /**
   * The gateway's own reference for the payment (Paystack transaction id /
   * OPay order number). Name kept for existing readers; it is NOT Paystack-only.
   */
  paystackReference: string;
  /** Which rail collected it, for display ("Paystack" / "OPay"). */
  gateway?: "paystack" | "opay";
  cardUsed: string;
  channel: PaymentChannel;
  invoiceUrl?: string;
}

export interface SubscriptionHistory {
  id: string;
  plan: string;
  period: string;
  startDate: string;
  endDate: string | null;
  status: SubscriptionStatus;
  amount: number;
}

export interface ContentPurchase {
  id: string;
  title: string;
  type: ContentPurchaseType;
  date: string;
  amount: number;
  downloadUrl?: string;
  watchUrl?: string;
}

export interface UsageSummary {
  examSessions: number;
  questionsAnswered: number;
  aiExplanations: number;
  videoMinutesWatched: number;
  storageUsedMB: number;
  storageLimitMB: number;
  periodStart: string;
  periodEnd: string;
}

export interface PlanOption {
  /** The access level (icon/colour key). Several plans can share one tier. */
  id: PlanTier;
  /** The backend plan id. THIS is what checkout sends — a tier alone is ambiguous once promos exist. */
  planId: string;
  code: string;
  interval: PlanInterval | null;
  name: string;
  /** What the customer pays today, in naira (promo-aware). */
  price: number;
  /** The regular price in naira. Equals `price` when there is no live promo. */
  listPrice: number;
  period: string;
  badge?: string;
  features: string[];
  isCurrent?: boolean;
  isPromo: boolean;
  promoLabel: string | null;
  /** ISO time the promo price stops applying. */
  promoEndsAt: string | null;
  discountPercent: number;
  /** false = "contact sales": there is no checkout for this plan. */
  isSelfServe: boolean;
}
