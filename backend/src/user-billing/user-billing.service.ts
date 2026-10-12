import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { EntitlementsService } from 'src/entitlements/entitlements.service';
import { FEATURE_CATALOG } from 'src/entitlements/feature-catalog';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { LibraryService } from 'src/library/library.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { NotFoundException } from '@nestjs/common';

/**
 * Everything an admin needs to see about one student's money and access, in a
 * single call: what plan they are on, what each service gives them right now
 * and why, what they bought one by one, and their recent payments.
 */
@Injectable()
export class UserBillingService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly entitlements: EntitlementsService,
    private readonly subscriptions: SubscriptionsService,
    private readonly library: LibraryService,
    private readonly transactions: TransactionsService,
  ) {}

  async getOverview(userId: string) {
    const exists = await this.users.exist({ where: { id: userId } });
    if (!exists) throw new NotFoundException(`User ${userId} not found`);

    const [access, current, history, purchases, txns] = await Promise.all([
      this.entitlements.evaluateAll(userId),
      this.subscriptions.getCurrentSubscription(userId),
      this.subscriptions.getSubscriptionHistory(userId),
      this.library.listPurchasesForUser(userId),
      this.transactions.findAllForUser(userId, { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'DESC' } as never),
    ]);

    const labels = new Map(FEATURE_CATALOG.map((f) => [f.key, f.label]));

    return {
      /** The plan level they are effectively on right now (expiry/grace applied). */
      tier: access.tier,
      subscription: current ? this.shapeSubscription(current) : null,
      history: history.map((s) => this.shapeSubscription(s)),
      /** One row per service: can they use it, and why. */
      services: access.features.map((d) => ({
        feature: d.feature,
        label: labels.get(d.feature) ?? d.feature,
        allowed: d.allowed,
        reason: d.reason,
        requiredTier: d.requiredTier,
        quota: d.quota,
        freeUntil: d.freeUntil,
      })),
      purchases,
      transactions: txns.data.map((t) => ({
        id: t.id,
        reference: t.reference,
        type: t.type,
        description: t.purpose,
        amountKobo: t.amountKobo,
        currency: t.currency,
        status: t.status,
        channel: t.channel,
        gateway: t.gateway,
        createdAt: t.createdAt,
        paidAt: t.paidAt,
      })),
    };
  }

  private shapeSubscription(s: {
    id: string;
    tier: string;
    status: string;
    billingInterval: string | null;
    amountKobo: number;
    startedAt: Date;
    expiresAt: Date | null;
    cancelledAt: Date | null;
    autoRenew: boolean;
    planCode: string | null;
    gateway: string | null;
  }) {
    return {
      id: s.id,
      tier: s.tier,
      status: s.status,
      interval: s.billingInterval,
      amountKobo: s.amountKobo,
      startedAt: s.startedAt,
      expiresAt: s.expiresAt,
      cancelledAt: s.cancelledAt,
      autoRenew: s.autoRenew,
      planCode: s.planCode,
      gateway: s.gateway,
    };
  }
}
