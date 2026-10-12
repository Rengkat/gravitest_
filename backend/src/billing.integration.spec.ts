/**
 * Integration tests for billing against a REAL Postgres.
 *
 * Why these exist: the risky parts of this feature are the ones a mocked
 * repository can't tell the truth about — atomic SQL, row locks, schema
 * generation from the entities, and races between webhook / redirect / cron.
 *
 * Run:   TEST_DATABASE_URL=postgres://user:pass@localhost:5432/scratch npx jest billing.integration
 * WARNING: the target database's schema is DROPPED and recreated. Use a scratch DB.
 * Without TEST_DATABASE_URL the whole suite is skipped.
 */
import * as path from 'path';
import { DataSource } from 'typeorm';

import { User } from 'src/user/entities/user.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { PlansService } from 'src/plans/plans.service';
import { Plan } from 'src/plans/entities/plan.entity';
import { EntitlementsService } from 'src/entitlements/entitlements.service';
import { FeatureAccessRule } from 'src/entitlements/entities/feature-access-rule.entity';
import { PaymentGatewayConfig } from 'src/payments/entities/payment-gateway-config.entity';
import { PaymentGatewaysService } from 'src/payments/payment-gateways.service';
import { PaymentGatewayRegistry } from 'src/payments/payment-gateway.registry';
import { TransactionSuccessfulEvent } from 'src/transactions/events/transaction.events';
import {
  BillingInterval, FeatureAccessMode, FeatureKey, QuotaPeriod,
  SubscriptionStatus, SubscriptionTier, TransactionType,
} from 'src/common/enums/enums';

const URL = process.env.TEST_DATABASE_URL;
const suite = URL ? describe : describe.skip;
const DAY = 86_400_000;

