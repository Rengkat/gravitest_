import { BadRequestException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HttpService } from '@nestjs/axios';
import { In, Not } from 'typeorm';

import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { TRANSACTION_FAILED_EVENT, TRANSACTION_SUCCESSFUL_EVENT } from './events/transaction.events';
import { AiUsageLog } from 'src/ai/entities/ai-usage-log.entity';
import { StudentsService } from 'src/students/students.service';
import { MailService } from 'src/mail/mail.service';
import { UserService } from 'src/user/user.service';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { AdminAlertsService } from 'src/admin-alerts/admin-alerts.service';
import paystackConfig from 'src/config/paystackConfig';
import { PaystackGateway } from 'src/payments/gateways/paystack.gateway';
import { PaymentGatewayRegistry } from 'src/payments/payment-gateway.registry';
import { PaymentGatewaysService } from 'src/payments/payment-gateways.service';
import {
  GatewayChargeResult, GatewayRequestError, InvalidWebhookSignatureError,
} from 'src/payments/gateway.interface';
import { TransactionStatus, TransactionType, TransactionChannel } from 'src/common/enums/enums';

const tx = (over: Partial<Transaction> = {}): Transaction =>
  ({
    id: 't1', reference: 'ref1', gateway: 'opay', userId: 'u1', type: TransactionType.SUBSCRIPTION,
    amountKobo: 500000, currency: 'NGN', status: TransactionStatus.PENDING,
    relatedEntityType: 'subscription', relatedEntityId: 's1', metadata: { planCode: 'x' },
    authorizationCode: null, gatewayReference: null, gatewayMessage: null, ...over,
  }) as any;

const charge = (over: Partial<GatewayChargeResult> = {}): GatewayChargeResult => ({
  status: 'success', reference: 'ref1', gatewayReference: 'ORD1', amountKobo: 500000, currency: 'NGN',
  channel: TransactionChannel.CARD, paidAt: new Date(), message: null, authorization: null, raw: { a: 1 }, ...over,
});

