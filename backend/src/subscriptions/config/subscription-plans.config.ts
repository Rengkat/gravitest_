import { BillingInterval, SubscriptionTier } from 'src/common/enums/enums';

// Rebuilt against your real SubscriptionTier (FREE/BASIC/STANDARD/PREMIUM/
// ENTERPRISE) — the earlier version of this file assumed a single "PRO"
// tier that doesn't exist in your enum. Prices below are PLACEHOLDERS —
// pick real numbers and either edit here or override via env vars.
// ENTERPRISE is commonly sales-negotiated rather than self-serve
// checkout; included here for completeness but you may want to route it
// through a "contact sales" flow instead of Paystack checkout — say so
// and I'll adjust the Subscribe endpoint to reject self-serve ENTERPRISE
// signup.

export interface SubscriptionPlanDefinition {
  tier: SubscriptionTier;
  interval: BillingInterval | null; // null for FREE (never billed)
  name: string;
  amountKobo: number;
  paystackPlanCode: string | null; // null for FREE
  features: string[];
  badge: string | null;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanDefinition[] = [
  {
    tier: SubscriptionTier.FREE,
    interval: null,
    name: 'Free',
    amountKobo: 0,
    paystackPlanCode: null,
    features: ['Limited practice sessions', 'Basic progress tracking'],
    badge: null,
  },
  {
    tier: SubscriptionTier.BASIC,
    interval: BillingInterval.MONTHLY,
    name: 'Basic Monthly',
    amountKobo: Number(process.env.PLAN_BASIC_MONTHLY_AMOUNT_KOBO ?? 250000), // ₦2,500
    paystackPlanCode: process.env.PAYSTACK_PLAN_CODE_BASIC_MONTHLY ?? null,
    features: ['Unlimited practice', 'Sabi Tutor chat (standard limits)'],
    badge: null,
  },
  {
    tier: SubscriptionTier.STANDARD,
    interval: BillingInterval.MONTHLY,
    name: 'Standard Monthly',
    amountKobo: Number(process.env.PLAN_STANDARD_MONTHLY_AMOUNT_KOBO ?? 500000), // ₦5,000
    paystackPlanCode: process.env.PAYSTACK_PLAN_CODE_STANDARD_MONTHLY ?? null,
    features: ['Everything in Basic', 'Higher Sabi Tutor limits', 'AI essay scoring'],
    badge: 'Most Popular',
  },
  {
    tier: SubscriptionTier.STANDARD,
    interval: BillingInterval.ANNUALLY,
    name: 'Standard Annual',
    amountKobo: Number(process.env.PLAN_STANDARD_ANNUAL_AMOUNT_KOBO ?? 4800000), // ₦48,000
    paystackPlanCode: process.env.PAYSTACK_PLAN_CODE_STANDARD_ANNUAL ?? null,
    features: ['Everything in Standard Monthly', 'Save ~20% vs monthly'],
    badge: 'Best Value',
  },
  {
    tier: SubscriptionTier.PREMIUM,
    interval: BillingInterval.MONTHLY,
    name: 'Premium Monthly',
    amountKobo: Number(process.env.PLAN_PREMIUM_MONTHLY_AMOUNT_KOBO ?? 900000), // ₦9,000
    paystackPlanCode: process.env.PAYSTACK_PLAN_CODE_PREMIUM_MONTHLY ?? null,
    features: ['Everything in Standard', 'Highest Sabi Tutor limits', 'Priority AI grading'],
    badge: null,
  },
  {
    tier: SubscriptionTier.ENTERPRISE,
    interval: BillingInterval.ANNUALLY,
    name: 'Enterprise',
    amountKobo: 0, // custom pricing — not charged via self-serve Paystack checkout
    paystackPlanCode: null,
    features: ['Custom limits', 'Dedicated support', 'Contact sales'],
    badge: null,
  },
];

export function findPlan(
  tier: SubscriptionTier,
  interval: BillingInterval | null,
): SubscriptionPlanDefinition | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.tier === tier && p.interval === interval);
}
