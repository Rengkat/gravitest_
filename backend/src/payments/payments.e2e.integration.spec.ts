/**
 * END-TO-END payment tests: Paystack AND OPay, independently.
 *
 * Real: PaystackGateway, OpayGateway (real HTTP), PaymentGatewayRegistry,
 *       PaymentGatewaysService, TransactionsService, SubscriptionsService,
 *       the event bus, Postgres, and the signature code in both directions.
 * Fake: the providers' servers (below). They enforce each provider's OWN
 *       credentials and signing rules, so a request sent with the wrong
 *       gateway's key/signature is rejected exactly as the real API would.
 *
 * Run:   TEST_DATABASE_URL=postgres://user:pass@localhost:5432/scratch npx jest payments.e2e
 * WARNING: the target database's schema is DROPPED and recreated.
 * Without TEST_DATABASE_URL the suite is skipped (same convention as billing.integration).
 */
import * as http from 'http';
import * as crypto from 'crypto';
import * as path from 'path';
import { AddressInfo } from 'net';
import { DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

import { PaystackGateway } from './gateways/paystack.gateway';
import { OpayGateway } from './gateways/opay.gateway';
import { PaymentGatewayRegistry } from './payment-gateway.registry';
import { PaymentGatewaysService } from './payment-gateways.service';
import { PaymentGatewayConfig } from './entities/payment-gateway-config.entity';
import { TransactionsService } from 'src/transactions/transactions.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { PaymentMethod } from 'src/transactions/entities/payment-method.entity';
import {
  TRANSACTION_FAILED_EVENT,
  TRANSACTION_SUCCESSFUL_EVENT,
  TransactionFailedEvent,
  TransactionSuccessfulEvent,
} from 'src/transactions/events/transaction.events';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { PlansService } from 'src/plans/plans.service';
import { Plan } from 'src/plans/entities/plan.entity';
import { User } from 'src/user/entities/user.entity';
import { AiUsageLog } from 'src/ai/entities/ai-usage-log.entity';
import { SubscriptionStatus, TransactionStatus, TransactionType } from 'src/common/enums/enums';

const DB = process.env.TEST_DATABASE_URL;
const suite = DB ? describe : describe.skip;

// ── distinct credentials per gateway: any cross-use must be rejected ─────────
const PS_SECRET = 'sk_test_PAYSTACK_ONLY_SECRET';
const OP_MERCHANT = '256621051120756';
const OP_PUBLIC = 'OPAYPUB_ONLY_PUBLIC';
const OP_SECRET = 'OPAYPRV_ONLY_SECRET';
const RETURN_URL = 'https://app.test/dashboard/billing/result';

type FakeState = 'pending' | 'success' | 'failed' | 'abandoned';
interface Order {
  gateway: 'paystack' | 'opay';
  amountKobo: number;
  state: FakeState;
  paidAmountKobo?: number; // what "actually moved" (underpayment simulation)
  body?: any; // the exact create/initialize payload we received
}

// ─────────────────────────────────────────────────────────────────────────────
// Fake provider servers
// ─────────────────────────────────────────────────────────────────────────────
class FakeProviders {
  orders = new Map<string, Order>();
  rejectedAuth: string[] = []; // requests refused for bad credentials/signature
  down = false; // simulate an outage on initialize
  server!: http.Server;
  base = '';

  async start() {
    this.server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => this.route(req, res, Buffer.concat(chunks).toString('utf8')));
    });
    await new Promise<void>((r) => this.server.listen(0, '127.0.0.1', r));
    this.base = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`;
  }
  stop() {
    return new Promise<void>((r) => this.server.close(() => r()));
  }

  private json(res: http.ServerResponse, status: number, body: unknown) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  }

  private route(req: http.IncomingMessage, res: http.ServerResponse, raw: string) {
    const url = req.url ?? '';
    const h = req.headers;

    // ── Paystack ──────────────────────────────────────────────────────────
    if (url.startsWith('/paystack/')) {
      if (h.authorization !== `Bearer ${PS_SECRET}`) {
        this.rejectedAuth.push(`paystack ${url}`);
        return this.json(res, 401, { status: false, message: 'Invalid key' });
      }
      if (url === '/paystack/transaction/initialize' && req.method === 'POST') {
        if (this.down) return this.json(res, 503, { status: false, message: 'upstream down' });
        const b = JSON.parse(raw);
        if (!b.email || !Number.isInteger(b.amount) || !b.reference || !b.callback_url) {
          return this.json(res, 400, { status: false, message: 'Invalid parameters' });
        }
        this.orders.set(b.reference, { gateway: 'paystack', amountKobo: b.amount, state: 'pending', body: b });
        return this.json(res, 200, {
          status: true,
          data: { authorization_url: `https://checkout.paystack.test/${b.reference}`, access_code: 'AC', reference: b.reference },
        });
      }
      const m = url.match(/^\/paystack\/transaction\/verify\/(.+)$/);
      if (m && req.method === 'GET') {
        const ref = decodeURIComponent(m[1]);
        const o = this.orders.get(ref);
        if (!o || o.gateway !== 'paystack') return this.json(res, 404, { status: false, message: 'Transaction reference not found' });
        return this.json(res, 200, { status: true, data: this.paystackData(ref, o) });
      }
      return this.json(res, 404, { status: false, message: 'no such route' });
    }

    // ── OPay ──────────────────────────────────────────────────────────────
    if (url.startsWith('/opay/api/v1/international/cashier/')) {
      const merchantOk = h['merchantid'] === OP_MERCHANT;
      if (url.endsWith('/create')) {
        if (!merchantOk || h.authorization !== `Bearer ${OP_PUBLIC}`) {
          this.rejectedAuth.push(`opay ${url}`);
          return this.json(res, 200, { code: '02000', message: 'authentication failed.' });
        }
        if (this.down) return this.json(res, 503, { code: '50003', message: 'service not available' });
        const b = JSON.parse(raw);
        if (!b.reference || !Number.isInteger(b.amount?.total) || b.country !== 'NG' || !b.returnUrl) {
          return this.json(res, 200, { code: '02001', message: 'request params not valid.' });
        }
        if (this.orders.has(b.reference)) return this.json(res, 200, { code: '02004', message: 'the payment reference already exists.' });
        this.orders.set(b.reference, { gateway: 'opay', amountKobo: b.amount.total, state: 'pending', body: b });
        return this.json(res, 200, {
          code: '00000',
          message: 'SUCCESSFUL',
          data: {
            reference: b.reference,
            orderNo: `ORD${b.reference}`,
            cashierUrl: `https://cashier.opay.test/checkout?orderToken=${b.reference}`,
            status: 'INITIAL',
            amount: { total: b.amount.total, currency: b.amount.currency },
          },
        });
      }
      if (url.endsWith('/status')) {
        // Real OPay: Authorization = Bearer HMAC-SHA512(exact body bytes, secret key)
        const expected = crypto.createHmac('sha512', OP_SECRET).update(raw).digest('hex');
        if (!merchantOk || h.authorization !== `Bearer ${expected}`) {
          this.rejectedAuth.push(`opay ${url}`);
          return this.json(res, 200, { code: '02000', message: 'authentication failed.' });
        }
        const { reference } = JSON.parse(raw);
        const o = this.orders.get(reference);
        if (!o || o.gateway !== 'opay') return this.json(res, 200, { code: '02006', message: 'payment not found' });
        const status = { pending: 'PENDING', success: 'SUCCESS', failed: 'FAIL', abandoned: 'CLOSE' }[o.state];
        return this.json(res, 200, {
          code: '00000',
          message: 'SUCCESSFUL',
          data: {
            reference,
            orderNo: `ORD${reference}`,
            status,
            amount: { total: o.state === 'success' ? (o.paidAmountKobo ?? o.amountKobo) : o.amountKobo, currency: 'NGN' },
            ...(o.state === 'failed' ? { failureCode: '10001', failureReason: 'Card declined' } : {}),
          },
        });
      }
    }
    return this.json(res, 404, { message: 'no such route' });
  }

  private paystackData(ref: string, o: Order) {
    const status = { pending: 'ongoing', success: 'success', failed: 'failed', abandoned: 'abandoned' }[o.state];
    return {
      id: 987654,
      status,
      reference: ref,
      amount: o.state === 'success' ? (o.paidAmountKobo ?? o.amountKobo) : o.amountKobo,
      currency: 'NGN',
      channel: 'card',
      paid_at: o.state === 'success' ? new Date().toISOString() : null,
      gateway_response: o.state === 'failed' ? 'Declined' : 'Successful',
      authorization:
        o.state === 'success'
          ? { authorization_code: 'AUTH_e2e', last4: '4081', exp_month: '12', exp_year: '2030', card_type: 'visa', bank: 'TEST BANK', signature: 'SIG_e2e', reusable: true, channel: 'card' }
          : null,
      customer: { id: 1, email: 'x@y.z', customer_code: 'CUS_1' },
      metadata: o.body?.metadata ?? null,
    };
  }

  /** Test-side lever: "the customer did X at the provider's hosted page". */
  set(ref: string, state: FakeState, paidAmountKobo?: number) {
    const o = this.orders.get(ref)!;
    o.state = state;
    if (paidAmountKobo !== undefined) o.paidAmountKobo = paidAmountKobo;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook builders — signed exactly as each provider documents
// ─────────────────────────────────────────────────────────────────────────────
function paystackWebhook(ref: string, o: { event?: string; status?: string; amount: number; secret?: string }) {
  const raw = Buffer.from(
    JSON.stringify({
      event: o.event ?? 'charge.success',
      data: { id: 987654, status: o.status ?? 'success', reference: ref, amount: o.amount, currency: 'NGN', channel: 'card', paid_at: new Date().toISOString(), gateway_response: 'Successful', customer: { id: 1, email: 'x@y.z', customer_code: 'C' }, metadata: null,
        // a real charge.success carries the card authorization; a failed charge does not
        authorization: (o.status ?? 'success') === 'success' ? { authorization_code: 'AUTH_e2e', last4: '4081', exp_month: '12', exp_year: '2030', card_type: 'visa', bank: 'TEST BANK', signature: 'SIG_e2e', reusable: true, channel: 'card' } : null },
    }),
  );
  const sig = crypto.createHmac('sha512', o.secret ?? PS_SECRET).update(raw).digest('hex');
  return { raw, headers: { 'x-paystack-signature': sig } as Record<string, string> };
}

function opayCallback(ref: string, o: { status?: string; amount: number; refunded?: boolean; secret?: string; type?: string }) {
  const p = {
    amount: String(o.amount), currency: 'NGN', reference: ref, refunded: o.refunded ?? false,
    status: o.status ?? 'SUCCESS', timestamp: '2026-10-23T10:00:00Z', token: `TKN${ref}`,
    transactionId: `ORD${ref}`, instrumentType: 'BankCard', displayedFailure: '',
  };
  const content =
    `{Amount:"${p.amount}",Currency:"${p.currency}",Reference:"${p.reference}",` +
    `Refunded:${p.refunded ? 't' : 'f'},Status:"${p.status}",Timestamp:"${p.timestamp}",` +
    `Token:"${p.token}",TransactionID:"${p.transactionId}"}`;
  const sha512 = crypto.createHmac('sha3-512', o.secret ?? OP_SECRET).update(content).digest('hex');
  return { raw: Buffer.from(JSON.stringify({ payload: p, sha512, type: o.type ?? 'transaction-status' })), headers: {} as Record<string, string> };
}

type Code = 'paystack' | 'opay';
const flush = () => new Promise((r) => setTimeout(r, 40));

suite('payments end-to-end (real gateways, real DB, fake provider servers)', () => {
  let ds: DataSource;
  let fake: FakeProviders;
  let emitter: EventEmitter2;
  let gws: PaymentGatewaysService;
  let tx: TransactionsService;
  let subs: SubscriptionsService;
  let plans: PlansService;
  let user: User;
  let standard: Plan;
  let alerts: jest.Mock;
  let successEvents: TransactionSuccessfulEvent[];
  let failedEvents: TransactionFailedEvent[];
  let n = 0;

  const txRepo = () => ds.getRepository(Transaction);
  const row = (ref: string) => txRepo().findOneByOrFail({ reference: ref });
  const sendWebhook = (code: Code, w: { raw: Buffer; headers: any }) => tx.handleGatewayWebhook(code, w.raw, w.headers);
  const webhookFor = (code: Code, ref: string, state: 'success' | 'failed' | 'closed', amount: number) =>
    code === 'paystack'
      ? paystackWebhook(ref, { event: state === 'failed' ? 'charge.failed' : 'charge.success', status: state === 'failed' ? 'failed' : 'success', amount })
      : opayCallback(ref, { status: { success: 'SUCCESS', failed: 'FAIL', closed: 'CLOSE' }[state], amount });

  const pay = async (code: Code, amountKobo = 500000, extra: Partial<Parameters<TransactionsService['initializeTransaction']>[0]> = {}) => {
    const r = await tx.initializeTransaction({
      userId: user.id, email: user.email, amountKobo, type: TransactionType.OTHER,
      purpose: 'e2e', gateway: code, ...extra,
    });
    return r;
  };

  beforeAll(async () => {
    fake = new FakeProviders();
    await fake.start();

    ds = new DataSource({
      type: 'postgres', url: DB,
      entities: [path.join(__dirname, '../**/*.entity.{ts,js}')],
      synchronize: true, dropSchema: true,
    });
    await ds.initialize();

    const httpSvc = new HttpService();
    const paystackConf: any = { secretKey: PS_SECRET, publicKey: 'pk_test_x', baseUrl: `${fake.base}/paystack`, callbackUrl: RETURN_URL };
    const opayConf: any = {
      live: false, merchantId: OP_MERCHANT, publicKey: OP_PUBLIC, secretKey: OP_SECRET,
      baseUrl: `${fake.base}/opay`, callbackUrl: 'https://api.test/api/v1/webhooks/opay',
      returnUrl: RETURN_URL, cancelUrl: RETURN_URL, expireMinutes: 30,
    };
    const paystack = new PaystackGateway(httpSvc, paystackConf);
    const opay = new OpayGateway(httpSvc, opayConf);
    const registry = new PaymentGatewayRegistry(paystack, opay);
    gws = new PaymentGatewaysService(ds.getRepository(PaymentGatewayConfig), ds, registry);
    await gws.onModuleInit(); // seeds: Paystack enabled+default, OPay OFF
    await gws.update('opay', { enabled: true }); // an admin switched OPay on

    emitter = new EventEmitter2();
    alerts = jest.fn().mockResolvedValue(undefined);
    const adminAlerts: any = { raise: alerts };

    plans = new PlansService(ds.getRepository(Plan), adminAlerts);
    await plans.onModuleInit();
    standard = await ds.getRepository(Plan).findOneByOrFail({ code: 'standard-monthly' });

    user = await ds.getRepository(User).save({ firstName: 'Ada', lastName: 'Obi', email: 'ada.e2e@example.com', passwordHash: 'x' } as any);

    tx = new TransactionsService(
      txRepo(), ds.getRepository(PaymentMethod), ds.getRepository(AiUsageLog),
      {} as any, // StudentsService (usage stats only)
      { sendPaymentReceiptEmail: jest.fn().mockResolvedValue(undefined) } as any,
      { findById: async () => user } as any,
      httpSvc, emitter, {} as any, paystackConf, adminAlerts, gws, registry, paystack,
    );

    subs = new SubscriptionsService(
      ds.getRepository(Subscription), ds, tx, { findById: async () => user } as any, {} as any,
      adminAlerts, { notify: jest.fn().mockResolvedValue(undefined), notifyBoth: jest.fn().mockResolvedValue(undefined) } as any,
      plans, gws, registry,
    );

    // What @OnEvent does inside a running Nest app.
    successEvents = [];
    failedEvents = [];
    emitter.on(TRANSACTION_SUCCESSFUL_EVENT, (e: TransactionSuccessfulEvent) => {
      successEvents.push(e);
      void subs.handleTransactionSuccessful(e);
    });
    emitter.on(TRANSACTION_FAILED_EVENT, (e: TransactionFailedEvent) => {
      failedEvents.push(e);
      void subs.handleTransactionFailed(e);
    });
  }, 120_000);

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
    await fake?.stop();
  });

  beforeEach(async () => {
    n++;
    successEvents.length = 0;
    failedEvents.length = 0;
    alerts.mockClear();
    fake.rejectedAuth.length = 0;
    fake.down = false;
    await ds.query('truncate table subscriptions restart identity cascade');
    // both gateways ON, Paystack default (the shipped default)
    await gws.update('paystack', { enabled: true, isDefault: true });
    await gws.update('opay', { enabled: true });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  describe.each<Code>(['paystack', 'opay'])('%s — independent end-to-end', (code) => {
    const host = code === 'paystack' ? 'checkout.paystack.test' : 'cashier.opay.test';

    it('INITIALIZE: uses ITS OWN endpoint + credentials, sends kobo, records the gateway, row is PENDING', async () => {
      const r = await pay(code, 750000);
      expect(r.gateway).toBe(code);
      expect(new URL(r.authorizationUrl).host).toBe(host);
      expect(fake.rejectedAuth).toEqual([]); // provider accepted our credentials/signature

      const o = fake.orders.get(r.transaction.reference)!;
      expect(o.gateway).toBe(code);
      expect(o.amountKobo).toBe(750000); // integer kobo, not naira
      if (code === 'opay') {
        // OPay does not append the reference to the return URL itself — we must.
        const ret = new URL(o.body.returnUrl);
        expect(ret.searchParams.get('reference')).toBe(r.transaction.reference);
        expect(ret.searchParams.get('gateway')).toBe('opay');
        expect(new URL(o.body.cancelUrl).searchParams.get('cancelled')).toBe('1');
        expect(o.body.callbackUrl).toBe('https://api.test/api/v1/webhooks/opay');
      } else {
        expect(o.body.callback_url).toBe(RETURN_URL);
      }

      const saved = await row(r.transaction.reference);
      expect(saved).toMatchObject({ gateway: code, status: TransactionStatus.PENDING, amountKobo: '750000' as any, currency: 'NGN' });
    });

    it('SUCCESS via WEBHOOK: verified server-side → SUCCESS, exactly one success event, record complete', async () => {
      const { transaction } = await pay(code);
      const ref = transaction.reference;
      fake.set(ref, 'success');
      await sendWebhook(code, webhookFor(code, ref, 'success', 500000));

      const saved = await row(ref);
      expect(saved.status).toBe(TransactionStatus.SUCCESS);
      expect(saved.gateway).toBe(code);
      expect(saved.gatewayReference).toBeTruthy();
      expect(saved.paidAt).toBeInstanceOf(Date);
      expect(successEvents).toHaveLength(1);
      expect(successEvents[0]).toMatchObject({ userId: user.id, gateway: code, amountKobo: 500000 });
      // Only Paystack issues reusable cards.
      expect(successEvents[0].authorizationCode).toBe(code === 'paystack' ? 'AUTH_e2e' : null);
    });

    it('SUCCESS via REDIRECT-VERIFY with no webhook at all (the browser-return path)', async () => {
      const { transaction } = await pay(code);
      fake.set(transaction.reference, 'success');
      const out = await tx.verifyTransaction(transaction.reference, user.id);
      expect(out.status).toBe(TransactionStatus.SUCCESS);
      expect(successEvents).toHaveLength(1);
    });

    it('a frontend "success" means nothing: with the provider still pending, verify grants NOTHING', async () => {
      const { transaction } = await pay(code); // provider state stays 'pending'
      const out = await tx.verifyTransaction(transaction.reference, user.id);
      expect(out.status).toBe(TransactionStatus.PENDING);
      expect(successEvents).toHaveLength(0);
      expect(failedEvents).toHaveLength(0);
    });

    it('DUPLICATES: 12 concurrent webhooks + a redirect-verify + a late replay → ONE success event', async () => {
      const { transaction } = await pay(code);
      const ref = transaction.reference;
      fake.set(ref, 'success');
      await Promise.all([
        ...Array.from({ length: 12 }, () => sendWebhook(code, webhookFor(code, ref, 'success', 500000))),
        tx.verifyTransaction(ref, user.id),
      ]);
      await sendWebhook(code, webhookFor(code, ref, 'success', 500000));
      expect(successEvents).toHaveLength(1);
      expect((await row(ref)).status).toBe(TransactionStatus.SUCCESS);
    });

    it('FAILURE: → FAILED with the provider message, one failure event, no success', async () => {
      const { transaction } = await pay(code);
      const ref = transaction.reference;
      fake.set(ref, 'failed');
      await sendWebhook(code, webhookFor(code, ref, 'failed', 500000));
      const saved = await row(ref);
      expect(saved.status).toBe(TransactionStatus.FAILED);
      expect(saved.gatewayMessage).toBeTruthy();
      expect(failedEvents).toHaveLength(1);
      expect(successEvents).toHaveLength(0);
      // a replayed failure does not re-fire
      await sendWebhook(code, webhookFor(code, ref, 'failed', 500000));
      expect(failedEvents).toHaveLength(1);
    });

    it('CANCELLED / EXPIRED checkout: provider reports abandoned/closed → ABANDONED, no access', async () => {
      const { transaction } = await pay(code);
      fake.set(transaction.reference, 'abandoned');
      const out = await tx.verifyTransaction(transaction.reference, user.id);
      expect(out.status).toBe(TransactionStatus.ABANDONED);
      expect(successEvents).toHaveLength(0);
    });

    it('a late success after a failure is still honoured (money is the source of truth), once', async () => {
      const { transaction } = await pay(code);
      const ref = transaction.reference;
      fake.set(ref, 'failed');
      await tx.verifyTransaction(ref, user.id);
      expect((await row(ref)).status).toBe(TransactionStatus.FAILED);
      fake.set(ref, 'success');
      await tx.verifyTransaction(ref, user.id);
      await tx.verifyTransaction(ref, user.id);
      expect((await row(ref)).status).toBe(TransactionStatus.SUCCESS);
      expect(successEvents).toHaveLength(1);
    });

    it.each([
      ['underpaid', 100],
      ['1 kobo short', 499999],
    ])('AMOUNT INTEGRITY — %s: not SUCCESS, fraud alert, no access', async (_n, paid) => {
      const { transaction } = await pay(code, 500000);
      const ref = transaction.reference;
      fake.set(ref, 'success', paid);
      await sendWebhook(code, webhookFor(code, ref, 'success', paid));
      expect((await row(ref)).status).not.toBe(TransactionStatus.SUCCESS);
      expect(successEvents).toHaveLength(0);
      expect(alerts).toHaveBeenCalledWith(expect.objectContaining({ type: 'fraud_alert' }));
    });

    it('FORGED webhook (wrong secret): 401 + fraud alert, state untouched', async () => {
      const { transaction } = await pay(code);
      const ref = transaction.reference;
      fake.set(ref, 'success'); // even if the provider WOULD say paid, a forged call is refused
      const forged =
        code === 'paystack'
          ? paystackWebhook(ref, { amount: 500000, secret: 'attacker-key' })
          : opayCallback(ref, { amount: 500000, secret: 'attacker-key' });
      await expect(sendWebhook(code, forged)).rejects.toBeInstanceOf(UnauthorizedException);
      expect((await row(ref)).status).toBe(TransactionStatus.PENDING);
      expect(successEvents).toHaveLength(0);
      expect(alerts).toHaveBeenCalledWith(expect.objectContaining({ type: 'fraud_alert' }));
    });

    it("the OTHER gateway's secret cannot sign this gateway's webhook", async () => {
      const { transaction } = await pay(code);
      const ref = transaction.reference;
      fake.set(ref, 'success');
      const crossSigned =
        code === 'paystack'
          ? paystackWebhook(ref, { amount: 500000, secret: OP_SECRET })
          : opayCallback(ref, { amount: 500000, secret: PS_SECRET });
      await expect(sendWebhook(code, crossSigned)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(successEvents).toHaveLength(0);
    });

    it('OUTAGE at initialize: user-safe 400 (no stack/secret), row marked FAILED — not left PENDING', async () => {
      fake.down = true;
      const err: any = await pay(code).catch((e) => e);
      expect(err).toBeInstanceOf(BadRequestException);
      expect(String(err.message)).not.toMatch(/503|ECONN|secret|Bearer/i);
      const rows = await txRepo().find({ where: { gateway: code, status: TransactionStatus.FAILED }, order: { createdAt: 'DESC' }, take: 1 });
      expect(rows).toHaveLength(1);
    });

    it('LIBRARY PURCHASE: access event fires only after verified payment, carries the content id, once', async () => {
      const contentId = '33333333-3333-3333-3333-333333333333';
      const { transaction } = await pay(code, 250000, {
        type: TransactionType.CONTENT_PURCHASE, relatedEntityType: 'library_content', relatedEntityId: contentId,
        purpose: 'Purchase: Past questions',
      });
      expect(successEvents).toHaveLength(0); // starting checkout grants nothing
      fake.set(transaction.reference, 'success');
      await sendWebhook(code, webhookFor(code, transaction.reference, 'success', 250000));
      await tx.verifyTransaction(transaction.reference, user.id);
      expect(successEvents).toHaveLength(1);
      expect(successEvents[0]).toMatchObject({ type: TransactionType.CONTENT_PURCHASE, relatedEntityType: 'library_content', relatedEntityId: contentId, gateway: code });
    });

    // ── SUBSCRIPTIONS through the real SubscriptionsService ────────────────
    it('SUBSCRIPTION: PENDING until the verified payment lands, then ACTIVE on this gateway', async () => {
      const { authorizationUrl, subscription } = await subs.subscribe(user.id, { planId: standard.id, gateway: code as any });
      expect(new URL(authorizationUrl!).host).toBe(host);
      expect(subscription.status).toBe(SubscriptionStatus.PENDING);
      expect(subscription.gateway).toBe(code);

      const t = await txRepo().findOneByOrFail({ relatedEntityId: subscription.id });
      expect(t.gateway).toBe(code);
      fake.set(t.reference, 'success');
      await sendWebhook(code, webhookFor(code, t.reference, 'success', Number(t.amountKobo)));
      await flush();

      const active = await ds.getRepository(Subscription).findOneByOrFail({ id: subscription.id });
      expect(active.status).toBe(SubscriptionStatus.ACTIVE);
      expect(active.gateway).toBe(code);
      expect(active.expiresAt!.getTime()).toBeGreaterThan(Date.now() + 25 * 86_400_000);
      // OPay has no stored-card charge: prepaid, never auto-debited. Paystack redirect may save a card.
      if (code === 'opay') expect(active.autoRenew).toBe(false);
    });

    it('SUBSCRIPTION: the same payment delivered many ways activates ONCE (no double extension)', async () => {
      const { subscription } = await subs.subscribe(user.id, { planId: standard.id, gateway: code as any });
      const t = await txRepo().findOneByOrFail({ relatedEntityId: subscription.id });
      fake.set(t.reference, 'success');
      await Promise.all([
        ...Array.from({ length: 8 }, () => sendWebhook(code, webhookFor(code, t.reference, 'success', Number(t.amountKobo)))),
        tx.verifyTransaction(t.reference, user.id),
      ]);
      await flush();
      const first = await ds.getRepository(Subscription).findOneByOrFail({ id: subscription.id });
      await sendWebhook(code, webhookFor(code, t.reference, 'success', Number(t.amountKobo)));
      await flush();
      const again = await ds.getRepository(Subscription).findOneByOrFail({ id: subscription.id });
      expect(first.status).toBe(SubscriptionStatus.ACTIVE);
      expect(again.expiresAt!.getTime()).toBe(first.expiresAt!.getTime());
      expect(successEvents).toHaveLength(1);
    });

    it('SUBSCRIPTION: failed payment never activates; the pending row is cancelled', async () => {
      const { subscription } = await subs.subscribe(user.id, { planId: standard.id, gateway: code as any });
      const t = await txRepo().findOneByOrFail({ relatedEntityId: subscription.id });
      fake.set(t.reference, 'failed');
      await sendWebhook(code, webhookFor(code, t.reference, 'failed', Number(t.amountKobo)));
      await flush();
      const after = await ds.getRepository(Subscription).findOneByOrFail({ id: subscription.id });
      expect(after.status).toBe(SubscriptionStatus.CANCELLED);
      expect(successEvents).toHaveLength(0);
    });

    it('SUBSCRIPTION: provider outage leaves no live PENDING subscription behind', async () => {
      fake.down = true;
      await expect(subs.subscribe(user.id, { planId: standard.id, gateway: code as any })).rejects.toBeInstanceOf(BadRequestException);
      const live = await ds.getRepository(Subscription).find({ where: { status: SubscriptionStatus.PENDING } });
      expect(live).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  describe('cross-gateway isolation & gateway selection', () => {
    it("a Paystack transaction's reference delivered to the OPay webhook (validly signed) is ignored", async () => {
      const { transaction } = await pay('paystack');
      fake.set(transaction.reference, 'success');
      await sendWebhook('opay', opayCallback(transaction.reference, { amount: 500000 }));
      expect((await row(transaction.reference)).status).toBe(TransactionStatus.PENDING);
      expect(successEvents).toHaveLength(0);
    });

    it("an OPay transaction's reference delivered to the Paystack webhook (validly signed) is ignored", async () => {
      const { transaction } = await pay('opay');
      await sendWebhook('paystack', paystackWebhook(transaction.reference, { amount: 500000 }));
      expect((await row(transaction.reference)).status).toBe(TransactionStatus.PENDING);
      expect(successEvents).toHaveLength(0);
    });

    it('verify always asks the gateway that TOOK the payment', async () => {
      const a = await pay('paystack');
      const b = await pay('opay');
      fake.set(a.transaction.reference, 'success');
      fake.set(b.transaction.reference, 'success');
      expect((await tx.verifyTransaction(a.transaction.reference, user.id)).gateway).toBe('paystack');
      expect((await tx.verifyTransaction(b.transaction.reference, user.id)).gateway).toBe('opay');
      expect(fake.rejectedAuth).toEqual([]);
    });

    it("a customer cannot verify another customer's reference", async () => {
      const { transaction } = await pay('opay');
      await expect(tx.verifyTransaction(transaction.reference, '99999999-9999-9999-9999-999999999999')).rejects.toThrow(/not found/);
    });

    it('SELECTION: omitted → admin default; explicit → that gateway; switching the default is honoured', async () => {
      // default is Paystack
      let s = await subs.subscribe(user.id, { planId: standard.id });
      expect(s.gateway).toBe('paystack');
      expect(new URL(s.authorizationUrl!).host).toBe('checkout.paystack.test');
      await ds.query('truncate table subscriptions restart identity cascade');

      // explicit OPay while Paystack is still default
      s = await subs.subscribe(user.id, { planId: standard.id, gateway: 'opay' as any });
      expect(s.gateway).toBe('opay');
      expect(new URL(s.authorizationUrl!).host).toBe('cashier.opay.test');
      await ds.query('truncate table subscriptions restart identity cascade');

      // admin makes OPay the default → an omitted choice now goes to OPay
      await gws.update('opay', { enabled: true, isDefault: true });
      s = await subs.subscribe(user.id, { planId: standard.id });
      expect(s.gateway).toBe('opay');
      expect(new URL(s.authorizationUrl!).host).toBe('cashier.opay.test');
      // …and Paystack still works when asked for explicitly
      await ds.query('truncate table subscriptions restart identity cascade');
      s = await subs.subscribe(user.id, { planId: standard.id, gateway: 'paystack' as any });
      expect(s.gateway).toBe('paystack');
    });

    it('a disabled gateway is refused BY NAME before any row or provider call', async () => {
      await gws.update('opay', { enabled: false });
      const before = fake.orders.size;
      const rowsBefore = await txRepo().count();
      await expect(pay('opay')).rejects.toThrow(/not available/);
      expect(fake.orders.size).toBe(before);
      expect(await txRepo().count()).toBe(rowsBefore);
      // …while Paystack keeps working
      const ok = await pay('paystack');
      expect(ok.gateway).toBe('paystack');
    });
  });
});
