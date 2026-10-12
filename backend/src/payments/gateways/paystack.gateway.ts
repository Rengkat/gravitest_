import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import * as crypto from 'crypto';

import { PaymentGatewayCode, TransactionChannel } from 'src/common/enums/enums';
import paystackConfig from 'src/config/paystackConfig';
import {
  PaystackChargeAuthorizationResponse,
  PaystackInitializeResponse,
  PaystackTransactionData,
  PaystackVerifyResponse,
  PaystackWebhookPayload,
} from 'src/transactions/interfaces/paystack.interface';
import {
  GatewayCapabilities,
  GatewayChargeResult,
  GatewayInitializeParams,
  GatewayInitializeResult,
  GatewayRequestError,
  GatewayWebhookOutcome,
  InvalidWebhookSignatureError,
  PaymentGateway,
  RawHeaders,
} from '../gateway.interface';

@Injectable()
export class PaystackGateway implements PaymentGateway {
  readonly code = PaymentGatewayCode.PAYSTACK;
  readonly defaultDisplayName = 'Card, Bank Transfer & USSD (Paystack)';
  readonly capabilities: GatewayCapabilities = {
    recurringCharge: true,
    savedCards: true,
    methods: ['Card', 'Bank transfer', 'USSD', 'Bank', 'QR'],
  };

  constructor(
    private readonly http: HttpService,
    @Inject(paystackConfig.KEY)
    private readonly conf: ConfigType<typeof paystackConfig>,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.conf.secretKey && this.conf.callbackUrl);
  }

  async initialize(p: GatewayInitializeParams): Promise<GatewayInitializeResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<PaystackInitializeResponse>(
          `${this.conf.baseUrl}/transaction/initialize`,
          {
            email: p.customer.email,
            amount: p.amountKobo,
            currency: p.currency,
            reference: p.reference,
            callback_url: this.conf.callbackUrl,
            metadata: p.metadata,
          },
          { headers: this.headers() },
        ),
      );
      return {
        authorizationUrl: data.data.authorization_url,
        gatewayReference: data.data.reference ?? null,
      };
    } catch (err) {
      throw new GatewayRequestError(
        'Unable to start payment with Paystack. Please try again.',
        this.errorDetail(err),
      );
    }
  }

  async verify(reference: string): Promise<GatewayChargeResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<PaystackVerifyResponse>(
          `${this.conf.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
          { headers: this.headers() },
        ),
      );
      return this.toChargeResult(data.data);
    } catch (err) {
      throw new GatewayRequestError(
        'Unable to verify the payment with Paystack right now.',
        this.errorDetail(err),
      );
    }
  }

  async chargeAuthorization(p: {
    reference: string;
    email: string;
    amountKobo: number;
    authorizationCode: string;
    metadata: Record<string, unknown>;
  }): Promise<GatewayChargeResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<PaystackChargeAuthorizationResponse>(
          `${this.conf.baseUrl}/transaction/charge_authorization`,
          {
            email: p.email,
            amount: p.amountKobo,
            reference: p.reference,
            authorization_code: p.authorizationCode,
            metadata: p.metadata,
          },
          { headers: this.headers() },
        ),
      );
      return this.toChargeResult(data.data);
    } catch (err) {
      throw new GatewayRequestError('Card charge failed.', this.errorDetail(err));
    }
  }

  // The interface is async (other gateways call the provider here); Paystack's
  // signature check is purely local, so there is nothing to await.
  // eslint-disable-next-line @typescript-eslint/require-await
  async parseWebhook(rawBody: Buffer, headers: RawHeaders): Promise<GatewayWebhookOutcome> {
    const signature = String(headers['x-paystack-signature'] ?? '');
    const computed = crypto
      .createHmac('sha512', this.conf.secretKey ?? '')
      .update(rawBody)
      .digest('hex');

    const a = Buffer.from(signature, 'utf8');
    const b = Buffer.from(computed, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw new InvalidWebhookSignatureError('Invalid Paystack signature.');
    }

    let payload: PaystackWebhookPayload;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as PaystackWebhookPayload;
    } catch {
      throw new GatewayRequestError('Invalid JSON payload in webhook body.');
    }

    const isCharge = payload.event === 'charge.success' || payload.event === 'charge.failed';
    return {
      eventType: payload.event,
      data: payload.data as unknown as Record<string, any>,
      charge: isCharge ? this.toChargeResult(payload.data as PaystackTransactionData) : null,
    };
  }

  // ── Paystack-only extras (legacy native subscriptions) ───────────────────

  /** Stops Paystack auto-billing a legacy native subscription. */
  async disableSubscription(subscriptionCode: string, emailToken: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.conf.baseUrl}/subscription/disable`,
          { code: subscriptionCode, token: emailToken },
          { headers: this.headers() },
        ),
      );
    } catch (err) {
      throw new GatewayRequestError(
        `Unable to cancel subscription with Paystack: ${this.errorDetail(err)}`,
      );
    }
  }

  // ── mapping ──────────────────────────────────────────────────────────────

  private toChargeResult(d: PaystackTransactionData): GatewayChargeResult {
    const status =
      d.status === 'success'
        ? 'success'
        : d.status === 'abandoned'
          ? 'abandoned'
          : d.status === 'failed'
            ? 'failed'
            : 'pending'; // ongoing / pending / queued — not final, don't fail it

    const auth = d.authorization;
    return {
      status,
      reference: d.reference,
      gatewayReference: d.id != null ? String(d.id) : null,
      amountKobo: Number(d.amount),
      currency: d.currency,
      channel: this.mapChannel(d.channel),
      paidAt: d.paid_at ? new Date(d.paid_at) : null,
      message: d.gateway_response ?? null,
      authorization: auth
        ? {
            code: auth.authorization_code,
            last4: auth.last4,
            cardType: auth.card_type ?? null,
            bank: auth.bank ?? null,
            expMonth: auth.exp_month,
            expYear: auth.exp_year,
            signature: auth.signature ?? null,
            reusable: Boolean(auth.reusable),
          }
        : null,
      raw: d as unknown as Record<string, any>,
    };
  }

  private mapChannel(channel: string | undefined): TransactionChannel {
    const normalized = channel?.toLowerCase();
    return (
      Object.values(TransactionChannel).find((c) => c === normalized) ??
      TransactionChannel.CARD
    );
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.conf.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  private errorDetail(err: unknown): string {
    const e = err as AxiosError<{ message?: string }>;
    return e?.response?.data?.message ?? e?.message ?? 'Unknown Paystack error';
  }
}
