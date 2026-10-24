import * as crypto from 'crypto';
import { of, throwError } from 'rxjs';
import { OpayGateway } from './opay.gateway';
import { GatewayRequestError, InvalidWebhookSignatureError } from '../gateway.interface';
import { TransactionChannel } from 'src/common/enums/enums';

// Known-answer vector published in OPay's own docs (callback-signature page).
const DOC_KEY = 'OPAYPRV16498196872570.13953388019021462';
const DOC_CALLBACK = {
  payload: {
    amount: '49160',
    channel: 'Web',
    country: 'NG',
    currency: 'NGN',
    displayedFailure: '',
    fee: '737',
    feeCurrency: 'NGN',
    instrumentType: 'BankCard',
    reference: '10023',
    refunded: false,
    status: 'SUCCESS',
    timestamp: '2022-05-07T06:20:46Z',
    token: '220507145660712931829',
    transactionId: '220507145660712931829',
    updated_at: '2022-05-07T07:20:46Z',
  },
  sha512:
    '9f605d69f04e94172875dc156537071cead060bbcaeaca94a7b8805af9f89611e2fdf6836713c9c90b028ca7e4470b1356e996975f2abc862315aaa9b7f2ae2d',
  type: 'transaction-status',
};

const CONF: any = {
  merchantId: 'MERCHANT1',
  publicKey: 'OPAYPUB123',
  secretKey: DOC_KEY,
  baseUrl: 'https://testapi.opaycheckout.com',
  callbackUrl: 'https://api.example.com/webhooks/opay',
  returnUrl: 'https://app.example.com/billing/return',
  cancelUrl: undefined,
  expireMinutes: 30,
};

const body = (o: unknown) => Buffer.from(JSON.stringify(o));
const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

