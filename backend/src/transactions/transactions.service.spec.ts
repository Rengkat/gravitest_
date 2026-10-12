import * as crypto from 'crypto';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HttpService } from '@nestjs/axios';

import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { AiUsageLog } from 'src/ai/entities/ai-usage-log.entity';
import { StudentsService } from 'src/students/students.service';
import { MailService } from 'src/mail/mail.service';
import { UserService } from 'src/user/user.service';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { AdminAlertsService } from 'src/admin-alerts/admin-alerts.service';
import paystackConfig from 'src/config/paystackConfig';
import { TransactionStatus } from 'src/common/enums/enums';
import { PaystackGateway } from 'src/payments/gateways/paystack.gateway';
import { PaymentGatewayRegistry } from 'src/payments/payment-gateway.registry';
import { PaymentGatewaysService } from 'src/payments/payment-gateways.service';

const TEST_SECRET = 'sk_test_abc123';

function signPayload(body: Buffer): string {
  return crypto.createHmac('sha512', TEST_SECRET).update(body).digest('hex');
}

describe('TransactionsService.handleWebhook', () => {
  let service: TransactionsService;
  let transactionRepo: { findOne: jest.Mock };
  let adminAlertsService: { raise: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    transactionRepo = { findOne: jest.fn() };
    adminAlertsService = { raise: jest.fn().mockResolvedValue(undefined) };
    eventEmitter = { emit: jest.fn() };

    // The REAL PaystackGateway, so signature tests exercise real HMAC code.
    const paystackGateway = new PaystackGateway({} as any, {
      secretKey: TEST_SECRET,
      callbackUrl: 'http://x',
    } as any);
    const registry = { get: jest.fn().mockReturnValue(paystackGateway) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PaystackGateway, useValue: paystackGateway },
        { provide: PaymentGatewayRegistry, useValue: registry },
        { provide: PaymentGatewaysService, useValue: {} },
        { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
        { provide: getRepositoryToken(PaymentMethod), useValue: {} },
        { provide: getRepositoryToken(AiUsageLog), useValue: {} },
        { provide: StudentsService, useValue: {} },
        { provide: MailService, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: HttpService, useValue: {} },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: PaginationProvider, useValue: {} },
        { provide: paystackConfig.KEY, useValue: { secretKey: TEST_SECRET } },
        { provide: AdminAlertsService, useValue: adminAlertsService },
      ],
    }).compile();

    service = module.get(TransactionsService);
  });

  it('rejects a request with no signature header', async () => {
    const body = Buffer.from(JSON.stringify({ event: 'charge.success', data: {} }));
    await expect(service.handleWebhook(body, '')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a request with a well-formed but wrong signature', async () => {
    const body = Buffer.from(JSON.stringify({ event: 'charge.success', data: {} }));
    const wrongSignature = crypto.createHmac('sha512', 'not-the-real-secret').update(body).digest('hex');
    await expect(service.handleWebhook(body, wrongSignature)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('raises a fraud_alert admin alert when the signature is invalid', async () => {
    const body = Buffer.from(JSON.stringify({ event: 'charge.success', data: {} }));
    await expect(service.handleWebhook(body, 'forged')).rejects.toThrow();
    expect(adminAlertsService.raise).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'fraud_alert' }),
    );
  });

  it('does not throw for a correctly signed payload, and does not raise a fraud alert', async () => {
    const body = Buffer.from(
      JSON.stringify({ event: 'subscription.create', data: { subscription_code: 'sub_1' } }),
    );
    const signature = signPayload(body);

    await expect(service.handleWebhook(body, signature)).resolves.toBeUndefined();
    expect(adminAlertsService.raise).not.toHaveBeenCalled();
  });

  it('rejects a correctly-signed but structurally invalid JSON body', async () => {
    const body = Buffer.from('{not valid json');
    const signature = signPayload(body);
    await expect(service.handleWebhook(body, signature)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('emits the raw webhook event for any event type so other listeners can react', async () => {
    const body = Buffer.from(JSON.stringify({ event: 'invoice.create', data: { foo: 'bar' } }));
    const signature = signPayload(body);

    await service.handleWebhook(body, signature);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ eventType: 'invoice.create' }),
    );
  });

  it('raises a payment_dispute admin alert on charge.dispute.create, and still returns without touching Transaction lookup', async () => {
    const body = Buffer.from(
      JSON.stringify({
        event: 'charge.dispute.create',
        data: { transaction: { reference: 'txn-ref-1' } },
      }),
    );
    const signature = signPayload(body);

    await service.handleWebhook(body, signature);

    expect(adminAlertsService.raise).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'payment_dispute' }),
    );
    // Disputes aren't charge.success/charge.failed, so the transaction
    // lookup path should never run.
    expect(transactionRepo.findOne).not.toHaveBeenCalled();
  });

  it('looks up the transaction by reference for charge.success events', async () => {
    transactionRepo.findOne.mockResolvedValue(null); // untracked reference — should just log & return
    const body = Buffer.from(
      JSON.stringify({ event: 'charge.success', data: { reference: 'txn-ref-2', status: 'success' } }),
    );
    const signature = signPayload(body);

    await service.handleWebhook(body, signature);
    expect(transactionRepo.findOne).toHaveBeenCalledWith({ where: { reference: 'txn-ref-2' } });
  });

  it('is idempotent: a webhook for an already-SUCCESS transaction is a no-op, not a double-apply', async () => {
    transactionRepo.findOne.mockResolvedValue({
      id: 'txn-1',
      reference: 'txn-ref-3',
      status: TransactionStatus.SUCCESS,
    });
    const body = Buffer.from(
      JSON.stringify({ event: 'charge.success', data: { reference: 'txn-ref-3', status: 'success' } }),
    );
    const signature = signPayload(body);

    // Should resolve cleanly without attempting to re-process/save.
    await expect(service.handleWebhook(body, signature)).resolves.toBeUndefined();
  });

  it('ignores event types outside the success/failed/dispute set', async () => {
    const body = Buffer.from(JSON.stringify({ event: 'invoice.update', data: {} }));
    const signature = signPayload(body);

    await expect(service.handleWebhook(body, signature)).resolves.toBeUndefined();
    expect(transactionRepo.findOne).not.toHaveBeenCalled();
    expect(adminAlertsService.raise).not.toHaveBeenCalled();
  });
});
