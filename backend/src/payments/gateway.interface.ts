import { PaymentGatewayCode, TransactionChannel } from 'src/common/enums/enums';

/**
 * Everything the billing core needs from a payment provider, and nothing more.
 * TransactionsService / SubscriptionsService only ever talk to this interface —
 * adding Flutterwave, Monnify, etc. later means writing one class that
 * implements it and registering it; no billing logic changes.
 *
 * All amounts crossing this boundary are integer KOBO.
 */

export interface GatewayCapabilities {
  /** Can charge a stored authorization off-session (needed for auto-renewal). */
  recurringCharge: boolean;
  /** Returns reusable card authorizations we can save as PaymentMethods. */
  savedCards: boolean;
  /** Human-readable payment methods, for the checkout UI only. */
  methods: string[];
}

export interface GatewayCustomer {
  email: string;
  name?: string;
  phone?: string;
}

export interface GatewayInitializeParams {
  /** OUR unique reference (idempotency key with the provider). */
  reference: string;
  amountKobo: number;
  currency: string;
  customer: GatewayCustomer;
  userId: string;
  productName: string;
  productDescription?: string;
  metadata: Record<string, unknown>;
}

export interface GatewayInitializeResult {
  /** Hosted checkout page to redirect the browser to. */
  authorizationUrl: string;
  /** Provider's own id for the payment, if it issues one at init time. */
  gatewayReference: string | null;
}

export type GatewayChargeStatus =
  | 'success'
  | 'failed'
  | 'abandoned'
  | 'pending';

export interface GatewayAuthorization {
  code: string;
  last4: string;
  cardType: string | null;
  bank: string | null;
  expMonth: string;
  expYear: string;
  signature: string | null;
  reusable: boolean;
}

/** Provider-agnostic outcome of a charge, as reported by the provider. */
export interface GatewayChargeResult {
  status: GatewayChargeStatus;
  /** OUR reference — the one we sent at initialize. */
  reference: string;
  gatewayReference: string | null;
  amountKobo: number;
  currency: string;
  channel: TransactionChannel | null;
  paidAt: Date | null;
  message: string | null;
  authorization: GatewayAuthorization | null;
  /** The untouched provider payload, stored for reconciliation/disputes. */
  raw: Record<string, any>;
}

export interface GatewayWebhookOutcome {
  /** Provider's event name, e.g. 'charge.success' / 'transaction-status'. */
  eventType: string;
  /** Provider's event body (verified). */
  data: Record<string, any>;
  /** Set only for events that report the state of a charge. */
  charge: GatewayChargeResult | null;
}

export type RawHeaders = Record<string, string | string[] | undefined>;

export interface PaymentGateway {
  readonly code: PaymentGatewayCode;
  /** Default label; admins can override it in the gateway config. */
  readonly defaultDisplayName: string;
  readonly capabilities: GatewayCapabilities;

  /** All required credentials/URLs present? Unconfigured gateways can't be enabled. */
  isConfigured(): boolean;

  /**
   * NAMES of the environment variables that are still unset/blank (never their
   * values — safe to log and to show an admin). Empty when isConfigured().
   */
  missingConfig(): string[];

  initialize(params: GatewayInitializeParams): Promise<GatewayInitializeResult>;

  /** Ask the provider for the authoritative state of a charge. */
  verify(reference: string): Promise<GatewayChargeResult>;

  /** Off-session charge of a stored authorization. Only if capabilities.recurringCharge. */
  chargeAuthorization?(params: {
    reference: string;
    email: string;
    amountKobo: number;
    authorizationCode: string;
    metadata: Record<string, unknown>;
  }): Promise<GatewayChargeResult>;

  /**
   * Authenticate and decode an inbound webhook. MUST throw
   * InvalidWebhookSignatureError if it can't prove the request came from the
   * provider. Must not act on unauthenticated data.
   */
  parseWebhook(
    rawBody: Buffer,
    headers: RawHeaders,
  ): Promise<GatewayWebhookOutcome>;
}

/** Thrown by parseWebhook when authentication fails (→ 401 + fraud alert). */
export class InvalidWebhookSignatureError extends Error {
  constructor(message = 'Invalid webhook signature.') {
    super(message);
    this.name = 'InvalidWebhookSignatureError';
  }
}

/** Thrown when a provider call fails. `message` is safe to show to end users. */
export class GatewayRequestError extends Error {
  constructor(
    message: string,
    /** Upstream detail for logs/admin only. */
    public readonly detail?: string,
    /** Transient upstream failure — a webhook caller should be told to retry (5xx). */
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'GatewayRequestError';
  }
}
