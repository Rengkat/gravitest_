import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import * as crypto from 'crypto';

import { PaymentGatewayCode, TransactionChannel } from 'src/common/enums/enums';
import opayConfig from 'src/config/opayConfig';
import {
  GatewayCapabilities,
  GatewayChargeResult,
  GatewayChargeStatus,
  GatewayInitializeParams,
  GatewayInitializeResult,
  GatewayRequestError,
  GatewayWebhookOutcome,
  InvalidWebhookSignatureError,
  PaymentGateway,
} from '../gateway.interface';

const COUNTRY = 'NG';
const OK_CODE = '00000';

interface OpayEnvelope<T> {
  code: string;
  message: string;
  data?: T;
}
interface OpayCreateData {
  reference: string;
  orderNo: string;
  cashierUrl: string;
  status: string;
  amount: { total: number; currency: string };
}
interface OpayStatusData {
  reference: string;
  orderNo: string;
  /** INITIAL | PENDING | SUCCESS | FAIL | CLOSE (kept a plain string: OPay may add states). */
  status: string;
  amount: { total: number; currency: string };
  failureCode?: string;
  failureReason?: string;
  createTime?: number;
}
interface OpayCallbackPayload {
  amount: string;
  currency: string;
  reference: string;
  refunded: boolean;
  status: string;
  timestamp: string;
  token?: string | null;
  transactionId: string;
  instrumentType?: string;
  displayedFailure?: string;
}
interface OpayCallback {
  payload: OpayCallbackPayload;
  sha512: string;
  type: string;
}

/**
 * OPay Checkout (Nigeria) — hosted "Cashier" flow.
 * Docs: https://documentation.opaycheckout.com
 *
 * Auth model (per the docs):
 *   - create payment: `Authorization: Bearer <PUBLIC key>` + `MerchantId`
 *   - status query:   `Authorization: Bearer HMAC-SHA512(body, <SECRET key>)` + `MerchantId`
 *   - callbacks:      `sha512` field = HMAC-SHA3-512 over a fixed string built from
 *                     the payload, keyed with the SECRET key.
 *
 * OPay has no stored-card / off-session charge in this flow, so
 * capabilities.recurringCharge is false: OPay-paid subscriptions are prepaid
 * for one period and the user re-pays (with reminders) rather than being
 * auto-debited.
 */
@Injectable()
export class OpayGateway implements PaymentGateway {
  private readonly logger = new Logger(OpayGateway.name);

  readonly code = PaymentGatewayCode.OPAY;
  readonly defaultDisplayName = 'OPay';
  readonly capabilities: GatewayCapabilities = {
    recurringCharge: false,
    savedCards: false,
    methods: ['OPay wallet', 'Card', 'Bank transfer', 'USSD'],
  };

  constructor(
    private readonly http: HttpService,
    @Inject(opayConfig.KEY)
    private readonly conf: ConfigType<typeof opayConfig>,
  ) {}

  isConfigured(): boolean {
    return Boolean(
      this.conf.merchantId &&
        this.conf.publicKey &&
        this.conf.secretKey &&
        this.conf.callbackUrl &&
        this.conf.returnUrl,
    );
  }

  // ── create payment ───────────────────────────────────────────────────────

