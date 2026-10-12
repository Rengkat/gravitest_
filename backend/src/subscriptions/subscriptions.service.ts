import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, LessThanOrEqual, Not, Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';

import { UserService } from 'src/user/user.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import {
  PaystackWebhookReceivedEvent,
  TransactionFailedEvent,
  TransactionSuccessfulEvent,
  PAYSTACK_WEBHOOK_EVENT,
  TRANSACTION_FAILED_EVENT,
  TRANSACTION_SUCCESSFUL_EVENT,
} from 'src/transactions/events/transaction.events';
import {
  BillingInterval,
  SubscriptionStatus,
  SubscriptionTier,
  TransactionType,
  AdminAlertPriority,
  AdminAlertType,
  NotificationType,
  PaymentGatewayCode,
} from 'src/common/enums/enums';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginatedResult } from 'src/common/pagination/pagination.interface';
import { AdminAlertsService } from 'src/admin-alerts/admin-alerts.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PlansService } from 'src/plans/plans.service';
import { Plan } from 'src/plans/entities/plan.entity';
import { PaymentGatewaysService } from 'src/payments/payment-gateways.service';
import { PaymentGatewayRegistry } from 'src/payments/payment-gateway.registry';

import { SubscribeDto } from './dto/subscribe.dto';
import { SubscriptionFiltersDto } from './dto/subscription-filters.dto';
import { Subscription } from './entities/subscription.entity';

const RELATED_ENTITY_TYPE = 'subscription';

