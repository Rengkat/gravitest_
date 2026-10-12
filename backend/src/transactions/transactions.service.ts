import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository, SelectQueryBuilder } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import * as crypto from 'crypto';

import { Transaction } from './entities/transaction.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { AiUsageLog } from 'src/ai/entities/ai-usage-log.entity';
import { StudentsService } from 'src/students/students.service';
import { MailService } from 'src/mail/mail.service';
import { UserService } from 'src/user/user.service';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';
import {
  PaystackCreateSubscriptionResponse,
  PaystackCustomerResponse,
  PaystackSubscriptionData,
} from './interfaces/paystack.interface';
import {
  GatewayAuthorization,
  GatewayChargeResult,
  GatewayRequestError,
  InvalidWebhookSignatureError,
  RawHeaders,
} from 'src/payments/gateway.interface';
import { PaymentGatewaysService } from 'src/payments/payment-gateways.service';
import { PaymentGatewayRegistry } from 'src/payments/payment-gateway.registry';
import { PaystackGateway } from 'src/payments/gateways/paystack.gateway';
import {
  PaystackWebhookReceivedEvent,
  TransactionFailedEvent,
  TransactionSuccessfulEvent,
  PAYSTACK_WEBHOOK_EVENT,
  TRANSACTION_FAILED_EVENT,
  TRANSACTION_SUCCESSFUL_EVENT,
} from './events/transaction.events';
import {
  PaymentGatewayCode,
  TransactionChannel,
  TransactionStatus,
  TransactionType,
  AdminAlertPriority,
  AdminAlertType,
} from 'src/common/enums/enums';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginatedResult } from 'src/common/pagination/pagination.interface';
import paystackConfig from '../config/paystackConfig';
import type { ConfigType } from '@nestjs/config';
import { AdminAlertsService } from 'src/admin-alerts/admin-alerts.service';

type PaystackConfig = ConfigType<typeof paystackConfig>;

export interface InitializeTransactionParams {
  userId: string;
  email: string;
  amountKobo: number;
  type: TransactionType;
  purpose?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, any>;
  /** PaymentGatewayCode. Omit → the admin-configured default gateway. */
  gateway?: string;
  customer?: { name?: string; phone?: string };
}

export interface ChargeAuthorizationParams extends Omit<
  InitializeTransactionParams,
  'gateway' | 'customer'
