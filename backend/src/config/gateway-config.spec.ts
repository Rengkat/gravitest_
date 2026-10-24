import opayConfig from './opayConfig';
import paystackConfig from './paystackConfig';

/**
 * .env files routinely contain blank assignments ("OPAY_CANCEL_URL=") and
 * stray whitespace. Blank must behave like unset for BOTH gateways, otherwise
 * a gateway can report "configured" yet fail at the first real checkout.
 */
describe('gateway env config — blank/whitespace values behave like unset', () => {
  const KEYS = [
    'OPAY_ENV', 'OPAY_MERCHANT_ID', 'OPAY_PUBLIC_KEY', 'OPAY_SECRET_KEY', 'OPAY_BASE_URL',
    'OPAY_CALLBACK_URL', 'OPAY_RETURN_URL', 'OPAY_CANCEL_URL', 'OPAY_EXPIRE_MINUTES',
    'PAYSTACK_SECRET_KEY', 'PAYSTACK_CALLBACK_URL',
  ];
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => KEYS.forEach((k) => { saved[k] = process.env[k]; delete process.env[k]; }));
  afterEach(() => KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k]))));

  it('a blank OPAY_BASE_URL falls back to the sandbox host (not an empty string)', () => {
    process.env.OPAY_BASE_URL = '';
    expect(opayConfig().baseUrl).toBe('https://testapi.opaycheckout.com');
  });

  it('a blank OPAY_BASE_URL falls back to the live host when OPAY_ENV=live', () => {
    process.env.OPAY_ENV = 'live';
    process.env.OPAY_BASE_URL = '   ';
    expect(opayConfig().baseUrl).toBe('https://liveapi.opaycheckout.com');
  });

  it('a blank OPAY_CANCEL_URL falls back to the return URL (not an empty, un-parseable URL)', () => {
    process.env.OPAY_RETURN_URL = 'https://app.example.com/dashboard/billing/result';
    process.env.OPAY_CANCEL_URL = '';
    expect(opayConfig().cancelUrl).toBe('https://app.example.com/dashboard/billing/result');
  });

  it('trims credentials and treats whitespace-only as missing', () => {
    process.env.OPAY_MERCHANT_ID = '  256621051120756 ';
    process.env.OPAY_PUBLIC_KEY = '   ';
    const c = opayConfig();
    expect(c.merchantId).toBe('256621051120756');
    expect(c.publicKey).toBeUndefined();
  });

  it('OPAY_ENV is case/space tolerant', () => {
    process.env.OPAY_ENV = ' LIVE ';
    expect(opayConfig().live).toBe(true);
  });

  it('a non-numeric or blank OPAY_EXPIRE_MINUTES falls back to 30', () => {
    process.env.OPAY_EXPIRE_MINUTES = '';
    expect(opayConfig().expireMinutes).toBe(30);
    process.env.OPAY_EXPIRE_MINUTES = 'abc';
    expect(opayConfig().expireMinutes).toBe(30);
  });

  it('Paystack already behaves this way (regression guard)', () => {
    process.env.PAYSTACK_SECRET_KEY = '  ';
    expect(paystackConfig().secretKey).toBeUndefined();
  });
});