describe('OpayGateway', () => {
  let http: { post: jest.Mock };
  let gw: OpayGateway;

  beforeEach(() => {
    http = { post: jest.fn() };
    gw = new OpayGateway(http as any, CONF);
  });

  describe('isConfigured', () => {
    it('is true only when every credential and URL is present', () => {
      expect(gw.isConfigured()).toBe(true);
      for (const k of ['merchantId', 'publicKey', 'secretKey', 'callbackUrl', 'returnUrl']) {
        expect(new OpayGateway(http as any, { ...CONF, [k]: undefined }).isConfigured()).toBe(false);
      }
    });
  });

  describe('missingConfig', () => {
    it('is empty when fully configured', () => {
      expect(gw.missingConfig()).toEqual([]);
    });
    it('names exactly the env vars that are unset — and only names, never values', () => {
      const partial = new OpayGateway(http as any, { ...CONF, callbackUrl: undefined, returnUrl: '' });
      expect(partial.missingConfig()).toEqual(['OPAY_CALLBACK_URL', 'OPAY_RETURN_URL']);
      expect(JSON.stringify(partial.missingConfig())).not.toContain(DOC_KEY);
      expect(partial.isConfigured()).toBe(false);
    });
    it('the three credentials alone are NOT enough — the URLs are required too', () => {
      const credsOnly = new OpayGateway(http as any, { ...CONF, callbackUrl: undefined, returnUrl: undefined });
      expect(credsOnly.isConfigured()).toBe(false);
    });
  });

  describe('callback signature (HMAC-SHA3-512)', () => {
    it("accepts the sample callback from OPay's own documentation", () => {
      expect(gw.isValidCallbackSignature(DOC_CALLBACK as any)).toBe(true);
    });

    it.each([
      ['amount', '1'],
      ['status', 'FAIL'],
      ['reference', 'other-ref'],
      ['currency', 'USD'],
      ['transactionId', 'x'],
      ['refunded', true],
    ])('rejects the callback if %s is tampered with', (field, value) => {
      const cb = clone(DOC_CALLBACK) as any;
      cb.payload[field] = value;
      expect(gw.isValidCallbackSignature(cb)).toBe(false);
    });

    it('rejects a callback signed with a different secret', () => {
      const other = new OpayGateway(http as any, { ...CONF, secretKey: 'OPAYPRV-not-the-key' });
      expect(other.isValidCallbackSignature(DOC_CALLBACK as any)).toBe(false);
    });

    it('rejects an empty or wrong-length signature without throwing', () => {
      for (const sig of ['', 'abc', 'x'.repeat(500)]) {
        const cb = { ...clone(DOC_CALLBACK), sha512: sig } as any;
        expect(gw.isValidCallbackSignature(cb)).toBe(false);
      }
    });
  });

  describe('parseWebhook', () => {
    it('throws InvalidWebhookSignatureError on a forged callback and never calls OPay', async () => {
      const forged = clone(DOC_CALLBACK) as any;
      forged.payload.amount = '1';
      await expect(gw.parseWebhook(body(forged))).rejects.toBeInstanceOf(InvalidWebhookSignatureError);
      expect(http.post).not.toHaveBeenCalled();
    });

    it.each([['not json'], ['{}'], ['{"payload":{}}'], ['null']])(
      'throws InvalidWebhookSignatureError on malformed body %p',
      async (raw) => {
        await expect(gw.parseWebhook(Buffer.from(raw))).rejects.toBeInstanceOf(
          InvalidWebhookSignatureError,
        );
      },
    );

    it('acknowledges a signed non-"transaction-status" callback without treating it as a payment', async () => {
      const cb = clone(DOC_CALLBACK) as any;
      cb.type = 'refund-status';
      cb.sha512 = sign(cb.payload); // still validly signed
      const out = await gw.parseWebhook(body(cb));
      expect(out.charge).toBeNull();
      expect(http.post).not.toHaveBeenCalled();
    });

    it('acknowledges a signed callback flagged refunded without treating it as a payment', async () => {
      const cb = clone(DOC_CALLBACK) as any;
      cb.payload.refunded = true;
      cb.sha512 = sign(cb.payload);
      const out = await gw.parseWebhook(body(cb));
      expect(out.charge).toBeNull();
      expect(http.post).not.toHaveBeenCalled();
    });

    it('takes payment state from the Status API, NOT the callback body', async () => {
      // Callback (validly signed) says SUCCESS; OPay's Status API says FAIL.
      http.post.mockReturnValue(
        of({
          data: {
            code: '00000',
            message: 'SUCCESSFUL',
            data: {
              reference: '10023',
              orderNo: 'ORD1',
              status: 'FAIL',
              amount: { total: 49160, currency: 'NGN' },
              failureReason: 'Insufficient funds',
            },
          },
        }),
      );
      const out = await gw.parseWebhook(body(DOC_CALLBACK));
      expect(out.charge?.status).toBe('failed');
      expect(out.charge?.message).toBeTruthy();
    });

    it('maps a confirmed SUCCESS, with amount from the Status API and channel from the callback', async () => {
      http.post.mockReturnValue(
        of({
          data: {
            code: '00000',
            message: 'SUCCESSFUL',
            data: {
              reference: '10023',
              orderNo: 'ORD1',
              status: 'SUCCESS',
              amount: { total: 49160, currency: 'NGN' },
            },
          },
        }),
      );
      const out = await gw.parseWebhook(body(DOC_CALLBACK));
      expect(out.charge).toMatchObject({
        status: 'success',
        reference: '10023',
        gatewayReference: 'ORD1',
        amountKobo: 49160,
        currency: 'NGN',
        channel: TransactionChannel.CARD,
        authorization: null, // OPay issues no reusable card token
      });
    });

    it('surfaces a transient Status API failure as RETRYABLE so OPay redelivers', async () => {
      http.post.mockReturnValue(throwError(() => new Error('ECONNRESET')));
      const err: any = await gw.parseWebhook(body(DOC_CALLBACK)).catch((e) => e);
      expect(err).toBeInstanceOf(GatewayRequestError);
      expect(err.retryable).toBe(true);
    });
  });

  describe('verify (Status API)', () => {
    it('signs the exact bytes it sends with HMAC-SHA512(secret) as the Bearer token', async () => {
      http.post.mockReturnValue(
        of({ data: { code: '00000', message: 'ok', data: { reference: 'r1', orderNo: 'o', status: 'PENDING', amount: { total: 100, currency: 'NGN' } } } }),
      );
      await gw.verify('r1');
      const [url, sentBody, opts] = http.post.mock.calls[0];
      expect(url).toBe('https://testapi.opaycheckout.com/api/v1/international/cashier/status');
      expect(typeof sentBody).toBe('string'); // serialized ONCE, not re-serialized by the client
      const expected = crypto.createHmac('sha512', DOC_KEY).update(sentBody).digest('hex');
      expect(opts.headers.Authorization).toBe(`Bearer ${expected}`);
      expect(opts.headers.MerchantId).toBe('MERCHANT1');
    });

    it.each([
      ['SUCCESS', 'success'],
      ['FAIL', 'failed'],
      ['CLOSE', 'abandoned'],
      ['PENDING', 'pending'],
      ['INITIAL', 'pending'],
    ])('maps OPay status %s to %s', async (opay, ours) => {
      http.post.mockReturnValue(
        of({ data: { code: '00000', message: 'ok', data: { reference: 'r1', orderNo: 'o', status: opay, amount: { total: 100, currency: 'NGN' } } } }),
      );
      expect((await gw.verify('r1')).status).toBe(ours);
    });

    it('treats "payment not found" (02006) as pending, not as an error', async () => {
      http.post.mockReturnValue(of({ data: { code: '02006', message: 'not found' } }));
      expect((await gw.verify('r1')).status).toBe('pending');
    });

    it('throws a user-safe GatewayRequestError on any other error code', async () => {
      http.post.mockReturnValue(of({ data: { code: '50003', message: 'internal secret detail' } }));
      const err: any = await gw.verify('r1').catch((e) => e);
      expect(err).toBeInstanceOf(GatewayRequestError);
      expect(err.message).not.toContain('internal secret detail'); // detail is for logs only
      expect(err.detail).toContain('50003');
    });
  });

  describe('initialize', () => {
    it('sends kobo amount, our reference, both URLs, and returns the cashier URL', async () => {
      http.post.mockReturnValue(
        of({ data: { code: '00000', message: 'ok', data: { reference: 'ref1', orderNo: 'ORD9', cashierUrl: 'https://pay.opay/x', status: 'INITIAL', amount: { total: 500000, currency: 'NGN' } } } }),
      );
      const res = await gw.initialize({
        reference: 'ref1', amountKobo: 500000, currency: 'NGN', userId: 'u1',
        customer: { email: 'a@b.com', name: 'Ada' }, productName: 'Standard', metadata: {},
      });
      expect(res).toEqual({ authorizationUrl: 'https://pay.opay/x', gatewayReference: 'ORD9' });

      const [url, sent, opts] = http.post.mock.calls[0];
      expect(url).toBe('https://testapi.opaycheckout.com/api/v1/international/cashier/create');
      expect(opts.headers.Authorization).toBe('Bearer OPAYPUB123'); // PUBLIC key here, never the secret
      expect(JSON.stringify(opts)).not.toContain(DOC_KEY);
      expect(sent.amount).toEqual({ total: 500000, currency: 'NGN' });
      expect(sent.reference).toBe('ref1');
      expect(sent.callbackUrl).toBe(CONF.callbackUrl);
      expect(sent.returnUrl).toContain('reference=ref1');
      expect(sent.returnUrl).toContain('gateway=opay');
    });

    it('raises a user-safe error when OPay rejects the request', async () => {
      http.post.mockReturnValue(of({ data: { code: '02001', message: 'bad merchant' } }));
      const err: any = await gw.initialize({
        reference: 'r', amountKobo: 100, currency: 'NGN', userId: 'u',
        customer: { email: 'a@b.com' }, productName: 'x', metadata: {},
      }).catch((e) => e);
      expect(err).toBeInstanceOf(GatewayRequestError);
      expect(err.message).not.toContain('bad merchant');
    });
  });
});

function sign(p: any): string {
  const s =
    `{Amount:"${p.amount}",Currency:"${p.currency}",Reference:"${p.reference}",` +
    `Refunded:${p.refunded ? 't' : 'f'},Status:"${p.status}",Timestamp:"${p.timestamp}",` +
    `Token:"${p.token ?? ''}",TransactionID:"${p.transactionId}"}`;
  return crypto.createHmac('sha3-512', DOC_KEY).update(s).digest('hex');
}
