import { TransactionType } from 'src/common/enums/enums';
import { PaystackWebhookEventType } from '../interfaces/paystack.interface';

export const TRANSACTION_SUCCESSFUL_EVENT = 'transaction.successful';
export const TRANSACTION_FAILED_EVENT = 'transaction.failed';
export const PAYSTACK_WEBHOOK_EVENT = 'paystack.webhook.received';

// Emitted once a Transaction row we're tracking flips to SUCCESS (via
// webhook, manual verify, or a synchronous charge_authorization response).
// Any module that cares about a particular TransactionType listens with
// @OnEvent and checks `type` + `relatedEntityType` before acting.
export class TransactionSuccessfulEvent {
  constructor(
    public readonly transactionId: string,
    public readonly userId: string,
    public readonly type: TransactionType,
    public readonly relatedEntityType: string | null,
    public readonly relatedEntityId: string | null,
    public readonly metadata: Record<string, any> | null,
    public readonly amountKobo: number,
    /** PaymentGatewayCode that collected the money. */
    public readonly gateway: string = 'paystack',
    /** Reusable card token, when the gateway issued one (Paystack cards). */
    public readonly authorizationCode: string | null = null,
  ) {}
}

export class TransactionFailedEvent {
  constructor(
    public readonly transactionId: string,
    public readonly userId: string,
    public readonly type: TransactionType,
    public readonly relatedEntityType: string | null,
    public readonly relatedEntityId: string | null,
    public readonly metadata: Record<string, any> | null,
    public readonly reason: string | null,
  ) {}
}

// Broadcast for EVERY verified webhook Paystack sends us, regardless of
// whether Transactions itself recognized/acted on it. This is what lets
// Subscriptions react to event types Transactions doesn't understand
// (subscription.create, subscription.disable, invoice.payment_failed,
// and renewal charge.success events with no matching local Transaction
// row) without Transactions needing any subscription-specific knowledge.
export class PaystackWebhookReceivedEvent {
  constructor(
    public readonly eventType: PaystackWebhookEventType,
    public readonly data: Record<string, any>,
  ) {}
}
