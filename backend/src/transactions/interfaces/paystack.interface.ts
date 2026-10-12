// Minimal typed subset of the Paystack API responses we actually consume.
// Full docs: https://paystack.com/docs/api/

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackAuthorizationData {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: string;
  card_type: string;
  bank: string;
  country_code: string;
  brand: string;
  reusable: boolean;
  signature: string;
}

export interface PaystackPlanRef {
  id: number;
  name: string;
  plan_code: string;
  amount: number; // kobo
  interval: string; // 'monthly' | 'annually' | ...
}

export interface PaystackTransactionData {
  id: number;
  domain: string;
  status: 'success' | 'failed' | 'abandoned' | 'ongoing' | 'pending';
  reference: string;
  amount: number; // kobo
  currency: string;
  channel: string;
  paid_at: string | null;
  created_at: string;
  gateway_response: string;
  authorization: PaystackAuthorizationData | null;
  // Present when this charge is tied to a Paystack-managed recurring plan
  // (either the first charge from /transaction/initialize with `plan`, or
  // a subsequent auto-renewal charge Paystack initiated on its own).
  plan?: PaystackPlanRef | Record<string, never> | null;
  customer: {
    id: number;
    email: string;
    customer_code: string;
  };
  metadata: Record<string, any> | null;
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: PaystackTransactionData;
}

export interface PaystackChargeAuthorizationResponse {
  status: boolean;
  message: string;
  data: PaystackTransactionData;
}

// ── Customers ────────────────────────────────────────────────────────────

export interface PaystackCustomerData {
  id: number;
  customer_code: string;
  email: string;
}

export interface PaystackCustomerResponse {
  status: boolean;
  message: string;
  data: PaystackCustomerData;
}

// ── Native Subscriptions (POST /subscription — uses a saved authorization,
// no checkout redirect) ─────────────────────────────────────────────────

export interface PaystackSubscriptionData {
  subscription_code: string;
  email_token: string; // required to later disable the subscription
  amount: number; // kobo
  status: string; // 'active' | 'complete' | ...
  next_payment_date: string | null;
  plan: PaystackPlanRef;
  customer: PaystackCustomerData;
}

export interface PaystackCreateSubscriptionResponse {
  status: boolean;
  message: string;
  data: PaystackSubscriptionData;
}

// ── Webhook ──────────────────────────────────────────────────────────────

// Paystack sends many event types to your webhook. We only deep-type the
// ones we actively branch on; everything else still arrives with a `data`
// blob we forward on as-is via PaystackWebhookReceivedEvent.
export type PaystackWebhookEventType =
  | 'charge.success'
  | 'charge.failed'
  | 'subscription.create'
  | 'subscription.disable'
  | 'subscription.not_renew'
  | 'invoice.create'
  | 'invoice.update'
  | 'invoice.payment_failed'
  | (string & {});

export interface PaystackWebhookPayload {
  event: PaystackWebhookEventType;
  data: PaystackTransactionData | (Record<string, any> & { subscription_code?: string });
}