describe('TransactionsService — gateway-agnostic payment handling', () => {
  let svc: TransactionsService;
  let repo: any;
  let pmRepo: any;
  let events: { emit: jest.Mock };
  let alerts: { raise: jest.Mock };
  let gateway: { code: string; verify: jest.Mock; parseWebhook: jest.Mock; initialize: jest.Mock };
  let gateways: { resolveForCheckout: jest.Mock };

  beforeEach(async () => {
    repo = {
      create: jest.fn((x) => ({ ...x })),
      save: jest.fn(async (x) => ({ id: 't1', ...x })), // like a real insert: assigns an id
      findOne: jest.fn(),
      findOneByOrFail: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    pmRepo = { findOne: jest.fn().mockResolvedValue(null), exist: jest.fn().mockResolvedValue(false), save: jest.fn(async (x) => x), create: jest.fn((x) => x) };
    events = { emit: jest.fn() };
    alerts = { raise: jest.fn().mockResolvedValue(undefined) };
    gateway = { code: 'opay', verify: jest.fn(), parseWebhook: jest.fn(), initialize: jest.fn() };
    gateways = { resolveForCheckout: jest.fn().mockResolvedValue(gateway) };

    const mod = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(Transaction), useValue: repo },
        { provide: getRepositoryToken(PaymentMethod), useValue: pmRepo },
        { provide: getRepositoryToken(AiUsageLog), useValue: {} },
        { provide: StudentsService, useValue: {} },
        { provide: MailService, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: HttpService, useValue: {} },
        { provide: EventEmitter2, useValue: events },
        { provide: PaginationProvider, useValue: {} },
        { provide: paystackConfig.KEY, useValue: {} },
        { provide: AdminAlertsService, useValue: alerts },
        { provide: PaystackGateway, useValue: {} },
        { provide: PaymentGatewayRegistry, useValue: { get: jest.fn().mockReturnValue(gateway) } },
        { provide: PaymentGatewaysService, useValue: gateways },
      ],
    }).compile();
    svc = mod.get(TransactionsService);
    jest.spyOn(svc as any, 'sendReceiptEmail').mockResolvedValue(undefined);
  });

  const settle = (t: Transaction, result: GatewayChargeResult) => {
    repo.findOne.mockResolvedValue(t);
    repo.findOneByOrFail.mockResolvedValue({ ...t, status: TransactionStatus.SUCCESS, gatewayReference: 'ORD1' });
    gateway.verify.mockResolvedValue(result);
    return svc.verifyTransaction(t.reference);
  };
  const emitted = (name: string) => events.emit.mock.calls.filter(([n]) => n === name);

  describe('successful payment', () => {
    it('marks it SUCCESS and emits one success event carrying the gateway', async () => {
      await settle(tx(), charge());
      expect(repo.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: TransactionStatus.SUCCESS, gatewayReference: 'ORD1' }));
      const [[, event]] = emitted(TRANSACTION_SUCCESSFUL_EVENT);
      expect(event).toMatchObject({ transactionId: 't1', userId: 'u1', gateway: 'opay', authorizationCode: null, amountKobo: 500000 });
    });

    it('a late success is honoured after ABANDONED/FAILED — only SUCCESS and REVERSED are excluded from the claim', async () => {
      await settle(tx({ status: TransactionStatus.ABANDONED }), charge());
      const criteria = repo.update.mock.calls[0][0];
      expect(criteria.id).toBe('t1');
      expect(criteria.status).toEqual(Not(In([TransactionStatus.SUCCESS, TransactionStatus.REVERSED])));
      expect(emitted(TRANSACTION_SUCCESSFUL_EVENT)).toHaveLength(1);
    });

    it('LOSING the claim race emits nothing (exactly-once)', async () => {
      repo.update.mockResolvedValue({ affected: 0 });
      await settle(tx(), charge());
      expect(emitted(TRANSACTION_SUCCESSFUL_EVENT)).toHaveLength(0);
    });

    it('saves a reusable card and passes its token on the event; ignores non-reusable', async () => {
      const auth = { code: 'AUTH_1', last4: '4081', cardType: 'visa', bank: 'B', expMonth: '01', expYear: '2030', signature: 'sig', reusable: true };
      await settle(tx({ gateway: 'paystack' }), charge({ authorization: auth }));
      expect(pmRepo.save).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', authorizationCode: 'AUTH_1', isDefault: true }));
      expect(emitted(TRANSACTION_SUCCESSFUL_EVENT)[0][1].authorizationCode).toBe('AUTH_1');

      pmRepo.save.mockClear(); events.emit.mockClear();
      await settle(tx(), charge({ authorization: { ...auth, reusable: false } }));
      expect(pmRepo.save).not.toHaveBeenCalled();
      expect(emitted(TRANSACTION_SUCCESSFUL_EVENT)[0][1].authorizationCode).toBeNull();
    });

    it("scopes a returning card to the SAME user (another user's card is never rewritten)", async () => {
      const auth = { code: 'AUTH_2', last4: '1', cardType: null, bank: null, expMonth: '1', expYear: '30', signature: 'shared-sig', reusable: true };
      await settle(tx(), charge({ authorization: auth }));
      expect(pmRepo.findOne).toHaveBeenCalledWith({ where: { userId: 'u1', signature: 'shared-sig' } });
    });
  });

  describe('amount / currency integrity — never grant access for money that did not arrive', () => {
    it.each([
      ['underpaid', charge({ amountKobo: 100 })],
      ['paid 1 kobo short', charge({ amountKobo: 499999 })],
      ['wrong currency', charge({ currency: 'USD' })],
    ])('%s: no SUCCESS, fraud alert raised, failure emitted', async (_n, result) => {
      const out = await settle(tx(), result);
      expect(repo.update).not.toHaveBeenCalled();
      expect(emitted(TRANSACTION_SUCCESSFUL_EVENT)).toHaveLength(0);
      expect(alerts.raise).toHaveBeenCalledWith(expect.objectContaining({ type: 'fraud_alert' }));
      expect(out.status).toBe(TransactionStatus.FAILED);
      expect(emitted(TRANSACTION_FAILED_EVENT)).toHaveLength(1);
    });

    it('an overpayment is accepted (the customer is not penalised)', async () => {
      await settle(tx(), charge({ amountKobo: 600000 }));
      expect(emitted(TRANSACTION_SUCCESSFUL_EVENT)).toHaveLength(1);
    });
  });

  describe('non-success outcomes', () => {
    it('pending changes nothing and emits nothing', async () => {
      const out = await settle(tx(), charge({ status: 'pending' }));
      expect(out.status).toBe(TransactionStatus.PENDING);
      expect(repo.save).not.toHaveBeenCalled();
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('failed → FAILED with reason, one failure event', async () => {
      const out = await settle(tx(), charge({ status: 'failed', message: 'Insufficient funds' }));
      expect(out).toMatchObject({ status: TransactionStatus.FAILED, gatewayMessage: 'Insufficient funds' });
      expect(emitted(TRANSACTION_FAILED_EVENT)).toHaveLength(1);
    });

    it('abandoned → ABANDONED', async () => {
      const out = await settle(tx(), charge({ status: 'abandoned' }));
      expect(out.status).toBe(TransactionStatus.ABANDONED);
    });

    it('a repeat failure callback does not re-fire the failure event', async () => {
      await settle(tx({ status: TransactionStatus.FAILED }), charge({ status: 'failed' }));
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('a late failure can NEVER downgrade an already-successful payment', async () => {
      repo.findOne.mockResolvedValue(tx({ status: TransactionStatus.SUCCESS }));
      const out = await svc.verifyTransaction('ref1'); // early-return path
      expect(out.status).toBe(TransactionStatus.SUCCESS);
      expect(gateway.verify).not.toHaveBeenCalled();
      // and via the internal path (webhook race after success was recorded elsewhere):
      const same = await (svc as any).applyFailure(tx({ status: TransactionStatus.SUCCESS }), 'late');
      expect(same.status).toBe(TransactionStatus.SUCCESS);
      expect(events.emit).not.toHaveBeenCalled();
    });
  });

  describe('verifyTransaction', () => {
    it('asks the gateway that actually took the payment', async () => {
      await settle(tx({ gateway: 'opay' }), charge());
      expect(gateway.verify).toHaveBeenCalledWith('ref1');
    });
    it('turns a gateway outage into a user-safe 400, not a stack trace', async () => {
      repo.findOne.mockResolvedValue(tx());
      gateway.verify.mockRejectedValue(new GatewayRequestError('Unable to verify right now.', 'ECONNRESET secret'));
      const err: any = await svc.verifyTransaction('ref1').catch((e) => e);
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.message).not.toContain('ECONNRESET');
    });
    it('404s an unknown reference', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(svc.verifyTransaction('nope')).rejects.toThrow(/not found/);
    });
  });

  describe('handleGatewayWebhook', () => {
    const okOutcome = (result: GatewayChargeResult | null) => ({ eventType: 'transaction-status', data: {}, charge: result });

    it('processes a verified charge outcome', async () => {
      gateway.parseWebhook.mockResolvedValue(okOutcome(charge()));
      repo.findOne.mockResolvedValue(tx());
      repo.findOneByOrFail.mockResolvedValue(tx({ status: TransactionStatus.SUCCESS }));
      await svc.handleGatewayWebhook('opay', Buffer.from('{}'), {});
      expect(emitted(TRANSACTION_SUCCESSFUL_EVENT)).toHaveLength(1);
    });

    it('is idempotent for an already-SUCCESS transaction (OPay retries for up to 72h)', async () => {
      gateway.parseWebhook.mockResolvedValue(okOutcome(charge()));
      repo.findOne.mockResolvedValue(tx({ status: TransactionStatus.SUCCESS }));
      await svc.handleGatewayWebhook('opay', Buffer.from('{}'), {});
      expect(repo.update).not.toHaveBeenCalled();
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('ignores a webhook whose reference belongs to a DIFFERENT gateway', async () => {
      gateway.parseWebhook.mockResolvedValue(okOutcome(charge()));
      repo.findOne.mockResolvedValue(tx({ gateway: 'paystack' })); // but arrived on the opay endpoint
      await svc.handleGatewayWebhook('opay', Buffer.from('{}'), {});
      expect(repo.update).not.toHaveBeenCalled();
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('acknowledges (no error, no action) an event that is not a charge state', async () => {
      gateway.parseWebhook.mockResolvedValue(okOutcome(null));
      await expect(svc.handleGatewayWebhook('opay', Buffer.from('{}'), {})).resolves.toBeUndefined();
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it('acknowledges a charge for an unknown reference without erroring', async () => {
      gateway.parseWebhook.mockResolvedValue(okOutcome(charge({ reference: 'unknown' })));
      repo.findOne.mockResolvedValue(null);
      await expect(svc.handleGatewayWebhook('opay', Buffer.from('{}'), {})).resolves.toBeUndefined();
    });

    it('a forged webhook → 401 + a fraud alert that names the gateway', async () => {
      gateway.parseWebhook.mockRejectedValue(new InvalidWebhookSignatureError());
      await expect(svc.handleGatewayWebhook('opay', Buffer.from('{}'), {})).rejects.toBeInstanceOf(UnauthorizedException);
      expect(alerts.raise).toHaveBeenCalledWith(expect.objectContaining({ type: 'fraud_alert', title: expect.stringContaining('opay') }));
    });

    it('a TRANSIENT upstream failure → 503 so the gateway retries', async () => {
      gateway.parseWebhook.mockRejectedValue(new GatewayRequestError('x', 'ECONNRESET', true));
      await expect(svc.handleGatewayWebhook('opay', Buffer.from('{}'), {})).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('a bad payload → 400, NOT a retry-inducing 5xx', async () => {
      gateway.parseWebhook.mockRejectedValue(new GatewayRequestError('bad json'));
      await expect(svc.handleGatewayWebhook('opay', Buffer.from('{}'), {})).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('initializeTransaction', () => {
    const params = { userId: 'u1', email: 'a@b.com', amountKobo: 500000, type: TransactionType.SUBSCRIPTION, purpose: 'standard-monthly', gateway: 'opay' };

    it('records which gateway was used and returns its checkout URL', async () => {
      gateway.initialize.mockResolvedValue({ authorizationUrl: 'https://pay/x', gatewayReference: 'ORD1' });
      const out = await svc.initializeTransaction(params);
      expect(gateways.resolveForCheckout).toHaveBeenCalledWith('opay');
      expect(out).toMatchObject({ authorizationUrl: 'https://pay/x', gateway: 'opay' });
      expect(repo.save.mock.calls[0][0]).toMatchObject({ gateway: 'opay', status: TransactionStatus.PENDING, amountKobo: 500000, currency: 'NGN' });
      expect(gateway.initialize.mock.calls[0][0]).toMatchObject({ amountKobo: 500000, currency: 'NGN', userId: 'u1' });
    });

    it('a gateway failure marks the row FAILED and throws a user-safe error (detail stays in logs)', async () => {
      gateway.initialize.mockRejectedValue(new GatewayRequestError('Unable to start payment.', 'merchant 123 secret detail'));
      const err: any = await svc.initializeTransaction(params).catch((e) => e);
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.message).not.toContain('secret detail');
      expect(repo.update).toHaveBeenCalledWith('t1', expect.objectContaining({ status: TransactionStatus.FAILED }));
    });

    it('a disabled/unconfigured gateway is refused before ANY row is created', async () => {
      gateways.resolveForCheckout.mockRejectedValue(new BadRequestException('Payment method "opay" is not available right now.'));
      await expect(svc.initializeTransaction(params)).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
