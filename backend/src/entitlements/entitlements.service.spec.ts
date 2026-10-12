import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import {
  FeatureAccessMode, FeatureKey, QuotaPeriod, SubscriptionStatus, SubscriptionTier,
} from 'src/common/enums/enums';
import { RENEWAL_GRACE_MS } from 'src/subscriptions/subscriptions.service';

const NOW = new Date('2026-10-01T12:00:00Z');
const H = 3_600_000;
const D = 24 * H;

const rule = (over: any = {}) => ({
  featureKey: FeatureKey.AI_TUTOR, mode: FeatureAccessMode.PAID, minTier: SubscriptionTier.BASIC,
  freeQuota: null, quotaPeriod: null, freeUntil: null, updatedBy: null, ...over,
});

describe('EntitlementsService', () => {
  let ruleRepo: any;
  let ds: { query: jest.Mock; getRepository: jest.Mock };
  let usageRepo: { findOne: jest.Mock };
  let subs: { getCurrentSubscription: jest.Mock };
  let alerts: { raise: jest.Mock };
  let svc: EntitlementsService;

  const setRule = (r: any) => ruleRepo.findOne.mockResolvedValue(r);
  const setTier = (tier: SubscriptionTier | null, extra: any = {}) =>
    subs.getCurrentSubscription.mockResolvedValue(
      tier ? { tier, status: SubscriptionStatus.ACTIVE, expiresAt: new Date(NOW.getTime() + 10 * D), autoRenew: false, ...extra } : null,
    );

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    ruleRepo = { findOne: jest.fn(), find: jest.fn().mockResolvedValue([]), exist: jest.fn(), create: jest.fn((x) => x), save: jest.fn(async (x) => x) };
    usageRepo = { findOne: jest.fn().mockResolvedValue(null) };
    ds = { query: jest.fn(), getRepository: jest.fn().mockReturnValue(usageRepo) };
    subs = { getCurrentSubscription: jest.fn() };
    alerts = { raise: jest.fn().mockResolvedValue(undefined) };
    svc = new EntitlementsService(ruleRepo, ds as any, subs as any, alerts as any);
    setTier(null);
  });
  afterEach(() => jest.useRealTimers());

  describe('resolveTier — the single definition of "what plan is this user on"', () => {
    it('is FREE with no subscription', async () => {
      expect(await svc.resolveTier('u')).toBe(SubscriptionTier.FREE);
    });
    it('is the plan tier while unexpired', async () => {
      setTier(SubscriptionTier.STANDARD);
      expect(await svc.resolveTier('u')).toBe(SubscriptionTier.STANDARD);
    });
    it('drops to FREE the moment a NON-renewing plan expires (no waiting for the nightly job)', async () => {
      setTier(SubscriptionTier.STANDARD, { expiresAt: new Date(NOW.getTime() - 1000), autoRenew: false });
      expect(await svc.resolveTier('u')).toBe(SubscriptionTier.FREE);
    });
    it('keeps access during the card-retry grace window for auto-renewing plans', async () => {
      setTier(SubscriptionTier.STANDARD, { status: SubscriptionStatus.PAST_DUE, expiresAt: new Date(NOW.getTime() - 2 * D), autoRenew: true });
      expect(await svc.resolveTier('u')).toBe(SubscriptionTier.STANDARD);
    });
    it('drops to FREE once the grace window is over', async () => {
      setTier(SubscriptionTier.STANDARD, { status: SubscriptionStatus.PAST_DUE, expiresAt: new Date(NOW.getTime() - RENEWAL_GRACE_MS - 1000), autoRenew: true });
      expect(await svc.resolveTier('u')).toBe(SubscriptionTier.FREE);
    });
    it.each([SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELLED, SubscriptionStatus.PENDING])(
      'is FREE when the status is %s', async (status) => {
        setTier(SubscriptionTier.PREMIUM, { status });
        expect(await svc.resolveTier('u')).toBe(SubscriptionTier.FREE);
      });
    it('treats a plan with no expiry as lifetime', async () => {
      setTier(SubscriptionTier.PREMIUM, { expiresAt: null });
      expect(await svc.resolveTier('u')).toBe(SubscriptionTier.PREMIUM);
    });
  });

  describe('evaluate', () => {
    it('FREE mode: allowed for everyone, even with no plan', async () => {
      setRule(rule({ mode: FeatureAccessMode.FREE, minTier: null }));
      expect(await svc.evaluate('u', FeatureKey.AI_TUTOR)).toMatchObject({ allowed: true, reason: 'free' });
    });

    it('DISABLED mode: blocked for everyone, even Enterprise', async () => {
      setRule(rule({ mode: FeatureAccessMode.DISABLED }));
      setTier(SubscriptionTier.ENTERPRISE);
      expect(await svc.evaluate('u', FeatureKey.AI_TUTOR)).toMatchObject({ allowed: false, reason: 'disabled' });
    });

    it('PAID: a FREE user is told to upgrade, and to which tier', async () => {
      setRule(rule());
      expect(await svc.evaluate('u', FeatureKey.AI_TUTOR)).toMatchObject({ allowed: false, reason: 'upgrade_required', requiredTier: SubscriptionTier.BASIC });
    });

    it('PAID: tiers at or above minTier are allowed, below are not', async () => {
      setRule(rule({ minTier: SubscriptionTier.STANDARD }));
      setTier(SubscriptionTier.BASIC);
      expect((await svc.evaluate('u', FeatureKey.AI_TUTOR)).allowed).toBe(false);
      setTier(SubscriptionTier.STANDARD);
      expect((await svc.evaluate('u', FeatureKey.AI_TUTOR)).allowed).toBe(true);
      setTier(SubscriptionTier.ENTERPRISE);
      expect((await svc.evaluate('u', FeatureKey.AI_TUTOR)).allowed).toBe(true);
    });

    it('timed promo: open to everyone until freeUntil, then closed again with no job needed', async () => {
      setRule(rule({ freeUntil: new Date(NOW.getTime() + 2 * H) }));
      expect(await svc.evaluate('u', FeatureKey.AI_TUTOR)).toMatchObject({ allowed: true, reason: 'promo' });
      jest.setSystemTime(new Date(NOW.getTime() + 3 * H));
      ruleRepo.findOne.mockResolvedValue(rule({ freeUntil: new Date(NOW.getTime() + 2 * H) }));
      (svc as any).cache.clear();
      expect(await svc.evaluate('u', FeatureKey.AI_TUTOR)).toMatchObject({ allowed: false, reason: 'upgrade_required' });
    });

    it('free quota: a sub-tier user is allowed while allowance remains, and told how much', async () => {
      setRule(rule({ freeQuota: 5, quotaPeriod: QuotaPeriod.DAILY }));
      usageRepo.findOne.mockResolvedValue({ count: 3 });
      const d = await svc.evaluate('u', FeatureKey.AI_TUTOR);
      expect(d).toMatchObject({ allowed: true, reason: 'free_quota', quota: { limit: 5, used: 3, remaining: 2, period: 'daily' } });
    });

    it('free quota: exhausted allowance is a distinct, actionable reason', async () => {
      setRule(rule({ freeQuota: 5, quotaPeriod: QuotaPeriod.DAILY }));
      usageRepo.findOne.mockResolvedValue({ count: 5 });
      expect(await svc.evaluate('u', FeatureKey.AI_TUTOR)).toMatchObject({ allowed: false, reason: 'quota_exhausted' });
    });

    it('a paying user never touches the quota counter', async () => {
      setRule(rule({ freeQuota: 5, quotaPeriod: QuotaPeriod.DAILY }));
      setTier(SubscriptionTier.BASIC);
      await svc.evaluate('u', FeatureKey.AI_TUTOR);
      expect(usageRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('assertAccess', () => {
    it('throws a structured 403 an app can act on', async () => {
      setRule(rule());
      const err: any = await svc.assertAccess('u', FeatureKey.AI_TUTOR).catch((e) => e);
      expect(err).toBeInstanceOf(ForbiddenException);
      expect(err.getResponse()).toMatchObject({ statusCode: 403, code: 'UPGRADE_REQUIRED', feature: 'ai_tutor', requiredTier: 'basic' });
    });

    it('uses the FEATURE_DISABLED code for a kill-switched feature', async () => {
      setRule(rule({ mode: FeatureAccessMode.DISABLED }));
      const err: any = await svc.assertAccess('u', FeatureKey.AI_TUTOR).catch((e) => e);
      expect(err.getResponse().code).toBe('FEATURE_DISABLED');
    });

    it('consumes exactly one free use through the atomic SQL path', async () => {
      setRule(rule({ freeQuota: 5, quotaPeriod: QuotaPeriod.DAILY }));
      usageRepo.findOne.mockResolvedValue({ count: 1 });
      ds.query.mockResolvedValue([{ count: 2 }]);
      const d = await svc.assertAccess('u', FeatureKey.AI_TUTOR);
      expect(ds.query).toHaveBeenCalledTimes(1);
      expect(ds.query.mock.calls[0][1]).toEqual(['u', 'ai_tutor', '2026-10-01', 5]);
      expect(d.quota).toMatchObject({ used: 2, remaining: 3 });
    });

    it('loses the race gracefully: another request took the last use between read and write', async () => {
      setRule(rule({ freeQuota: 5, quotaPeriod: QuotaPeriod.DAILY }));
      usageRepo.findOne.mockResolvedValue({ count: 4 }); // looked like 1 left…
      ds.query.mockResolvedValue([]); // …but the atomic upsert says no
      const err: any = await svc.assertAccess('u', FeatureKey.AI_TUTOR).catch((e) => e);
      expect(err.getResponse().code).toBe('QUOTA_EXHAUSTED');
    });

    it('does not consume quota for a free feature, a promo, or a paying user', async () => {
      setRule(rule({ mode: FeatureAccessMode.FREE, minTier: null }));
      await svc.assertAccess('u', FeatureKey.AI_TUTOR);
      setRule(rule({ freeUntil: new Date(NOW.getTime() + H), freeQuota: 5, quotaPeriod: QuotaPeriod.DAILY }));
      (svc as any).cache.clear();
      await svc.assertAccess('u', FeatureKey.AI_TUTOR);
      expect(ds.query).not.toHaveBeenCalled();
    });
  });

  describe('quota periods use the Lagos calendar (UTC+1)', () => {
    it('23:30 UTC is already tomorrow in Lagos', () => {
      jest.setSystemTime(new Date('2026-10-01T23:30:00Z'));
      expect(svc.periodKey(QuotaPeriod.DAILY)).toBe('2026-10-02');
    });
    it('12:00 UTC is still today', () => {
      expect(svc.periodKey(QuotaPeriod.DAILY)).toBe('2026-10-01');
    });
    it('month key rolls over at Lagos midnight on the 1st', () => {
      jest.setSystemTime(new Date('2026-10-31T23:30:00Z'));
      expect(svc.periodKey(QuotaPeriod.MONTHLY)).toBe('2026-11');
    });
    it('reports the reset time in absolute terms (Lagos midnight = 23:00 UTC)', async () => {
      setRule(rule({ freeQuota: 5, quotaPeriod: QuotaPeriod.DAILY }));
      const d = await svc.evaluate('u', FeatureKey.AI_TUTOR);
      expect(d.quota?.resetsAt.toISOString()).toBe('2026-10-01T23:00:00.000Z');
    });
  });

  describe('isOpenToEveryone (library promo switch)', () => {
    it.each([
      ['free mode', rule({ mode: FeatureAccessMode.FREE }), true],
      ['paid, no promo', rule(), false],
      ['paid, live promo', rule({ freeUntil: new Date(NOW.getTime() + H) }), true],
      ['paid, expired promo', rule({ freeUntil: new Date(NOW.getTime() - H) }), false],
      ['disabled', rule({ mode: FeatureAccessMode.DISABLED }), false],
    ])('%s -> %s', async (_n, r, expected) => {
      setRule(r);
      expect(await svc.isOpenToEveryone(FeatureKey.LIBRARY_PREMIUM)).toBe(expected);
    });
  });

  describe('updateRule validation', () => {
    beforeEach(() => setRule(rule({ featureKey: FeatureKey.AI_TUTOR, mode: FeatureAccessMode.FREE, minTier: null })));

    it('paid requires a real minTier', async () => {
      await expect(svc.updateRule('ai_tutor', { mode: FeatureAccessMode.PAID })).rejects.toBeInstanceOf(BadRequestException);
      await expect(svc.updateRule('ai_tutor', { mode: FeatureAccessMode.PAID, minTier: SubscriptionTier.FREE })).rejects.toBeInstanceOf(BadRequestException);
    });
    it('a free quota needs a period', async () => {
      await expect(svc.updateRule('ai_tutor', { mode: FeatureAccessMode.PAID, minTier: SubscriptionTier.BASIC, freeQuota: 3 })).rejects.toBeInstanceOf(BadRequestException);
    });
    it('a promo must end in the future', async () => {
      await expect(svc.updateRule('ai_tutor', { mode: FeatureAccessMode.PAID, minTier: SubscriptionTier.BASIC, freeUntil: new Date(NOW.getTime() - H) })).rejects.toBeInstanceOf(BadRequestException);
    });
    it('rejects a mode the feature does not support (library has no "disabled")', async () => {
      setRule(rule({ featureKey: FeatureKey.LIBRARY_PREMIUM }));
      await expect(svc.updateRule('library_premium', { mode: FeatureAccessMode.DISABLED })).rejects.toBeInstanceOf(BadRequestException);
    });
    it('rejects an unknown feature key', async () => {
      await expect(svc.updateRule('nope', { mode: FeatureAccessMode.FREE })).rejects.toThrow(/Unknown feature/);
    });
    it('flipping to FREE clears paid-only settings so a stale promo cannot resurrect later', async () => {
      setRule(rule({ freeQuota: 5, quotaPeriod: QuotaPeriod.DAILY, freeUntil: new Date(NOW.getTime() + H) }));
      await svc.updateRule('ai_tutor', { mode: FeatureAccessMode.FREE });
      const saved = ruleRepo.save.mock.calls[0][0];
      expect(saved).toMatchObject({ mode: 'free', minTier: null, freeQuota: null, quotaPeriod: null, freeUntil: null });
    });
    it('a valid change is saved, audited, and invalidates the cache', async () => {
      await svc.updateRule('ai_tutor', { mode: FeatureAccessMode.PAID, minTier: SubscriptionTier.STANDARD }, 'admin1');
      expect(ruleRepo.save).toHaveBeenCalled();
      expect(alerts.raise).toHaveBeenCalledWith(expect.objectContaining({ metadata: expect.objectContaining({ adminId: 'admin1' }) }));
    });
  });

  describe('per-feature rules for the AI add-ons', () => {
    it('"Explain more" and essay breakdown are their own features, independent of the first explanation', async () => {
      ruleRepo.findOne.mockImplementation(async ({ where }: any) =>
        where.featureKey === FeatureKey.AI_EXPLAIN
          ? rule({ featureKey: FeatureKey.AI_EXPLAIN, mode: FeatureAccessMode.FREE, minTier: null })
          : rule({ featureKey: where.featureKey }),
      );
      expect(await svc.evaluate('u', FeatureKey.AI_EXPLAIN)).toMatchObject({ allowed: true, reason: 'free' });
      expect(await svc.evaluate('u', FeatureKey.AI_EXPLAIN_MORE)).toMatchObject({ allowed: false, reason: 'upgrade_required' });
      expect(await svc.evaluate('u', FeatureKey.AI_ESSAY_ELABORATE)).toMatchObject({ allowed: false });
    });

    it('seeds both new features', async () => {
      ruleRepo.exist.mockResolvedValue(false);
      await svc.onModuleInit();
      const keys = ruleRepo.save.mock.calls.map(([r]: any) => r.featureKey);
      expect(keys).toEqual(expect.arrayContaining([FeatureKey.AI_EXPLAIN_MORE, FeatureKey.AI_ESSAY_ELABORATE]));
    });
  });

  describe('assertAccess({ alreadyUnlocked })', () => {
    const quotaRule = () =>
      rule({ minTier: SubscriptionTier.BASIC, freeQuota: 3, quotaPeriod: QuotaPeriod.DAILY });

    it('does not charge a second free use when the student re-opens the same item', async () => {
      setRule(quotaRule());
      usageRepo.findOne.mockResolvedValue({ count: 3 }); // allowance fully used
      const d = await svc.assertAccess('u', FeatureKey.AI_TUTOR, { alreadyUnlocked: true });
      expect(d.allowed).toBe(true);
      expect(ds.query).not.toHaveBeenCalled(); // nothing consumed
    });

    it('still blocks a paid-only feature even if "unlocked" (no free allowance exists)', async () => {
      setRule(rule());
      await expect(svc.assertAccess('u', FeatureKey.AI_TUTOR, { alreadyUnlocked: true })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('still blocks a disabled feature', async () => {
      setRule(rule({ mode: FeatureAccessMode.DISABLED }));
      await expect(svc.assertAccess('u', FeatureKey.AI_TUTOR, { alreadyUnlocked: true })).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('publicCatalog', () => {
    it('exposes only what a pricing page needs (no admin metadata)', async () => {
      ruleRepo.find.mockResolvedValue([rule({ updatedBy: 'admin-1', updatedAt: NOW })]);
      const cat = await svc.publicCatalog();
      const tutor = cat.find((c) => c.featureKey === FeatureKey.AI_TUTOR)!;
      expect(tutor).toMatchObject({ mode: 'paid', minTier: 'basic' });
      expect(tutor).not.toHaveProperty('updatedBy');
      expect(tutor).not.toHaveProperty('enforcement');
    });
  });

  describe('seeding', () => {
    it('creates a rule per catalogue feature whose defaults preserve legacy behaviour', async () => {
      ruleRepo.exist.mockResolvedValue(false);
      await svc.onModuleInit();
      const byKey = Object.fromEntries(ruleRepo.save.mock.calls.map(([r]: any) => [r.featureKey, r]));
      expect(byKey.ai_tutor).toMatchObject({ mode: 'paid', minTier: 'basic' });
      expect(byKey.ai_explain).toMatchObject({ mode: 'paid', minTier: 'basic' });
      expect(byKey.cbt_practice.mode).toBe('free');
      expect(byKey.ai_essay_scoring.mode).toBe('free');
    });
    it('never overwrites an existing (admin-edited) rule', async () => {
      ruleRepo.exist.mockResolvedValue(true);
      await svc.onModuleInit();
      expect(ruleRepo.save).not.toHaveBeenCalled();
    });
  });
});