/** Failed renewals keep access for this long while we retry the card. */
export const RENEWAL_GRACE_DAYS = 3;
export const RENEWAL_GRACE_MS = RENEWAL_GRACE_DAYS * 24 * 60 * 60 * 1000;
/** Max card attempts per billing period (≈ one a day through the grace window). */
const MAX_RENEWAL_ATTEMPTS = 3;
/** Minimum gap between two attempts on the same subscription. */
const MIN_ATTEMPT_GAP_MS = 20 * 60 * 60 * 1000;
/** Re-buying the plan you're already on is only allowed this close to expiry. */
const EARLY_RENEWAL_WINDOW_DAYS = 7;
const REMINDER_THRESHOLDS = [7, 3, 1];

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectDataSource() private readonly dataSource: DataSource,

    private readonly transactionsService: TransactionsService,
    private readonly userService: UserService,
    private readonly paginationProvider: PaginationProvider,
    private readonly adminAlertsService: AdminAlertsService,
    private readonly notifications: NotificationsService,
    private readonly plans: PlansService,
    private readonly gateways: PaymentGatewaysService,
    private readonly registry: PaymentGatewayRegistry,
  ) {}

  // ─── PLAN CATALOG (admin-managed — see PlansService) ──────────────────────

  getPlans() {
    return this.plans.listPublic();
  }

  // ─── STUDENT-FACING ─────────────────────────────────────────────────────────

  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: [
        { user: { id: userId }, status: SubscriptionStatus.ACTIVE },
        { user: { id: userId }, status: SubscriptionStatus.PAST_DUE },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  // The user's plan history. Checkouts that were started but never paid for
  // (PENDING, or CANCELLED with no expiry on a paid plan — activation is what
  // sets expiresAt) are NOT history: they would otherwise show up as phantom
  // "cancelled"/"expired" plans every time someone abandons a payment page.
  async getSubscriptionHistory(userId: string): Promise<Subscription[]> {
    const mine = { user: { id: userId } };
    return this.subscriptionRepository.find({
      where: [
        { ...mine, status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE, SubscriptionStatus.EXPIRED]) },
        { ...mine, status: SubscriptionStatus.CANCELLED, expiresAt: Not(IsNull()) },
        { ...mine, status: SubscriptionStatus.CANCELLED, amountKobo: 0 }, // free-plan rows
      ],
      order: { createdAt: 'DESC' },
    });
  }

  // Delegates the actual aggregation to TransactionsService.getUsageSummary
  // — lives here (not on TransactionsService directly, callable) because
  // this is the one place that already has both the current Subscription
  // (for period bounds) and TransactionsService injected, without
  // introducing a SubscriptionsModule <-> TransactionsModule import cycle.
  async getUsageSummary(userId: string) {
    const subscription = await this.getCurrentSubscription(userId);
    return this.transactionsService.getUsageSummary(
      userId,
      subscription ? { startedAt: subscription.startedAt, expiresAt: subscription.expiresAt } : null,
    );
  }

  // Subscribe / upgrade / downgrade.
  //  - FREE plan: activates immediately; any paid plan stops billing.
  //  - Paid + paymentMethodId: charges that saved card (Paystack) and activates
  //    immediately, no redirect.
  //  - Paid, no saved card: returns the chosen gateway's hosted checkout URL;
  //    the subscription activates when the payment is confirmed (webhook, or
  //    the post-redirect verify — whichever lands first, exactly once).
  //
  // Billing is "managed": WE hold the schedule and charge renewals from the
  // plan's price snapshot (see processRenewals). We don't use Paystack native
  // plans any more because their price is frozen on Paystack's side, which
  // would defeat admin-editable prices/promos — and OPay has no recurring
  // primitive at all. Pre-existing native subscriptions keep working (below).
  async subscribe(
    userId: string,
    dto: SubscribeDto,
  ): Promise<{ authorizationUrl?: string; gateway?: string; subscription: Subscription }> {
    const plan = await this.resolvePlan(dto);
    if (!plan.isSelfServe) {
      throw new BadRequestException(
        `"${plan.name}" is arranged with our sales team — please contact us to get started.`,
      );
    }

    const user = await this.userService.findById(userId);

    if (plan.tier === SubscriptionTier.FREE) {
      const subscription = await this.activateSubscriptionRow({
        userId,
        tier: plan.tier,
        interval: null,
        amountKobo: 0,
        plan,
      });
      return { subscription };
    }

    const current = await this.getCurrentSubscription(userId);
    if (current && current.planId === plan.id && current.status === SubscriptionStatus.ACTIVE) {
      const left = current.daysRemaining();
      if (left !== null && left > EARLY_RENEWAL_WINDOW_DAYS) {
        throw new BadRequestException(
          `You're already on ${plan.name} (${left} days left). You can renew within ${EARLY_RENEWAL_WINDOW_DAYS} days of expiry.`,
        );
      }
    }

    // What the customer pays NOW (promo-aware) vs what renewals cost (list).
    const price = this.plans.getEffectivePrice(plan);
    if (price.amountKobo <= 0) {
      throw new BadRequestException('This plan has no payable price configured.');
    }

    // Saved cards are Paystack tokens, so a card implies Paystack.
    let card: Awaited<ReturnType<TransactionsService['getPaymentMethod']>> = null;
    if (dto.paymentMethodId) {
      if (dto.gateway && dto.gateway !== PaymentGatewayCode.PAYSTACK) {
        throw new BadRequestException('Saved cards can only be used with Paystack.');
      }
      card = await this.transactionsService.getPaymentMethod(userId, dto.paymentMethodId);
      if (!card) throw new NotFoundException('Payment method not found.');
    }
    // Validates enabled + configured BEFORE we create any rows.
    const gateway = await this.gateways.resolveForCheckout(
      card ? PaymentGatewayCode.PAYSTACK : dto.gateway,
    );

    let subscription = await this.subscriptionRepository.save(
      this.subscriptionRepository.create({
        tier: plan.tier,
        billingInterval: plan.interval,
        amountKobo: price.amountKobo,
        renewalAmountKobo: price.listAmountKobo,
        planId: plan.id,
        planCode: plan.code,
        gateway: gateway.code,
        status: SubscriptionStatus.PENDING,
        startedAt: new Date(),
        autoRenew: false, // decided when the first payment lands
        user,
      }),
    );

    const purpose = plan.code;
    const metadata = { planId: plan.id, planCode: plan.code, promo: price.isPromo };

    if (card) {
      try {
        const tx = await this.transactionsService.chargeAuthorization({
          userId,
          email: user.email,
          amountKobo: price.amountKobo,
          type: TransactionType.SUBSCRIPTION,
          purpose,
          relatedEntityType: RELATED_ENTITY_TYPE,
          relatedEntityId: subscription.id,
          authorizationCode: card.authorizationCode,
          metadata,
        });
        // Apply synchronously so the response reflects the active plan. The
        // success event handler runs too; lastTransactionId makes it a no-op.
        subscription =
          (await this.applyPayment(subscription.id, userId, tx.id, {
            authorizationCode: card.authorizationCode,
          })) ?? subscription;
        return { subscription, gateway: gateway.code };
      } catch (err) {
        await this.cancelIfNeverActivated(subscription.id);
        throw err;
      }
    }

    try {
      const { authorizationUrl } = await this.transactionsService.initializeTransaction({
        userId,
        email: user.email,
        amountKobo: price.amountKobo,
        type: TransactionType.SUBSCRIPTION,
        purpose,
        relatedEntityType: RELATED_ENTITY_TYPE,
        relatedEntityId: subscription.id,
        gateway: gateway.code,
        customer: { name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || undefined },
        metadata,
      });
      return { authorizationUrl, gateway: gateway.code, subscription };
    } catch (err) {
      await this.cancelIfNeverActivated(subscription.id);
      throw err;
    }
  }

  // Cancel at period end — access continues until `expiresAt`, no further
  // charges (we call Paystack's disable endpoint immediately so THEY stop
  // auto-billing, but leave status ACTIVE locally until it actually expires).
  async cancelSubscription(
    userId: string,
    reason?: string,
  ): Promise<Subscription> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription)
      throw new NotFoundException('No active subscription found.');

    const emailToken = subscription.paystackEmailToken;
    if (subscription.paystackSubscriptionCode && emailToken) {
      await this.transactionsService.disableNativeSubscription(
        subscription.paystackSubscriptionCode,
        emailToken,
      );
    } else if (subscription.paystackSubscriptionCode) {
      this.logger.warn(
        `Subscription ${subscription.id} has a paystackSubscriptionCode but no email_token stored — cannot auto-disable on Paystack. Ensure paystackEmailToken is mapped on the Subscription entity.`,
      );
    }

    subscription.autoRenew = false;
    subscription.cancelledAt = new Date();
    return this.subscriptionRepository.save(subscription);
  }

  // ─── ADMIN ──────────────────────────────────────────────────────────────────

  async findAllForAdmin(
    filters: SubscriptionFiltersDto,
  ): Promise<PaginatedResult<Subscription>> {
    const {
      page = 1,
      limit = 50,
      status,
      tier,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const qb = this.subscriptionRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.user', 'user');
    if (status) qb.andWhere('s.status = :status', { status });
    if (tier) qb.andWhere('s.tier = :tier', { tier });

    const allowedSorts: Record<string, string> = {
      createdAt: 's.createdAt',
      startedAt: 's.startedAt',
      expiresAt: 's.expiresAt',
    };
    qb.orderBy(allowedSorts[sortBy] ?? 's.createdAt', sortOrder);
    return this.paginationProvider.paginateQueryBuilder(qb, { page, limit });
  }

  async getStats(): Promise<{
    activeCount: number;
    cancelledCount: number;
    expiredCount: number;
    pastDueCount: number;
    estimatedMonthlyRecurringRevenueKobo: number;
  }> {
    const base = this.subscriptionRepository.createQueryBuilder('s');

    const [
      activeCount,
      cancelledCount,
      expiredCount,
      pastDueCount,
      activeSubs,
    ] = await Promise.all([
      base
        .clone()
        .andWhere('s.status = :st', { st: SubscriptionStatus.ACTIVE })
        .getCount(),
      base
        .clone()
        .andWhere('s.status = :st', { st: SubscriptionStatus.CANCELLED })
        .getCount(),
      base
        .clone()
        .andWhere('s.status = :st', { st: SubscriptionStatus.EXPIRED })
        .getCount(),
      base
        .clone()
        .andWhere('s.status = :st', { st: SubscriptionStatus.PAST_DUE })
        .getCount(),
      base
        .clone()
        .andWhere('s.status = :st', { st: SubscriptionStatus.ACTIVE })
        .getMany(),
    ]);

    const estimatedMonthlyRecurringRevenueKobo = activeSubs.reduce((sum, s) => {
      if (s.tier === SubscriptionTier.FREE) return sum;
      const monthly =
        s.billingInterval === BillingInterval.ANNUALLY
          ? s.amountKobo / 12
          : s.amountKobo;
      return sum + monthly;
    }, 0);

    return {
      activeCount,
      cancelledCount,
      expiredCount,
      pastDueCount,
      estimatedMonthlyRecurringRevenueKobo,
    };
  }

  // ─── EVENT LISTENERS ────────────────────────────────────────────────────────

  // First payment (redirect checkout) and managed renewals both land here.
  // `renewal: true` in the transaction metadata marks a renewal charge.
  @OnEvent(TRANSACTION_SUCCESSFUL_EVENT)
  async handleTransactionSuccessful(event: TransactionSuccessfulEvent) {
    if (
      event.type !== TransactionType.SUBSCRIPTION ||
      event.relatedEntityType !== RELATED_ENTITY_TYPE ||
      !event.relatedEntityId
    ) {
      return;
    }
    try {
      await this.applyPayment(event.relatedEntityId, event.userId, event.transactionId, {
        authorizationCode: event.authorizationCode,
        renewal: event.metadata?.renewal === true,
      });
    } catch (err: any) {
      // Money has moved; a failure here must be loud, not swallowed.
      this.logger.error(
        `Could not apply payment ${event.transactionId} to subscription ${event.relatedEntityId}: ${err.message}`,
        err.stack,
      );
      this.adminAlertsService
        .raise({
          type: AdminAlertType.SUBSCRIPTION_EXPIRING,
          title: 'Paid subscription not activated',
          body: `Payment ${event.transactionId} succeeded but subscription ${event.relatedEntityId} could not be activated (${err.message}). Activate it manually.`,
          priority: AdminAlertPriority.HIGH,
          metadata: { transactionId: event.transactionId, subscriptionId: event.relatedEntityId },
        })
        .catch(() => undefined);
    }
  }

  @OnEvent(TRANSACTION_FAILED_EVENT)
  async handleTransactionFailed(event: TransactionFailedEvent) {
    if (
      event.type !== TransactionType.SUBSCRIPTION ||
      event.relatedEntityType !== RELATED_ENTITY_TYPE ||
      !event.relatedEntityId
    ) {
      return;
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { id: event.relatedEntityId },
    });
    if (!subscription) return;

    if (subscription.status === SubscriptionStatus.PENDING) {
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelledAt = new Date();
    } else {
      subscription.status = SubscriptionStatus.PAST_DUE;
    }
    await this.subscriptionRepository.save(subscription);
  }

  // Handles everything Paystack sends that TransactionsService doesn't
  // interpret itself: subscription.create (capture subscription_code +
  // email_token once Paystack assigns them), subscription.disable,
  // subscription.not_renew, invoice.payment_failed, and renewal
  // charge.success events (no matching local Transaction row, since
  // Paystack initiated those on its own schedule).
  @OnEvent(PAYSTACK_WEBHOOK_EVENT)
  async handlePaystackWebhook(event: PaystackWebhookReceivedEvent) {
    switch (event.eventType) {
      case 'subscription.create':
        return this.onSubscriptionCreate(event.data);
      case 'subscription.disable':
        return this.onSubscriptionDisable(event.data);
      case 'subscription.not_renew':
        return this.onSubscriptionNotRenew(event.data);
      case 'invoice.payment_failed':
        return this.onInvoicePaymentFailed(event.data);
      case 'charge.success':
        return this.onPossibleRenewalCharge(event.data);
      default:
        return;
    }
  }

  private async onSubscriptionCreate(data: Record<string, any>) {
    const subscription = await this.findByPlanAndEmail(
      data.plan?.plan_code,
      data.customer?.email,
    );
    if (!subscription) return;
    subscription.paystackSubscriptionCode =
      data.subscription_code ?? subscription.paystackSubscriptionCode;
    subscription.paystackEmailToken =
      data.email_token ?? subscription.paystackEmailToken;
    subscription.paystackCustomerCode =
      data.customer?.customer_code ?? subscription.paystackCustomerCode;
    await this.subscriptionRepository.save(subscription);
  }

  private async onSubscriptionDisable(data: Record<string, any>) {
    const subscription = await this.findBySubscriptionCode(
      data.subscription_code,
    );
    if (!subscription) return;
    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.autoRenew = false;
    await this.subscriptionRepository.save(subscription);
  }

  private async onSubscriptionNotRenew(data: Record<string, any>) {
    const subscription = await this.findBySubscriptionCode(
      data.subscription_code,
    );
    if (!subscription) return;
    subscription.autoRenew = false;
    await this.subscriptionRepository.save(subscription);
  }

  private async onInvoicePaymentFailed(data: Record<string, any>) {
    const subscriptionCode = data.subscription?.subscription_code;
    const subscription = subscriptionCode
      ? await this.findBySubscriptionCode(subscriptionCode)
      : await this.findByPlanAndEmail(
          data.plan?.plan_code ?? data.subscription?.plan?.plan_code,
          data.customer?.email,
        );
    if (!subscription) return;
    subscription.status = SubscriptionStatus.PAST_DUE;
    await this.subscriptionRepository.save(subscription);
  }

  // A charge.success webhook Paystack initiated itself on schedule for an
  // existing subscription (renewal). We never created a local Transaction
  // row for these up front, so TransactionsService just broadcasts and
  // leaves it to us.
  private async onPossibleRenewalCharge(data: Record<string, any>) {
    if (!data.plan?.plan_code || !data.customer?.email) return; // not subscription-related

    const subscription = await this.findByPlanAndEmail(
      data.plan.plan_code,
      data.customer.email,
    );
    if (!subscription) return;

    // Skip if this is actually the FIRST charge (already handled via
    // TRANSACTION_SUCCESSFUL_EVENT using our own generated reference).
    const alreadyTracked = subscription.paystackSubscriptionCode != null;
    if (!alreadyTracked) return;

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.expiresAt = subscription.billingInterval
      ? this.computeExpiry(new Date(), subscription.billingInterval)
      : null;
    await this.subscriptionRepository.save(subscription);

    await this.transactionsService.recordExternalSuccess({
      reference: String(data.id ?? data.reference ?? `renewal_${Date.now()}`),
      userId: subscription.user.id,
      type: TransactionType.SUBSCRIPTION,
      purpose: `${subscription.tier}_renewal`,
      amountKobo: data.amount ?? subscription.amountKobo,
      relatedEntityType: RELATED_ENTITY_TYPE,
      relatedEntityId: subscription.id,
      rawPayload: data,
    });
  }

  // ─── BILLING JOBS ───────────────────────────────────────────────────────────

  // Managed renewals + dunning. Runs every 6h; each subscription is charged at
  // most once per ~day and at most MAX_RENEWAL_ATTEMPTS times per period.
  // Access continues through the grace window; after it, the plan lapses.
  @Cron(CronExpression.EVERY_6_HOURS)
  async processRenewals(): Promise<void> {
    const now = new Date();
    const due = await this.subscriptionRepository.find({
      where: {
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE]),
        autoRenew: true,
        paystackSubscriptionCode: IsNull(), // legacy native subs are billed by Paystack
        paymentMethodId: Not(IsNull()),
        expiresAt: LessThanOrEqual(now),
      },
      relations: ['user'],
      take: 200,
    });

    for (const sub of due) {
      try {
        await this.renewOne(sub, now);
      } catch (err: any) {
        this.logger.error(`Renewal of ${sub.id} crashed: ${err.message}`, err.stack);
      }
    }
  }

  private async renewOne(sub: Subscription, now: Date): Promise<void> {
    const graceEnds = sub.expiresAt!.getTime() + RENEWAL_GRACE_MS;
    if (now.getTime() > graceEnds || sub.renewalAttempts >= MAX_RENEWAL_ATTEMPTS) {
      await this.lapse(sub, 'We could not renew your subscription.');
      return;
    }

    // Multi-instance safe: only the process that wins this claim charges.
    if (!(await this.claimRenewalAttempt(sub.id, now))) return;

    const amount = sub.renewalAmountKobo ?? sub.amountKobo;
    try {
      const card = sub.paymentMethodId
        ? await this.transactionsService.getPaymentMethod(sub.user.id, sub.paymentMethodId)
        : null;
      if (!card) throw new Error('The saved card was removed.');

      const tx = await this.transactionsService.chargeAuthorization({
        userId: sub.user.id,
        email: sub.user.email,
        amountKobo: amount,
        type: TransactionType.SUBSCRIPTION,
        purpose: `${sub.planCode ?? sub.tier}_renewal`,
        relatedEntityType: RELATED_ENTITY_TYPE,
        relatedEntityId: sub.id,
        authorizationCode: card.authorizationCode,
        metadata: { renewal: true, planId: sub.planId, planCode: sub.planCode },
      });
      await this.applyPayment(sub.id, sub.user.id, tx.id, {
        authorizationCode: card.authorizationCode,
        renewal: true,
      });
    } catch (err: any) {
      await this.onRenewalFailed(sub, amount, err.message);
    }
  }

  private async claimRenewalAttempt(id: string, now: Date): Promise<boolean> {
    return this.dataSource.transaction(async (m) => {
      const repo = m.getRepository(Subscription);
      const s = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!s) return false;
      if (
        s.lastRenewalAttemptAt &&
        now.getTime() - s.lastRenewalAttemptAt.getTime() < MIN_ATTEMPT_GAP_MS
      ) {
        return false;
      }
      s.lastRenewalAttemptAt = now;
      s.renewalAttempts += 1;
      await repo.save(s);
      return true;
    });
  }

  private async onRenewalFailed(sub: Subscription, amountKobo: number, reason: string) {
    await this.subscriptionRepository.update(
      { id: sub.id, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.PAST_DUE },
    );
    const attemptsLeft = Math.max(0, MAX_RENEWAL_ATTEMPTS - (sub.renewalAttempts + 1));
    this.notifications
      .notifyBoth({
        userId: sub.user.id,
        type: NotificationType.PAYMENT_FAILED,
        context: {
          amount: amountKobo / 100,
          reason:
            attemptsLeft > 0
              ? `We'll try again shortly. To avoid losing access, update your card or renew at /pricing.`
              : `Your access will end soon. Renew at /pricing to keep it.`,
        },
        actionUrl: '/pricing',
      })
      .catch((e) => this.logger.warn(`renewal-failed notification failed: ${e.message}`));
    this.logger.warn(`Renewal attempt failed for ${sub.id}: ${reason}`);
  }

  private async lapse(sub: Subscription, why: string) {
    sub.status = SubscriptionStatus.EXPIRED;
    sub.autoRenew = false;
    await this.subscriptionRepository.save(sub);
    this.notifications
      .notifyBoth({
        userId: sub.user.id,
        type: NotificationType.SUBSCRIPTION_EXPIRING,
        context: { daysLeft: 0, tier: sub.tier },
        actionUrl: '/pricing',
        metadata: { reason: why },
      })
      .catch(() => undefined);
  }

  // Daily "your plan is about to end" nudges for subscriptions that will NOT
  // renew themselves (OPay / no saved card / user cancelled). Each threshold
  // (7, 3, 1 days) fires once per period.
  @Cron('0 8 * * *')
  async sendExpiryReminders(): Promise<void> {
    const now = new Date();
    const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const subs = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        autoRenew: false,
        tier: Not(SubscriptionTier.FREE),
        expiresAt: LessThanOrEqual(horizon),
      },
      relations: ['user'],
      take: 500,
    });

    for (const s of subs) {
      const daysLeft = s.daysRemaining();
      if (daysLeft === null || daysLeft <= 0) continue;
      const threshold = [...REMINDER_THRESHOLDS].reverse().find((t) => daysLeft <= t);
      if (threshold === undefined) continue;
      if (s.lastReminderDays !== null && s.lastReminderDays <= threshold) continue;

      s.lastReminderDays = threshold;
      await this.subscriptionRepository.save(s);
      this.notifications
        .notifyBoth({
          userId: s.user.id,
          type: NotificationType.SUBSCRIPTION_EXPIRING,
          context: { daysLeft, tier: s.tier },
          actionUrl: '/pricing',
        })
        .catch((e) => this.logger.warn(`expiry reminder failed: ${e.message}`));
    }
  }

  // Safety net: expires non-renewing plans that ran out, tidies abandoned
  // checkouts, and flags LEGACY native-Paystack subs whose renewal webhook
  // never arrived (managed subs are handled by processRenewals).
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireLapsedSubscriptions(): Promise<void> {
    const now = new Date();

    const overdueNoRenew = await this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.ACTIVE, autoRenew: false },
    });
    for (const s of overdueNoRenew) {
      if (s.expiresAt && s.expiresAt < now) {
        s.status = SubscriptionStatus.EXPIRED;
        await this.subscriptionRepository.save(s);
      }
    }

    // Checkouts nobody finished. Cancelled (not deleted) so a very late
    // payment can still activate them — see applyPayment.
    const staleBefore = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    await this.subscriptionRepository.update(
      { status: SubscriptionStatus.PENDING, createdAt: LessThanOrEqual(staleBefore) },
      { status: SubscriptionStatus.CANCELLED, cancelledAt: now },
    );

    const overdueAutoRenew = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        paystackSubscriptionCode: Not(IsNull()),
      },
    });
    for (const s of overdueAutoRenew) {
      if (s.expiresAt && s.expiresAt.getTime() + RENEWAL_GRACE_MS < now.getTime()) {
        const days = Math.floor((now.getTime() - s.expiresAt.getTime()) / 86400000);
        this.logger.warn(`Legacy subscription ${s.id} is ${days} days overdue with no renewal webhook.`);
        s.status = SubscriptionStatus.PAST_DUE;
        await this.subscriptionRepository.save(s);

        this.adminAlertsService
          .raise({
            type: AdminAlertType.SUBSCRIPTION_EXPIRING,
            title: 'Auto-renew subscription overdue — no renewal webhook',
            body: `Subscription ${s.id} (tier: ${s.tier}) is ${days} days past expiry with no renewal charge. Marked PAST_DUE — check the Paystack dashboard.`,
            priority: AdminAlertPriority.MEDIUM,
            actionUrl: `/admin/subscriptions/${s.id}`,
            metadata: { subscriptionId: s.id, tier: s.tier },
          })
          .catch((err) => this.logger.error(`subscription_expiring admin alert failed: ${err.message}`));
      }
    }
  }

  // ─── PRIVATE HELPERS ────────────────────────────────────────────────────────

  private async resolvePlan(dto: SubscribeDto): Promise<Plan> {
    if (dto.planId) return this.plans.getPurchasableById(dto.planId);
    if (dto.tier) {
      const plan = await this.plans.resolveByTierInterval(dto.tier, dto.interval ?? null);
      if (plan) return plan;
      throw new BadRequestException('No plan matches the requested tier/interval.');
    }
    throw new BadRequestException('Provide a planId.');
  }

  /**
   * Applies one successful payment to a subscription — first activation or a
   * renewal — exactly once. Serialised with a row lock and made idempotent by
   * `lastTransactionId`, so the webhook, the post-redirect verify, the saved
   * card path and a retrying gateway can all race safely.
   */
  private async applyPayment(
    subscriptionId: string,
    userId: string,
    transactionId: string,
    opts: { authorizationCode?: string | null; renewal?: boolean },
  ): Promise<Subscription | null> {
    const card = opts.authorizationCode
      ? await this.transactionsService.findPaymentMethodByAuthorization(userId, opts.authorizationCode)
      : null;

    let activatedFresh = false;
    let expiresAt: Date | null = null;

    const result = await this.dataSource.transaction(async (m) => {
      const repo = m.getRepository(Subscription);
      const sub = await repo.findOne({ where: { id: subscriptionId }, lock: { mode: 'pessimistic_write' } });
      if (!sub) {
        this.logger.warn(`Payment ${transactionId} references missing subscription ${subscriptionId}.`);
        return null;
      }
      if (sub.lastTransactionId === transactionId) return sub; // already applied

      const now = new Date();
      if (opts.renewal) {
        if (sub.status === SubscriptionStatus.CANCELLED) {
          this.logger.error(`Renewal payment ${transactionId} arrived for CANCELLED subscription ${sub.id}; not extending.`);
          sub.lastTransactionId = transactionId;
          return repo.save(sub);
        }
        // Continue the paid-through date; only fall back to "now" when the
        // plan lapsed long ago, so users neither lose nor gain days.
        const base = sub.expiresAt && sub.expiresAt.getTime() > now.getTime() - RENEWAL_GRACE_MS - 86400000
          ? sub.expiresAt
          : now;
        sub.expiresAt = this.computeExpiry(base, sub.billingInterval!);
        sub.status = SubscriptionStatus.ACTIVE;
        sub.renewalAttempts = 0;
        sub.lastReminderDays = null;
      } else {
        // First payment: a PENDING row, or one tidied to CANCELLED while the
        // payment was in flight — but only if it was never activated.
        const activatable =
          sub.lastTransactionId === null &&
          (sub.status === SubscriptionStatus.PENDING || sub.status === SubscriptionStatus.CANCELLED);
        if (!activatable) return sub; // ACTIVE already, or legacy row

        const recurring = sub.gateway ? this.registry.get(sub.gateway).capabilities.recurringCharge : false;
        sub.status = SubscriptionStatus.ACTIVE;
        sub.cancelledAt = null;
        sub.startedAt = now;
        sub.expiresAt = sub.billingInterval ? this.computeExpiry(now, sub.billingInterval) : null;
        sub.paymentMethodId = card?.id ?? null;
        sub.autoRenew = Boolean(recurring && card);
        sub.renewalAttempts = 0;
        sub.lastReminderDays = null;
        activatedFresh = true;
      }
      sub.lastTransactionId = transactionId;
      expiresAt = sub.expiresAt;
      return repo.save(sub);
    });

    if (result && activatedFresh) {
      await this.retireOtherSubscriptions(userId, result.id);
      this.notifications
        .notify({
          userId,
          type: NotificationType.PAYMENT_SUCCESS,
          context: {
            amount: result.amountKobo / 100,
            description: `Your ${result.planCode ?? result.tier} plan is active${expiresAt ? ` until ${(expiresAt as Date).toDateString()}` : ''}.`,
          },
        })
        .catch(() => undefined);
    }
    return result;
  }

  private async cancelIfNeverActivated(id: string): Promise<void> {
    await this.subscriptionRepository.update(
      { id, status: SubscriptionStatus.PENDING },
      { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
    );
  }

  private async activateSubscriptionRow(params: {
    userId: string;
    tier: SubscriptionTier;
    interval: BillingInterval | null;
    amountKobo: number;
    plan: Plan;
  }): Promise<Subscription> {
    const user = await this.userService.findById(params.userId);
    await this.retireOtherSubscriptions(params.userId, null);

    const subscription = this.subscriptionRepository.create({
      tier: params.tier,
      billingInterval: params.interval,
      amountKobo: params.amountKobo,
      planId: params.plan.id,
      planCode: params.plan.code,
      status: SubscriptionStatus.ACTIVE,
      startedAt: new Date(),
      expiresAt: null, // FREE never expires
      autoRenew: false,
      user,
    });
    return this.subscriptionRepository.save(subscription);
  }

  // Retires the user's other live subscriptions AND stops any provider-side
  // billing for them. (Previously only the local row changed, so an upgraded
  // native-Paystack subscriber kept being charged for the old plan.)
  private async retireOtherSubscriptions(userId: string, exceptId: string | null): Promise<void> {
    const others = await this.subscriptionRepository.find({
      where: {
        user: { id: userId },
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE]),
      },
    });

    for (const s of others) {
      if (s.id === exceptId) continue;

      if (s.paystackSubscriptionCode) {
        try {
          if (!s.paystackEmailToken) throw new Error('no email_token stored');
          await this.transactionsService.disableNativeSubscription(
            s.paystackSubscriptionCode,
            s.paystackEmailToken,
          );
        } catch (err: any) {
          this.logger.error(`Could not stop Paystack billing for ${s.id}: ${err.message}`);
          this.adminAlertsService
            .raise({
              type: AdminAlertType.SUBSCRIPTION_EXPIRING,
              title: 'Old subscription may still be billing',
              body: `Subscription ${s.id} was replaced but Paystack could not be told to stop billing it (${err.message}). Disable it on the Paystack dashboard to avoid double charges.`,
              priority: AdminAlertPriority.HIGH,
              metadata: { subscriptionId: s.id, userId },
            })
            .catch(() => undefined);
        }
      }

      s.status = SubscriptionStatus.CANCELLED;
      s.autoRenew = false;
      s.cancelledAt = new Date();
      await this.subscriptionRepository.save(s);
    }
  }

  private async findBySubscriptionCode(
    code: string | undefined,
  ): Promise<Subscription | null> {
    if (!code) return null;
    return this.subscriptionRepository.findOne({
      where: { paystackSubscriptionCode: code },
      relations: ['user'],
    });
  }

  private async findByPlanAndEmail(
    planCode: string | undefined,
    email: string | undefined,
  ): Promise<Subscription | null> {
    if (!planCode || !email) return null;
    const user = await this.userService.findByEmail(email);
    if (!user) return null;
    return this.subscriptionRepository.findOne({
      where: { paystackPlanCode: planCode, user: { id: user.id } },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  private computeExpiry(from: Date, interval: BillingInterval): Date {
    const end = new Date(from);
    if (interval === BillingInterval.ANNUALLY) {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }
    return end;
  }
}