> {
  authorizationCode: string;
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,

    @InjectRepository(AiUsageLog)
    private readonly aiUsageLogRepository: Repository<AiUsageLog>,

    private readonly studentsService: StudentsService,
    private readonly mailService: MailService,
    private readonly userService: UserService,

    private readonly httpService: HttpService,
    private readonly eventEmitter: EventEmitter2,
    private readonly paginationProvider: PaginationProvider,

    @Inject(paystackConfig.KEY)
    private readonly paystackConf: PaystackConfig,

    private readonly adminAlertsService: AdminAlertsService,

    private readonly gateways: PaymentGatewaysService,
    private readonly registry: PaymentGatewayRegistry,
    private readonly paystack: PaystackGateway,
  ) {}

  // ─── INITIALIZE (redirect-based checkout, any gateway) ────────────────────

  async initializeTransaction(
    params: InitializeTransactionParams,
  ): Promise<{ transaction: Transaction; authorizationUrl: string; gateway: string }> {
    // Throws a user-facing 400 if the chosen gateway is disabled/unconfigured.
    const gateway = await this.gateways.resolveForCheckout(params.gateway);
    const reference = this.generateReference();

    let transaction = this.transactionRepository.create({
      reference,
      gateway: gateway.code,
      userId: params.userId,
      type: params.type,
      purpose: params.purpose ?? null,
      amountKobo: params.amountKobo,
      currency: 'NGN',
      status: TransactionStatus.PENDING,
      relatedEntityType: params.relatedEntityType ?? null,
      relatedEntityId: params.relatedEntityId ?? null,
      metadata: params.metadata ?? null,
    });
    transaction = await this.transactionRepository.save(transaction);

    try {
      const result = await gateway.initialize({
        reference,
        amountKobo: params.amountKobo,
        currency: 'NGN',
        userId: params.userId,
        customer: { email: params.email, ...(params.customer ?? {}) },
        productName: (params.purpose ?? this.describeTransaction(transaction)).slice(0, 100),
        metadata: {
          userId: params.userId,
          type: params.type,
          relatedEntityType: params.relatedEntityType ?? null,
          relatedEntityId: params.relatedEntityId ?? null,
          ...(params.metadata ?? {}),
        },
      });

      transaction.gatewayReference = result.gatewayReference;
      await this.transactionRepository.save(transaction);
      return { transaction, authorizationUrl: result.authorizationUrl, gateway: gateway.code };
    } catch (err) {
      const detail = err instanceof GatewayRequestError ? (err.detail ?? err.message) : String(err);
      this.logger.error(`[${gateway.code}] initialize failed for ${reference}: ${detail}`);
      await this.transactionRepository.update(transaction.id, {
        status: TransactionStatus.FAILED,
        gatewayMessage: detail.slice(0, 250),
      });
      throw new BadRequestException(
        err instanceof GatewayRequestError
          ? err.message
          : 'Unable to start the payment. Please try again.',
      );
    }
  }

  // ─── CHARGE SAVED CARD (one-off / renewal, no redirect — Paystack only) ────

  async chargeAuthorization(params: ChargeAuthorizationParams): Promise<Transaction> {
    const reference = this.generateReference();

    let transaction = this.transactionRepository.create({
      reference,
      gateway: PaymentGatewayCode.PAYSTACK,
      userId: params.userId,
      type: params.type,
      purpose: params.purpose ?? null,
      amountKobo: params.amountKobo,
      currency: 'NGN',
      status: TransactionStatus.PENDING,
      relatedEntityType: params.relatedEntityType ?? null,
      relatedEntityId: params.relatedEntityId ?? null,
      metadata: params.metadata ?? null,
      authorizationCode: params.authorizationCode,
    });
    transaction = await this.transactionRepository.save(transaction);

    let result: GatewayChargeResult;
    try {
      result = await this.paystack.chargeAuthorization({
        reference,
        email: params.email,
        amountKobo: params.amountKobo,
        authorizationCode: params.authorizationCode,
        metadata: {
          userId: params.userId,
          type: params.type,
          relatedEntityType: params.relatedEntityType ?? null,
          relatedEntityId: params.relatedEntityId ?? null,
          ...(params.metadata ?? {}),
        },
      });
    } catch (err) {
      const detail = err instanceof GatewayRequestError ? (err.detail ?? err.message) : String(err);
      const failed = await this.applyFailure(transaction, detail);
      throw new BadRequestException(`Card charge failed. ${failed.gatewayMessage ?? ''}`.trim());
    }

    const settled = await this.applyChargeResult(transaction, result);
    if (settled.status !== TransactionStatus.SUCCESS) {
      throw new BadRequestException(`Card charge failed. ${settled.gatewayMessage ?? ''}`.trim());
    }
    return settled;
  }

  // ─── PAYSTACK CUSTOMERS ─────────────────────────────────────────────────────

  async ensurePaystackCustomer(
    email: string,
    firstName?: string,
    lastName?: string,
  ): Promise<string> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<PaystackCustomerResponse>(
          `${this.paystackConf.baseUrl}/customer/${encodeURIComponent(email)}`,
          { headers: this.authHeaders() },
        ),
      );
      return data.data.customer_code;
    } catch {
      // Customer search returned non-200 — fall back to creating new customer entry
    }

    const { data } = await firstValueFrom(
      this.httpService.post<PaystackCustomerResponse>(
        `${this.paystackConf.baseUrl}/customer`,
        { email, first_name: firstName, last_name: lastName },
        { headers: this.authHeaders() },
      ),
    );
    return data.data.customer_code;
  }

  // ─── NATIVE PAYSTACK SUBSCRIPTION (using a saved card, no redirect) ────────

  async createNativeSubscription(params: {
    customerCode: string;
    planCode: string;
    authorizationCode: string;
  }): Promise<PaystackSubscriptionData> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<PaystackCreateSubscriptionResponse>(
          `${this.paystackConf.baseUrl}/subscription`,
          {
            customer: params.customerCode,
            plan: params.planCode,
            authorization: params.authorizationCode,
          },
          { headers: this.authHeaders() },
        ),
      );
      return data.data;
    } catch (err) {
      throw new BadRequestException(
        `Unable to create subscription with Paystack: ${this.extractPaystackError(err)}`,
      );
    }
  }

  async disableNativeSubscription(
    subscriptionCode: string,
    emailToken: string,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.paystackConf.baseUrl}/subscription/disable`,
          { code: subscriptionCode, token: emailToken },
          { headers: this.authHeaders() },
        ),
      );
    } catch (err) {
      throw new BadRequestException(
        `Unable to cancel subscription with Paystack: ${this.extractPaystackError(err)}`,
      );
    }
  }

  // ─── VERIFY (manual / post-redirect confirmation) ──────────────────────────

  async verifyTransaction(reference: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({ where: { reference } });
    if (!transaction) {
      throw new NotFoundException(`Transaction "${reference}" not found.`);
    }
    if (transaction.status === TransactionStatus.SUCCESS) {
      return transaction;
    }

    let result: GatewayChargeResult;
    try {
      result = await this.registry.get(transaction.gateway).verify(reference);
    } catch (err) {
      if (err instanceof GatewayRequestError) {
        this.logger.warn(`[${transaction.gateway}] verify failed for ${reference}: ${err.detail ?? err.message}`);
        throw new BadRequestException(err.message);
      }
      throw err;
    }
    return await this.applyChargeResult(transaction, result);
  }

  // ─── WEBHOOKS (source of truth — gateway -> us) ────────────────────────────

  /** Back-compat entry point (Paystack signature header). */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    return this.handleGatewayWebhook(PaymentGatewayCode.PAYSTACK, rawBody, {
      'x-paystack-signature': signature,
    });
  }

  async handleGatewayWebhook(
    code: string,
    rawBody: Buffer,
    headers: RawHeaders,
  ): Promise<void> {
    const gateway = this.registry.get(code);

    let outcome;
    try {
      outcome = await gateway.parseWebhook(rawBody, headers);
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        this.adminAlertsService
          .raise({
            type: AdminAlertType.FRAUD_ALERT,
            title: `Invalid ${code} webhook signature received`,
            body: `A request hit the ${code} webhook endpoint with a signature that failed verification — likely a forged/replayed request, not real ${code} traffic. It was rejected.`,
            priority: AdminAlertPriority.HIGH,
          })
          .catch((e) => this.logger.error(`fraud_alert admin alert failed: ${e.message}`));
        throw new UnauthorizedException(`Invalid ${code} signature.`);
      }
      if (err instanceof GatewayRequestError) {
        this.logger.warn(`[${code}] webhook not processed: ${err.detail ?? err.message}`);
        // Transient upstream failure → 5xx so the gateway retries. Bad payload → 400.
        if (err.retryable) throw new ServiceUnavailableException('Temporarily unable to process webhook.');
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    // Paystack-only: legacy native-subscription events + disputes.
    if (code === PaymentGatewayCode.PAYSTACK) {
      this.eventEmitter.emit(
        PAYSTACK_WEBHOOK_EVENT,
        new PaystackWebhookReceivedEvent(outcome.eventType, outcome.data),
      );

      if (outcome.eventType === 'charge.dispute.create' || outcome.eventType === 'charge.dispute.remind') {
        const d = outcome.data;
        this.adminAlertsService
          .raise({
            type: AdminAlertType.PAYMENT_DISPUTE,
            title:
              outcome.eventType === 'charge.dispute.create'
                ? 'New payment dispute opened'
                : 'Payment dispute reminder — response window closing',
            body: `A dispute was raised on transaction reference "${d?.transaction?.reference ?? d?.reference ?? 'unknown'}". Check the Paystack dashboard for the required response deadline.`,
            priority: AdminAlertPriority.HIGH,
            metadata: d,
          })
          .catch((e) => this.logger.error(`payment_dispute admin alert failed: ${e.message}`));
      }
    }

    if (!outcome.charge) return; // not a charge-state event

    const transaction = await this.transactionRepository.findOne({
      where: { reference: outcome.charge.reference },
    });
    if (!transaction) {
      this.logger.debug(
        `[${code}] charge webhook for untracked reference "${outcome.charge.reference}" — likely a legacy renewal, deferring to listeners.`,
      );
      return;
    }
    if (transaction.gateway !== code) {
      this.logger.warn(
        `[${code}] webhook referenced ${transaction.reference}, which belongs to gateway "${transaction.gateway}" — ignored.`,
      );
      return;
    }
    if (transaction.status === TransactionStatus.SUCCESS) return; // idempotent

    await this.applyChargeResult(transaction, outcome.charge);
  }

  // ─── SHARED RESULT HANDLING (provider-agnostic) ─────────────────────────────

  private async applyChargeResult(
    transaction: Transaction,
    result: GatewayChargeResult,
  ): Promise<Transaction> {
    if (result.status === 'pending') return transaction; // not final — don't fail it

    if (result.status !== 'success') {
      return this.applyFailure(transaction, result.message, result.raw, result.status === 'abandoned');
    }

    // Never trust "success" alone: the money that actually moved must cover
    // what we asked for, in the right currency. Otherwise a user could pay
    // ₦1 against a ₦9,000 order (or a different currency) and get the plan.
    if (
      result.currency !== transaction.currency ||
      result.amountKobo < Number(transaction.amountKobo)
    ) {
      this.logger.error(
        `[${transaction.gateway}] AMOUNT MISMATCH on ${transaction.reference}: expected ${transaction.amountKobo} ${transaction.currency}, got ${result.amountKobo} ${result.currency}.`,
      );
      this.adminAlertsService
        .raise({
          type: AdminAlertType.FRAUD_ALERT,
          title: 'Payment amount mismatch',
          body: `Transaction ${transaction.reference} (${transaction.gateway}) reported success but for ${result.amountKobo} ${result.currency} instead of ${transaction.amountKobo} ${transaction.currency}. Access was NOT granted. Review it before refunding or honouring it manually.`,
          priority: AdminAlertPriority.HIGH,
          metadata: { transactionId: transaction.id, reference: transaction.reference },
        })
        .catch((e) => this.logger.error(`fraud_alert admin alert failed: ${e.message}`));
      return this.applyFailure(transaction, 'Amount mismatch', result.raw);
    }

    // Atomic claim: only one of (webhook, verify-redirect, admin re-verify)
    // wins the transition, so listeners fire exactly once. A late success is
    // honoured after ABANDONED/FAILED too — if money moved, it moved.
    const auth = result.authorization;
    const updateResult = await this.transactionRepository.update(
      { id: transaction.id, status: Not(In([TransactionStatus.SUCCESS, TransactionStatus.REVERSED])) },
      {
        status: TransactionStatus.SUCCESS,
        channel: result.channel,
        cardLast4: auth?.last4 ?? null,
        cardType: auth?.cardType ?? null,
        bank: auth?.bank ?? null,
        authorizationCode: auth?.code ?? transaction.authorizationCode,
        gatewayReference: result.gatewayReference ?? transaction.gatewayReference,
        gatewayMessage: result.message,
        rawPayload: result.raw,
        paidAt: result.paidAt ?? new Date(),
      },
    );

    if (updateResult.affected === 0) {
      return (await this.transactionRepository.findOne({ where: { id: transaction.id } }))!;
    }

    const refreshed = await this.transactionRepository.findOneByOrFail({ id: transaction.id });

    if (auth?.reusable) {
      await this.upsertPaymentMethod(refreshed.userId, auth);
    }

    this.eventEmitter.emit(
      TRANSACTION_SUCCESSFUL_EVENT,
      new TransactionSuccessfulEvent(
        refreshed.id,
        refreshed.userId,
        refreshed.type,
        refreshed.relatedEntityType,
        refreshed.relatedEntityId,
        refreshed.metadata,
        Number(refreshed.amountKobo),
        refreshed.gateway,
        auth?.reusable ? auth.code : null,
      ),
    );

    this.sendReceiptEmail(refreshed).catch((err) =>
      this.logger.error(`Receipt email failed for transaction ${refreshed.id}: ${err.message}`),
    );

    return refreshed;
  }

  private async applyFailure(
    transaction: Transaction,
    reason: string | null,
    rawPayload?: Record<string, any>,
    abandoned = false,
  ): Promise<Transaction> {
    // Only a still-open transaction can fail. Prevents a late/duplicate
    // failure callback from downgrading a SUCCESS, or re-firing listeners.
    if (transaction.status !== TransactionStatus.PENDING) return transaction;

    transaction.status = abandoned ? TransactionStatus.ABANDONED : TransactionStatus.FAILED;
    transaction.gatewayMessage = reason;
    if (rawPayload) transaction.rawPayload = rawPayload;
    const updated = await this.transactionRepository.save(transaction);

    this.eventEmitter.emit(
      TRANSACTION_FAILED_EVENT,
      new TransactionFailedEvent(
        updated.id,
        updated.userId,
        updated.type,
        updated.relatedEntityType,
        updated.relatedEntityId,
        updated.metadata,
        reason,
      ),
    );

    return updated;
  }

  async recordExternalSuccess(params: {
    reference: string;
    userId: string;
    type: TransactionType;
    purpose?: string;
    amountKobo: number;
    relatedEntityType?: string;
    relatedEntityId?: string;
    rawPayload?: Record<string, any>;
    channel?: TransactionChannel;
  }): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      reference: params.reference,
      userId: params.userId,
      type: params.type,
      purpose: params.purpose ?? null,
      amountKobo: params.amountKobo,
      currency: 'NGN',
      status: TransactionStatus.SUCCESS,
      channel: params.channel ?? null,
      relatedEntityType: params.relatedEntityType ?? null,
      relatedEntityId: params.relatedEntityId ?? null,
      rawPayload: params.rawPayload ?? null,
      paidAt: new Date(),
    });
    return await this.transactionRepository.save(transaction);
  }

  // ─── PAYMENT METHODS ────────────────────────────────────────────────────────

  private async upsertPaymentMethod(
    userId: string,
    authorization: GatewayAuthorization,
  ): Promise<void> {
    // Scoped to THIS user: a card fingerprint is not globally unique across
    // accounts (shared family cards), and one user's payment must never
    // rewrite another user's stored authorization.
    const existing = authorization.signature
      ? await this.paymentMethodRepository.findOne({
          where: { userId, signature: authorization.signature },
        })
      : null;
    if (existing) {
      existing.authorizationCode = authorization.code;
      await this.paymentMethodRepository.save(existing);
      return;
    }

    const hasAnyCard = await this.paymentMethodRepository.exist({ where: { userId } });

    await this.paymentMethodRepository.save(
      this.paymentMethodRepository.create({
        userId,
        authorizationCode: authorization.code,
        last4: authorization.last4,
        cardType: authorization.cardType,
        bank: authorization.bank,
        expMonth: authorization.expMonth,
        expYear: authorization.expYear,
        signature: authorization.signature,
        isDefault: !hasAnyCard,
      }),
    );
  }

  async findPaymentMethodByAuthorization(
    userId: string,
    authorizationCode: string,
  ): Promise<PaymentMethod | null> {
    return this.paymentMethodRepository.findOne({ where: { userId, authorizationCode } });
  }

  async getPaymentMethod(userId: string, id: string): Promise<PaymentMethod | null> {
    return this.paymentMethodRepository.findOne({ where: { id, userId } });
  }

  private async sendReceiptEmail(transaction: Transaction): Promise<void> {
    const user = await this.userService.findById(transaction.userId);
    if (!user?.email) return;

    await this.mailService.sendPaymentReceiptEmail(user.email, {
      firstName: user.firstName ?? 'there',
      description: this.describeTransaction(transaction),
      amount: this.formatNaira(transaction.amountKobo),
      date: (transaction.paidAt ?? transaction.createdAt).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      reference: transaction.gatewayReference ?? transaction.reference,
      paymentMethod: transaction.cardLast4
        ? `${transaction.cardType ?? 'Card'} ending in ${transaction.cardLast4}`
        : (transaction.channel ?? transaction.gateway ?? 'Card'),
      invoiceNumber: transaction.reference,
    });
  }

  private describeTransaction(transaction: Transaction): string {
    if (transaction.type === TransactionType.SUBSCRIPTION) {
      const plan = (transaction.metadata as Record<string, any> | null)?.tier;
      return plan ? `Gravitest ${plan} subscription` : 'Gravitest subscription';
    }
    if (transaction.type === TransactionType.CONTENT_PURCHASE) return 'Gravitest content purchase';
    if (transaction.type === TransactionType.WALLET_FUNDING) return 'Gravitest wallet funding';
    return 'Gravitest payment';
  }

  private formatNaira(amountKobo: number | string): string {
    const naira = Number(amountKobo) / 100;
    return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  }

  /**
   * Backs the "Email Receipt" button in the billing UI — re-sends the same
   * receipt template on demand rather than requiring the user to dig
   * through their inbox for the original.
   */
  async resendReceipt(userId: string, transactionId: string): Promise<{ sent: boolean }> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, userId },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status !== TransactionStatus.SUCCESS) {
      throw new BadRequestException('Only successful transactions have a receipt to resend');
    }
    await this.sendReceiptEmail(transaction);
    return { sent: true };
  }

  async listPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return await this.paymentMethodRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── USAGE SUMMARY (for Billing "This Billing Period" card) ────────────
  // Period is the user's current billing cycle if they have an active
  // subscription (subscription.startedAt -> now, or -> expiresAt if that's
  // in the past), otherwise falls back to the current calendar month —
  // matches what a free-tier user would expect to see.
  //
  // NOTE: intentionally does not return storageUsedMB or
  // videoMinutesWatched — neither is tracked anywhere in this schema (see
  // comment on StudentsService.getExamUsageStats). Returning fabricated
  // zeros for them would look like real data; omitting the fields is the
  // honest option, and the frontend has been updated to only render what's
  // actually returned here.
  async getUsageSummary(
    userId: string,
    activeSubscription?: { startedAt: Date; expiresAt: Date | null } | null,
  ): Promise<{
    periodStart: string;
    periodEnd: string;
    examSessions: number;
    questionsAnswered: number;
    aiRequestsUsed: number;
  }> {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (activeSubscription) {
      periodStart = activeSubscription.startedAt;
      periodEnd = activeSubscription.expiresAt ?? now;
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const [examUsage, aiRequestsUsed] = await Promise.all([
      this.studentsService.getExamUsageStats(userId, periodStart, periodEnd),
      this.aiUsageLogRepository
        .createQueryBuilder('l')
        .where('l.userId = :userId', { userId })
        .andWhere('l.createdAt >= :periodStart', { periodStart })
        .andWhere('l.createdAt <= :periodEnd', { periodEnd })
        .getCount(),
    ]);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      examSessions: examUsage.examSessions,
      questionsAnswered: examUsage.questionsAnswered,
      aiRequestsUsed,
    };
  }

  async getDefaultPaymentMethod(userId: string): Promise<PaymentMethod | null> {
    return await this.paymentMethodRepository.findOne({
      where: { userId, isDefault: true },
    });
  }

  async setDefaultPaymentMethod(
    userId: string,
    id: string,
  ): Promise<PaymentMethod> {
    const card = await this.paymentMethodRepository.findOne({
      where: { id, userId },
    });
    if (!card) throw new NotFoundException('Payment method not found.');

    await this.paymentMethodRepository.update({ userId }, { isDefault: false });
    card.isDefault = true;
    return await this.paymentMethodRepository.save(card);
  }

  async removePaymentMethod(
    userId: string,
    id: string,
  ): Promise<{ id: string }> {
    const card = await this.paymentMethodRepository.findOne({
      where: { id, userId },
    });
    if (!card) throw new NotFoundException('Payment method not found.');
    if (card.isDefault) {
      throw new BadRequestException(
        'Cannot remove your default card. Set another card as default first.',
      );
    }
    await this.paymentMethodRepository.delete(id);
    return { id };
  }

  // ─── QUERIES ────────────────────────────────────────────────────────────────

  async findAllForAdmin(
    filters: TransactionFiltersDto,
  ): Promise<PaginatedResult<Transaction>> {
    const {
      page = 1,
      limit = 50,
      status,
      type,
      gateway,
      from,
      to,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;
    const qb = this.transactionRepository.createQueryBuilder('t');
    this.applyCommonFilters(qb, { status, type, gateway, from, to, search });

    const allowedSorts: Record<string, string> = {
      createdAt: 't.createdAt',
      amountKobo: 't.amountKobo',
      paidAt: 't.paidAt',
    };
    qb.orderBy(allowedSorts[sortBy] ?? 't.createdAt', sortOrder);
    return await this.paginationProvider.paginateQueryBuilder(qb, {
      page,
      limit,
    });
  }

  async findAllForUser(
    userId: string,
    filters: TransactionFiltersDto,
  ): Promise<PaginatedResult<Transaction>> {
    const {
      page = 1,
      limit = 50,
      status,
      type,
      gateway,
      from,
      to,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;
    const qb = this.transactionRepository
      .createQueryBuilder('t')
      .andWhere('t.userId = :userId', { userId });
    this.applyCommonFilters(qb, { status, type, gateway, from, to, search });

    const allowedSorts: Record<string, string> = {
      createdAt: 't.createdAt',
      amountKobo: 't.amountKobo',
      paidAt: 't.paidAt',
    };
    qb.orderBy(allowedSorts[sortBy] ?? 't.createdAt', sortOrder);
    return await this.paginationProvider.paginateQueryBuilder(qb, {
      page,
      limit,
    });
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction "${id}" not found.`);
    }
    return transaction;
  }

  async findOneForUser(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.findOne(id);
    if (transaction.userId !== userId) {
      throw new ForbiddenException('This transaction does not belong to you.');
    }
    return transaction;
  }

  async getAdminStats(): Promise<{
    totalRevenueKobo: number;
    revenueThisMonthKobo: number;
    revenueLastMonthKobo: number;
    countByStatus: Record<string, number>;
    countByType: Record<string, number>;
  }> {
    const base = this.transactionRepository.createQueryBuilder('t');
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalRaw, thisMonthRaw, lastMonthRaw, byStatusRaw, byTypeRaw] =
      await Promise.all([
        base
          .clone()
          .select('COALESCE(SUM(t.amountKobo), 0)', 'sum')
          .where('t.status = :s', { s: TransactionStatus.SUCCESS })
          .getRawOne<{ sum: string }>(),
        base
          .clone()
          .select('COALESCE(SUM(t.amountKobo), 0)', 'sum')
          .where('t.status = :s', { s: TransactionStatus.SUCCESS })
          .andWhere('t.paidAt >= :start', { start: startOfThisMonth })
          .getRawOne<{ sum: string }>(),
        base
          .clone()
          .select('COALESCE(SUM(t.amountKobo), 0)', 'sum')
          .where('t.status = :s', { s: TransactionStatus.SUCCESS })
          .andWhere('t.paidAt >= :start AND t.paidAt < :end', {
            start: startOfLastMonth,
            end: startOfThisMonth,
          })
          .getRawOne<{ sum: string }>(),
        base
          .clone()
          .select('t.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .groupBy('t.status')
          .getRawMany<{ status: string; count: string }>(),
        base
          .clone()
          .select('t.type', 'type')
          .addSelect('COUNT(*)', 'count')
          .groupBy('t.type')
          .getRawMany<{ type: string; count: string }>(),
      ]);

    const toMap = (rows: Record<string, any>[], key: string) =>
      Object.fromEntries(rows.map((r) => [r[key], Number(r.count)]));

    return {
      totalRevenueKobo: Number(totalRaw?.sum ?? 0),
      revenueThisMonthKobo: Number(thisMonthRaw?.sum ?? 0),
      revenueLastMonthKobo: Number(lastMonthRaw?.sum ?? 0),
      countByStatus: toMap(byStatusRaw, 'status'),
      countByType: toMap(byTypeRaw, 'type'),
    };
  }

  // ─── PRIVATE HELPERS ────────────────────────────────────────────────────────

  private applyCommonFilters(
    qb: SelectQueryBuilder<Transaction>,
    f: {
      status?: TransactionStatus;
      type?: TransactionType;
      gateway?: string;
      from?: string;
      to?: string;
      search?: string;
    },
  ) {
    if (f.status) qb.andWhere('t.status = :status', { status: f.status });
    if (f.type) qb.andWhere('t.type = :type', { type: f.type });
    if (f.gateway) qb.andWhere('t.gateway = :gateway', { gateway: f.gateway });
    if (f.from) qb.andWhere('t.createdAt >= :from', { from: f.from });
    if (f.to) qb.andWhere('t.createdAt <= :to', { to: f.to });
    if (f.search) {
      qb.andWhere(
        '(t.reference ILIKE :search OR t.gatewayReference ILIKE :search OR t.userId::text ILIKE :search)',
        { search: `%${f.search}%` },
      );
    }
  }

  private generateReference(): string {
    return `gtx_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;
  }

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.paystackConf.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  private extractPaystackError(err: unknown): string {
    const axiosErr = err as AxiosError<{ message?: string }>;
    return (
      axiosErr?.response?.data?.message ??
      axiosErr?.message ??
      'Unknown Paystack error'
    );
  }
}