  async initialize(p: GatewayInitializeParams): Promise<GatewayInitializeResult> {
    const body = {
      country: COUNTRY,
      reference: p.reference,
      // OPay documents `total` in the currency's minor ("cent") unit — kobo for NGN.
      amount: { total: p.amountKobo, currency: p.currency },
      returnUrl: this.withQuery(this.conf.returnUrl!, { reference: p.reference, gateway: 'opay' }),
      cancelUrl: this.withQuery(this.conf.cancelUrl ?? this.conf.returnUrl!, {
        reference: p.reference,
        gateway: 'opay',
        cancelled: '1',
      }),
      callbackUrl: this.conf.callbackUrl,
      expireAt: this.conf.expireMinutes,
      userInfo: {
        userId: p.userId,
        userEmail: p.customer.email,
        ...(p.customer.name ? { userName: p.customer.name } : {}),
        ...(p.customer.phone ? { userMobile: p.customer.phone } : {}),
      },
      product: {
        name: p.productName,
        description: p.productDescription ?? p.productName,
      },
    };

    try {
      const { data } = await firstValueFrom(
        this.http.post<OpayEnvelope<OpayCreateData>>(
          `${this.conf.baseUrl}/api/v1/international/cashier/create`,
          body,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.conf.publicKey}`,
              MerchantId: this.conf.merchantId!,
            },
          },
        ),
      );
      if (data.code !== OK_CODE || !data.data?.cashierUrl) {
        throw new GatewayRequestError(
          'Unable to start payment with OPay. Please try again.',
          `${data.code}: ${data.message}`,
        );
      }
      return {
        authorizationUrl: data.data.cashierUrl,
        gatewayReference: data.data.orderNo ?? null,
      };
    } catch (err) {
      if (err instanceof GatewayRequestError) throw err;
      throw new GatewayRequestError(
        'Unable to start payment with OPay. Please try again.',
        this.errorDetail(err),
      );
    }
  }

  // ── status query (authoritative) ─────────────────────────────────────────

  async verify(reference: string): Promise<GatewayChargeResult> {
    // The signature covers the exact bytes we send, so serialize once and
    // send that same string (do NOT let the HTTP client re-serialize it).
    const bodyStr = JSON.stringify({ reference, country: COUNTRY });
    const signature = crypto
      .createHmac('sha512', this.conf.secretKey ?? '')
      .update(bodyStr)
      .digest('hex');

    try {
      const { data } = await firstValueFrom(
        this.http.post<OpayEnvelope<OpayStatusData>>(
          `${this.conf.baseUrl}/api/v1/international/cashier/status`,
          bodyStr,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${signature}`,
              MerchantId: this.conf.merchantId!,
            },
          },
        ),
      );

      // 02006 = "payment not found" — the customer never reached OPay's page.
      // That's "not paid (yet)", not an error worth surfacing as one.
      if (data.code === '02006') return this.notFound(reference, data);
      if (data.code !== OK_CODE || !data.data) {
        throw new GatewayRequestError(
          'Unable to verify the payment with OPay right now.',
          `${data.code}: ${data.message}`,
        );
      }
      return this.fromStatus(data.data, reference);
    } catch (err) {
      if (err instanceof GatewayRequestError) throw err;
      throw new GatewayRequestError(
        'Unable to verify the payment with OPay right now.',
        this.errorDetail(err),
        true, // network / 5xx — safe for the caller to retry
      );
    }
  }

  // ── callback ─────────────────────────────────────────────────────────────

  async parseWebhook(rawBody: Buffer): Promise<GatewayWebhookOutcome> {
    let cb: OpayCallback;
    try {
      cb = JSON.parse(rawBody.toString('utf8')) as OpayCallback;
    } catch {
      throw new InvalidWebhookSignatureError('Malformed OPay callback body.');
    }
    if (!cb?.payload || typeof cb.sha512 !== 'string' || !cb.payload.reference) {
      throw new InvalidWebhookSignatureError('Malformed OPay callback body.');
    }

    if (!this.isValidCallbackSignature(cb)) {
      throw new InvalidWebhookSignatureError('Invalid OPay callback signature.');
    }

    // Only 'transaction-status' carries a payment result we act on. Refund
    // notifications and payloads flagged `refunded` are acknowledged (so OPay
    // stops retrying) but never treated as a fresh payment.
    if (cb.type !== 'transaction-status' || cb.payload.refunded === true) {
      this.logger.log(`OPay callback "${cb.type}" (refunded=${cb.payload.refunded}) acknowledged, not processed.`);
      return { eventType: cb.type ?? 'unknown', data: cb.payload as unknown as Record<string, any>, charge: null };
    }

    // Defence in depth, per OPay's own guidance: a valid signature proves who
    // sent it, but the *state* we act on comes from the Status API, not from
    // the callback body.
    const charge = await this.verify(cb.payload.reference);
    if (!charge.channel) charge.channel = this.mapChannel(cb.payload.instrumentType);
    if (charge.status === 'failed' && cb.payload.displayedFailure) {
      charge.message = cb.payload.displayedFailure;
    }
    return { eventType: 'transaction-status', data: cb.payload as unknown as Record<string, any>, charge };
  }

  /**
   * HMAC-SHA3-512 over the exact string OPay documents (field order, quoting
   * and the t/f encoding of `refunded` matter). Verified in the unit tests
   * against the known-answer example published in OPay's docs.
   */
  isValidCallbackSignature(cb: OpayCallback): boolean {
    const p = cb.payload;
    const signContent =
      `{Amount:"${p.amount}",Currency:"${p.currency}",Reference:"${p.reference}",` +
      `Refunded:${p.refunded ? 't' : 'f'},Status:"${p.status}",Timestamp:"${p.timestamp}",` +
      `Token:"${p.token ?? ''}",TransactionID:"${p.transactionId}"}`;

    const expected = crypto
      .createHmac('sha3-512', this.conf.secretKey ?? '')
      .update(signContent)
      .digest('hex');

    const a = Buffer.from(String(cb.sha512).toLowerCase(), 'utf8');
    const b = Buffer.from(expected, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  // ── mapping ──────────────────────────────────────────────────────────────

  private fromStatus(d: OpayStatusData, reference: string): GatewayChargeResult {
    const status: GatewayChargeStatus =
      d.status === 'SUCCESS'
        ? 'success'
        : d.status === 'FAIL'
          ? 'failed'
          : d.status === 'CLOSE'
            ? 'abandoned' // order closed: expired or cancelled by the customer
            : 'pending'; // INITIAL / PENDING

    return {
      status,
      reference: d.reference ?? reference,
      gatewayReference: d.orderNo ?? null,
      amountKobo: Number(d.amount?.total),
      currency: d.amount?.currency ?? 'NGN',
      channel: null,
      paidAt: status === 'success' ? new Date() : null,
      message: d.failureReason ?? null,
      authorization: null, // OPay gives no reusable card token in this flow
      raw: d as unknown as Record<string, any>,
    };
  }

  private notFound(reference: string, env: OpayEnvelope<unknown>): GatewayChargeResult {
    return {
      status: 'pending',
      reference,
      gatewayReference: null,
      amountKobo: 0,
      currency: 'NGN',
      channel: null,
      paidAt: null,
      message: env.message,
      authorization: null,
      raw: env as unknown as Record<string, any>,
    };
  }

  private mapChannel(instrument: string | undefined): TransactionChannel | null {
    switch ((instrument ?? '').toLowerCase()) {
      case 'bankcard':
        return TransactionChannel.CARD;
      case 'banktransfer':
        return TransactionChannel.BANK_TRANSFER;
      case 'bankussd':
        return TransactionChannel.USSD;
      case 'bankaccount':
        return TransactionChannel.BANK;
      case 'opaywalletngqr':
        return TransactionChannel.QR;
      case 'balancepayment':
      case 'opaywallet':
        return TransactionChannel.MOBILE_MONEY;
      default:
        return null;
    }
  }

  private withQuery(url: string, params: Record<string, string>): string {
    const u = new URL(url);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    return u.toString();
  }

  private errorDetail(err: unknown): string {
    const e = err as AxiosError<{ code?: string; message?: string }>;
    const d = e?.response?.data;
    return d?.message ? `${d.code ?? ''} ${d.message}`.trim() : (e?.message ?? 'Unknown OPay error');
  }
}
