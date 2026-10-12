import { NotFoundException } from '@nestjs/common';

// These are only DI tokens here; loading the real ones drags in ESM-only deps
// (nanoid) that Jest can't parse, and none of their logic is under test.
jest.mock('src/library/library.service', () => ({ LibraryService: class {} }));
jest.mock('src/transactions/transactions.service', () => ({ TransactionsService: class {} }));
jest.mock('src/subscriptions/subscriptions.service', () => ({ SubscriptionsService: class {} }));
jest.mock('src/user/entities/user.entity', () => ({ User: class {} }));
import { UserBillingService } from './user-billing.service';

const mk = () => {
  const users = { exist: jest.fn().mockResolvedValue(true) };
  const entitlements = {
    evaluateAll: jest.fn().mockResolvedValue({
      tier: 'basic',
      features: [
        { feature: 'cbt_practice', allowed: true, reason: 'free', requiredTier: null, quota: null, freeUntil: null },
        { feature: 'ai_tutor', allowed: true, reason: 'tier', requiredTier: 'basic', quota: null, freeUntil: null },
        { feature: 'ai_essay_scoring', allowed: false, reason: 'upgrade_required', requiredTier: 'standard', quota: null, freeUntil: null },
      ],
    }),
  };
  const subscriptions = {
    getCurrentSubscription: jest.fn().mockResolvedValue({
      id: 's1', tier: 'basic', status: 'active', billingInterval: 'monthly', amountKobo: 150000,
      startedAt: new Date('2026-10-01'), expiresAt: new Date('2026-11-01'), cancelledAt: null, autoRenew: true,
      planCode: 'basic_monthly', gateway: 'paystack', paystackEmailToken: 'SECRET',
    }),
    getSubscriptionHistory: jest.fn().mockResolvedValue([]),
  };
  const library = { listPurchasesForUser: jest.fn().mockResolvedValue([{ contentId: 'c1', title: 'Learning nest.JS' }]) };
  const transactions = {
    findAllForUser: jest.fn().mockResolvedValue({
      data: [{ id: 't1', reference: 'gtx_1', type: 'subscription', purpose: 'basic_monthly', amountKobo: 150000, currency: 'NGN', status: 'success', channel: 'card', gateway: 'paystack', createdAt: new Date(), paidAt: new Date(), metadata: { secret: 1 } }],
    }),
  };
  const svc = new UserBillingService(users as never, entitlements as never, subscriptions as never, library as never, transactions as never);
  return { svc, users };
};

describe('UserBillingService', () => {
  it('returns plan, per-service access with labels, purchases and payments in one call', async () => {
    const { svc } = mk();
    const o = await svc.getOverview('u1');
    expect(o.tier).toBe('basic');
    expect(o.subscription).toMatchObject({ tier: 'basic', status: 'active', gateway: 'paystack', autoRenew: true });
    expect(o.services.find((s) => s.feature === 'ai_essay_scoring')).toMatchObject({ allowed: false, reason: 'upgrade_required', requiredTier: 'standard' });
    expect(o.services.every((s) => typeof s.label === 'string' && s.label.length > 0)).toBe(true);
    expect(o.purchases).toHaveLength(1);
    expect(o.transactions[0]).toMatchObject({ reference: 'gtx_1', description: 'basic_monthly', gateway: 'paystack' });
  });

  it('never exposes gateway tokens or raw transaction metadata to the admin UI', async () => {
    const { svc } = mk();
    const json = JSON.stringify(await svc.getOverview('u1'));
    expect(json).not.toContain('SECRET');
    expect(json).not.toContain('metadata');
  });

  it('404s for an unknown user', async () => {
    const { svc, users } = mk();
    users.exist.mockResolvedValue(false);
    await expect(svc.getOverview('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