suite('billing (real Postgres)', () => {
  let ds: DataSource;

  beforeAll(async () => {
    ds = new DataSource({
      type: 'postgres',
      url: URL,
      entities: [path.join(__dirname, '**/*.entity.{ts,js}')],
      synchronize: true,
      dropSchema: true,
    });
    await ds.initialize();
  }, 120_000);

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('schema', () => {
    it('generates cleanly from ALL entities and is stable (a second sync has nothing to change)', async () => {
      const pending = (await ds.driver.createSchemaBuilder().log()).upQueries.map((q) => q.query);
      // Pre-existing, unrelated drift: TypeORM re-detects the float default of
      // ai_settings."autoFlagThreshold" on every sync. Excluded so this test
      // guards the billing tables without being permanently red.
      const unexpected = pending.filter((q) => !q.includes('"ai_settings"'));
      expect(unexpected).toEqual([]);
    });

    it('new tables and columns exist with the intended shape', async () => {
      const cols = async (t: string) =>
        (await ds.query(`select column_name, column_default, is_nullable from information_schema.columns where table_name=$1`, [t]))
          .reduce((m: any, r: any) => ({ ...m, [r.column_name]: r }), {});

      const tx = await cols('transactions');
      expect(tx.gateway.column_default).toContain('paystack'); // legacy rows are backfilled as Paystack
      expect(tx.paystackReference).toBeDefined(); // physical column KEPT (no data-losing rename)
      expect(tx.gatewayReference).toBeUndefined();

      const sub = await cols('subscriptions');
      for (const c of ['planId', 'planCode', 'gateway', 'renewalAmountKobo', 'paymentMethodId', 'renewalAttempts', 'lastRenewalAttemptAt', 'lastTransactionId', 'lastReminderDays']) {
        expect(sub[c]).toBeDefined();
      }
      for (const t of ['plans', 'payment_gateway_configs', 'feature_access_rules', 'feature_usage']) {
        expect((await cols(t)).id ?? (await cols(t)).featureKey ?? (await cols(t)).code).toBeDefined();
      }
    });

    it('a card signature is unique PER USER, not globally', async () => {
      const [{ n }] = await ds.query(
        `select count(*)::int n from pg_indexes where tablename='payment_methods' and indexdef ilike '%(signature)%' and indexdef ilike '%unique%' and indexdef not ilike '%user%'`,
      );
      expect(n).toBe(0); // no global unique on signature
      const [{ m }] = await ds.query(
        `select count(*)::int m from pg_constraint where conname='UQ_payment_methods_user_signature'`,
      );
      expect(m).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('free-quota counter is atomic', () => {
    let ent: EntitlementsService;

    beforeAll(async () => {
      await ds.getRepository(FeatureAccessRule).save({
        featureKey: FeatureKey.AI_TUTOR, mode: FeatureAccessMode.PAID, minTier: SubscriptionTier.BASIC,
        freeQuota: 5, quotaPeriod: QuotaPeriod.DAILY, freeUntil: null, updatedBy: null,
      } as any);
      ent = new EntitlementsService(
        ds.getRepository(FeatureAccessRule), ds,
        { getCurrentSubscription: async () => null } as any, // everyone is FREE tier
        { raise: async () => undefined } as any,
      );
    });

    it('25 simultaneous requests for a 5-use allowance: EXACTLY 5 succeed', async () => {
      const results = await Promise.allSettled(
        Array.from({ length: 25 }, () => ent.assertAccess('user-race', FeatureKey.AI_TUTOR)),
      );
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const denied = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
      expect(ok).toBe(5);
      expect(denied).toHaveLength(20);
      expect(denied.every((d) => d.reason.getResponse().code === 'QUOTA_EXHAUSTED')).toBe(true);

      const [{ count }] = await ds.query(`select "count" from feature_usage where user_id='user-race' and feature_key='ai_tutor'`);
      expect(count).toBe(5); // never overshoots
    });

    it('users have independent allowances', async () => {
      await ent.assertAccess('user-other', FeatureKey.AI_TUTOR);
      const d = await ent.evaluate('user-other', FeatureKey.AI_TUTOR);
      expect(d.quota).toMatchObject({ used: 1, remaining: 4 });
    });

    it('a new day is a new allowance (period key changes)', async () => {
      await ds.query(`update feature_usage set period_key='2020-01-01' where user_id='user-race'`);
      const d = await ent.evaluate('user-race', FeatureKey.AI_TUTOR);
      expect(d.quota).toMatchObject({ used: 0, remaining: 5 });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('subscription lifecycle', () => {
    let subs: SubscriptionsService;
    let plans: PlansService;
    let user: User;
    let standard: Plan;
    let tx: any;
    let notify: jest.Mock;
    let disableNative: jest.Mock;
    let n = 0;
    const subRepo = () => ds.getRepository(Subscription);

    beforeAll(async () => {
      plans = new PlansService(ds.getRepository(Plan), { raise: async () => undefined } as any);
      await plans.onModuleInit(); // seeds the legacy catalogue
      standard = (await ds.getRepository(Plan).findOneByOrFail({ code: 'standard-monthly' }));
    });

    beforeEach(async () => {
      n++;
      await ds.query('truncate table subscriptions restart identity cascade');
      user = await ds.getRepository(User).save({
        firstName: 'Ada', lastName: 'Obi', email: `ada${n}@example.com`, passwordHash: 'x',
      } as any);

      notify = jest.fn().mockResolvedValue(undefined);
      disableNative = jest.fn().mockResolvedValue(undefined);
      let charged = 0;
      tx = {
        getPaymentMethod: jest.fn().mockResolvedValue({ id: 'pm-1', authorizationCode: 'AUTH_1' }),
        findPaymentMethodByAuthorization: jest.fn().mockResolvedValue({ id: '11111111-1111-1111-1111-111111111111', authorizationCode: 'AUTH_1' }),
        chargeAuthorization: jest.fn(async () => ({ id: `tx-${++charged}`, authorizationCode: 'AUTH_1' })),
        initializeTransaction: jest.fn(async () => ({ authorizationUrl: 'https://pay/x', transaction: { id: 'tx-redirect' } })),
        disableNativeSubscription: disableNative,
      };
      subs = new SubscriptionsService(
        subRepo(), ds, tx,
        { findById: async () => user } as any,
        {} as any,
        { raise: async () => undefined } as any,
        { notify, notifyBoth: notify } as any,
        plans,
        { resolveForCheckout: async (c?: string) => ({ code: c ?? 'paystack' }) } as any,
        { get: (code: string) => ({ capabilities: { recurringCharge: code === 'paystack' } }) } as any,
      );
    });

    const event = (subId: string, txId: string, o: any = {}) =>
      new TransactionSuccessfulEvent(txId, user.id, TransactionType.SUBSCRIPTION, 'subscription', subId, o.metadata ?? null, 500000, o.gateway ?? 'paystack', o.auth ?? null);

    it('saved-card checkout activates immediately; first charge can be a promo, renewals are locked at list price', async () => {
      await plans.setPromo(standard.id, { promoAmountKobo: 300000, promoEndsAt: new Date(Date.now() + 7 * DAY), promoLabel: 'Promo' } as any);
      const { subscription } = await subs.subscribe(user.id, { planId: standard.id, paymentMethodId: '22222222-2222-2222-2222-222222222222' });

      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subscription.amountKobo).toBe(300000); // paid the promo
      expect(subscription.renewalAmountKobo).toBe(500000); // renews at list
      expect(subscription.autoRenew).toBe(true);
      expect(tx.chargeAuthorization.mock.calls[0][0].amountKobo).toBe(300000);
      const days = (subscription.expiresAt!.getTime() - Date.now()) / DAY;
      expect(days).toBeGreaterThan(27);
      expect(days).toBeLessThan(32);
    });

    it('redirect checkout on OPay: pending until paid; then active, prepaid, NOT auto-renewing', async () => {
      const { authorizationUrl, subscription } = await subs.subscribe(user.id, { planId: standard.id, gateway: 'opay' as any });
      expect(authorizationUrl).toBe('https://pay/x');
      expect(subscription.status).toBe(SubscriptionStatus.PENDING);
      expect(tx.initializeTransaction.mock.calls[0][0].gateway).toBe('opay');

      await subs.handleTransactionSuccessful(event(subscription.id, 'tx-opay', { gateway: 'opay' }));
      const after = await subRepo().findOneByOrFail({ id: subscription.id });
      expect(after).toMatchObject({ status: SubscriptionStatus.ACTIVE, autoRenew: false, paymentMethodId: null, gateway: 'opay' });
    });

    it('the SAME payment delivered 15 times at once (webhook + redirect + retries) activates ONCE', async () => {
      const { subscription } = await subs.subscribe(user.id, { planId: standard.id, gateway: 'opay' as any });
      await Promise.all(Array.from({ length: 15 }, () => subs.handleTransactionSuccessful(event(subscription.id, 'tx-dup', { gateway: 'opay' }))));
      const after = await subRepo().findOneByOrFail({ id: subscription.id });
      expect(after.status).toBe(SubscriptionStatus.ACTIVE);
      expect(after.lastTransactionId).toBe('tx-dup');
      // one period, not fifteen:
      expect((after.expiresAt!.getTime() - Date.now()) / DAY).toBeLessThan(32);
      expect(notify.mock.calls.filter(([a]) => a.type === 'payment_success')).toHaveLength(1);
    });

    it('a duplicate delivery of a RENEWAL payment extends only once', async () => {
      const { subscription } = await subs.subscribe(user.id, { planId: standard.id, paymentMethodId: '22222222-2222-2222-2222-222222222222' });
      const before = (await subRepo().findOneByOrFail({ id: subscription.id })).expiresAt!.getTime();
      await Promise.all(Array.from({ length: 10 }, () => subs.handleTransactionSuccessful(event(subscription.id, 'tx-renew-1', { metadata: { renewal: true }, auth: 'AUTH_1' }))));
      const after = (await subRepo().findOneByOrFail({ id: subscription.id })).expiresAt!.getTime();
      expect(after - before).toBeGreaterThan(27 * DAY);
      expect(after - before).toBeLessThan(32 * DAY);
    });

    it('a payment that lands after the abandoned-checkout cleanup still activates (money is truth)', async () => {
      const { subscription } = await subs.subscribe(user.id, { planId: standard.id, gateway: 'opay' as any });
      await subRepo().update({ id: subscription.id }, { status: SubscriptionStatus.CANCELLED });
      await subs.handleTransactionSuccessful(event(subscription.id, 'tx-late', { gateway: 'opay' }));
      expect((await subRepo().findOneByOrFail({ id: subscription.id })).status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('a failed saved-card charge cancels the pending row and surfaces the error', async () => {
      tx.chargeAuthorization.mockRejectedValue(new Error('Card charge failed. Insufficient funds'));
      await expect(subs.subscribe(user.id, { planId: standard.id, paymentMethodId: '22222222-2222-2222-2222-222222222222' })).rejects.toThrow(/Insufficient/);
      const rows = await subRepo().find();
      expect(rows.map((r) => r.status)).toEqual([SubscriptionStatus.CANCELLED]);
    });

    it('upgrading STOPS provider billing of the old native-Paystack subscription and retires it', async () => {
      const old = await subRepo().save(subRepo().create({
        tier: SubscriptionTier.BASIC, billingInterval: BillingInterval.MONTHLY, amountKobo: 250000,
        status: SubscriptionStatus.ACTIVE, startedAt: new Date(), expiresAt: new Date(Date.now() + 10 * DAY),
        autoRenew: true, paystackSubscriptionCode: 'SUB_old', paystackEmailToken: 'tok', user,
      }));
      await subs.subscribe(user.id, { planId: standard.id, paymentMethodId: '22222222-2222-2222-2222-222222222222' });
      expect(disableNative).toHaveBeenCalledWith('SUB_old', 'tok');
      expect((await subRepo().findOneByOrFail({ id: old.id })).status).toBe(SubscriptionStatus.CANCELLED);
      expect(await subRepo().count({ where: { status: SubscriptionStatus.ACTIVE } })).toBe(1);
    });

    it('refuses to re-buy the plan you are already on, until close to expiry', async () => {
      await subs.subscribe(user.id, { planId: standard.id, paymentMethodId: '22222222-2222-2222-2222-222222222222' });
      await expect(subs.subscribe(user.id, { planId: standard.id, paymentMethodId: '22222222-2222-2222-2222-222222222222' })).rejects.toThrow(/already on/);
    });

    it('will not sell a retired or contact-sales plan', async () => {
      await plans.archive(standard.id);
      await expect(subs.subscribe(user.id, { planId: standard.id, gateway: 'opay' as any })).rejects.toThrow(/no longer available/);
      const ent = await ds.getRepository(Plan).findOneByOrFail({ code: 'enterprise' });
      await expect(subs.subscribe(user.id, { planId: ent.id })).rejects.toThrow(/sales team/);
      await ds.getRepository(Plan).update({ id: standard.id }, { isActive: true });
    });

    it('history hides checkouts that were never paid for, but keeps real and cancelled plans', async () => {
      const mk = (o: Partial<Subscription>) => subRepo().save(subRepo().create({
        tier: SubscriptionTier.STANDARD, billingInterval: BillingInterval.MONTHLY, amountKobo: 500000,
        startedAt: new Date(), autoRenew: false, user, ...o,
      }));
      const abandoned = await mk({ status: SubscriptionStatus.PENDING });
      const tidied = await mk({ status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() }); // never activated: no expiry
      const cancelledReal = await mk({ status: SubscriptionStatus.CANCELLED, expiresAt: new Date(Date.now() + DAY), cancelledAt: new Date() });
      const expired = await mk({ status: SubscriptionStatus.EXPIRED, expiresAt: new Date(Date.now() - DAY) });
      const active = await mk({ status: SubscriptionStatus.ACTIVE, expiresAt: new Date(Date.now() + DAY) });
      const pastDue = await mk({ status: SubscriptionStatus.PAST_DUE, expiresAt: new Date(Date.now() - DAY) });
      const freeCancelled = await mk({ tier: SubscriptionTier.FREE, billingInterval: null, amountKobo: 0, status: SubscriptionStatus.CANCELLED });

      const ids = (await subs.getSubscriptionHistory(user.id)).map((s) => s.id).sort();
      expect(ids).toEqual([cancelledReal.id, expired.id, active.id, pastDue.id, freeCancelled.id].sort());
      expect(ids).not.toContain(abandoned.id);
      expect(ids).not.toContain(tidied.id);
    });

    it("history never leaks another user's plans", async () => {
      const other = await ds.getRepository(User).save({ firstName: 'B', lastName: 'B', email: `b${n}@example.com`, passwordHash: 'x' } as any);
      await subRepo().save(subRepo().create({
        tier: SubscriptionTier.STANDARD, billingInterval: BillingInterval.MONTHLY, amountKobo: 500000,
        status: SubscriptionStatus.ACTIVE, startedAt: new Date(), expiresAt: new Date(Date.now() + DAY), autoRenew: false, user: other,
      }));
      expect(await subs.getSubscriptionHistory(user.id)).toEqual([]);
    });

    // ── renewals ──────────────────────────────────────────────────────────
    async function dueSubscription(over: Partial<Subscription> = {}) {
      const { subscription } = await subs.subscribe(user.id, { planId: standard.id, paymentMethodId: '22222222-2222-2222-2222-222222222222' });
      await subRepo().update({ id: subscription.id }, { expiresAt: new Date(Date.now() - 60_000), paymentMethodId: '11111111-1111-1111-1111-111111111111', ...over } as any);
      tx.chargeAuthorization.mockClear();
      return subscription.id;
    }

    it('renews a due subscription at the LOCKED price, continuing from the old expiry', async () => {
      const id = await dueSubscription();
      const oldExpiry = (await subRepo().findOneByOrFail({ id })).expiresAt!.getTime();
      await subs.processRenewals();

      expect(tx.chargeAuthorization).toHaveBeenCalledTimes(1);
      expect(tx.chargeAuthorization.mock.calls[0][0]).toMatchObject({ amountKobo: 500000, metadata: expect.objectContaining({ renewal: true }) });
      const after = await subRepo().findOneByOrFail({ id });
      expect(after.status).toBe(SubscriptionStatus.ACTIVE);
      expect(after.expiresAt!.getTime() - oldExpiry).toBeGreaterThan(27 * DAY);
      expect(after.renewalAttempts).toBe(0);
    });

    it('a later admin price change does NOT change what an existing subscriber renews at', async () => {
      const id = await dueSubscription();
      await plans.update(standard.id, { amountKobo: 900000 });
      await subs.processRenewals();
      expect(tx.chargeAuthorization.mock.calls[0][0].amountKobo).toBe(500000);
      await plans.update(standard.id, { amountKobo: 500000 });
    });

    it('two overlapping cron runs (two instances) charge the card ONCE', async () => {
      const id = await dueSubscription();
      await Promise.all([subs.processRenewals(), subs.processRenewals(), subs.processRenewals()]);
      expect(tx.chargeAuthorization).toHaveBeenCalledTimes(1);
      expect((await subRepo().findOneByOrFail({ id })).renewalAttempts).toBe(0); // and it succeeded
    });

    it('a declined card → PAST_DUE, user notified, no hammering the card within the retry gap', async () => {
      const id = await dueSubscription();
      tx.chargeAuthorization.mockRejectedValue(new Error('declined'));
      await subs.processRenewals();
      const a = await subRepo().findOneByOrFail({ id });
      expect(a).toMatchObject({ status: SubscriptionStatus.PAST_DUE, renewalAttempts: 1 });
      expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'payment_failed' }));

      await subs.processRenewals(); // immediately again
      expect(tx.chargeAuthorization).toHaveBeenCalledTimes(1); // gap enforced
    });

    it('a later retry that works restores ACTIVE and resets the counters', async () => {
      const id = await dueSubscription();
      tx.chargeAuthorization.mockRejectedValueOnce(new Error('declined'));
      await subs.processRenewals();
      await subRepo().update({ id }, { lastRenewalAttemptAt: new Date(Date.now() - 25 * 3600_000) });
      await subs.processRenewals();
      const a = await subRepo().findOneByOrFail({ id });
      expect(a).toMatchObject({ status: SubscriptionStatus.ACTIVE, renewalAttempts: 0 });
    });

    it('after the attempts/grace are used up the plan lapses and stops retrying', async () => {
      const id = await dueSubscription({ status: SubscriptionStatus.PAST_DUE, renewalAttempts: 3 } as any);
      await subs.processRenewals();
      expect(tx.chargeAuthorization).not.toHaveBeenCalled();
      expect(await subRepo().findOneByOrFail({ id })).toMatchObject({ status: SubscriptionStatus.EXPIRED, autoRenew: false });
    });

    it('never touches legacy native-Paystack subscriptions (Paystack bills those)', async () => {
      const id = await dueSubscription({ paystackSubscriptionCode: 'SUB_legacy' } as any);
      await subs.processRenewals();
      expect(tx.chargeAuthorization).not.toHaveBeenCalled();
      expect((await subRepo().findOneByOrFail({ id })).status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('expiry reminders fire once per threshold for non-renewing plans, never for auto-renewing ones', async () => {
      const { subscription: a } = await subs.subscribe(user.id, { planId: standard.id, gateway: 'opay' as any });
      await subs.handleTransactionSuccessful(event(a.id, 'tx-r1', { gateway: 'opay' }));
      await subRepo().update({ id: a.id }, { expiresAt: new Date(Date.now() + 2.5 * DAY) });
      notify.mockClear();
      await subs.sendExpiryReminders();
      await subs.sendExpiryReminders(); // same day, again
      expect(notify.mock.calls.filter(([x]) => x.type === 'subscription_expiring')).toHaveLength(1);

      await subRepo().update({ id: a.id }, { autoRenew: true });
      await subRepo().update({ id: a.id }, { expiresAt: new Date(Date.now() + 0.5 * DAY), lastReminderDays: null });
      notify.mockClear();
      await subs.sendExpiryReminders();
      expect(notify).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe('payment gateway switchboard', () => {
    let gws: PaymentGatewaysService;
    const cfg = () => ds.getRepository(PaymentGatewayConfig);
    let opayConfigured = true;

    beforeAll(async () => {
      const mk = (code: string, name: string, isConfigured: () => boolean) =>
        ({ code, defaultDisplayName: name, capabilities: { recurringCharge: code === 'paystack', savedCards: code === 'paystack', methods: [] }, isConfigured });
      const list = [mk('paystack', 'Paystack', () => true), mk('opay', 'OPay', () => opayConfigured)];
      const registry = { all: () => list, get: (c: string) => list.find((g) => g.code === c)!, has: (c: string) => list.some((g) => g.code === c) };
      gws = new PaymentGatewaysService(cfg(), ds, registry as any);
      await gws.onModuleInit();
    });

    it('seeds Paystack enabled+default (what the app runs on today) and OPay OFF', async () => {
      const rows = await gws.listForAdmin();
      expect(rows.find((r) => r.code === 'paystack')).toMatchObject({ enabled: true, isDefault: true });
      expect(rows.find((r) => r.code === 'opay')).toMatchObject({ enabled: false, isDefault: false });
      expect((await gws.listCheckoutOptions()).map((o) => o.code)).toEqual(['paystack']);
    });

    it('OPay cannot be enabled while its credentials are missing', async () => {
      opayConfigured = false;
      await expect(gws.update('opay', { enabled: true })).rejects.toThrow(/credentials/);
      opayConfigured = true;
    });

    it('enabling OPay offers it at checkout; a disabled gateway is refused by name', async () => {
      await gws.update('opay', { enabled: true });
      expect((await gws.listCheckoutOptions()).map((o) => o.code).sort()).toEqual(['opay', 'paystack']);
      await gws.update('opay', { enabled: false });
      await expect(gws.resolveForCheckout('opay')).rejects.toThrow(/not available/);
    });

    it('making OPay the default un-defaults Paystack (exactly one default)', async () => {
      await gws.update('opay', { enabled: true, isDefault: true });
      const rows = await gws.listForAdmin();
      expect(rows.filter((r) => r.isDefault).map((r) => r.code)).toEqual(['opay']);
      expect((await gws.resolveForCheckout()).code).toBe('opay');
    });

    it('cannot disable the last enabled gateway; disabling the default promotes another', async () => {
      await gws.update('paystack', { enabled: false }); // opay stays
      await expect(gws.update('opay', { enabled: false })).rejects.toThrow(/At least one/);
      await gws.update('paystack', { enabled: true });
      await gws.update('opay', { enabled: false });
      const rows = await gws.listForAdmin();
      expect(rows.filter((r) => r.isDefault).map((r) => r.code)).toEqual(['paystack']);
    });
  });
});
