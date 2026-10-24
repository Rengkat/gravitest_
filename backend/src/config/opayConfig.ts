import { registerAs } from '@nestjs/config';

// OPay Checkout (Nigeria) — https://documentation.opaycheckout.com
//
// Credentials come from the OPay merchant dashboard (Settings → API keys):
//   OPAY_MERCHANT_ID   e.g. 256621051120756
//   OPAY_PUBLIC_KEY    OPAYPUB...   (sent as Bearer on create-payment)
//   OPAY_SECRET_KEY    OPAYPRV...   (signs status queries + verifies callbacks; NEVER expose)
//
// Also paste OPAY_CALLBACK_URL into the "webhook URL" field of the OPay
// dashboard — OPay uses the dashboard value as a fallback.
//
// Blank values in .env (e.g. "OPAY_CANCEL_URL=") arrive as empty strings, so
// use a trimmed check, not `??`: an empty value must behave like an unset one.
// (paystackConfig does the same.) Without this a blank OPAY_CANCEL_URL beat the
// `?? returnUrl` fallback, produced an un-parseable cancelUrl, and every OPay
// checkout failed at initialize even though the gateway reported "configured".
const clean = (v: string | undefined): string | undefined =>
  v?.trim() || undefined;

export default registerAs('opay', () => {
  const live =
    (clean(process.env.OPAY_ENV) ?? 'sandbox').toLowerCase() === 'live';
  const returnUrl = clean(process.env.OPAY_RETURN_URL);
  const expire = Number(clean(process.env.OPAY_EXPIRE_MINUTES));
  return {
    live,
    merchantId: clean(process.env.OPAY_MERCHANT_ID),
    publicKey: clean(process.env.OPAY_PUBLIC_KEY),
    secretKey: clean(process.env.OPAY_SECRET_KEY),
    // Sandbox host is testapi.*, production is liveapi.* (Nigeria region).
    baseUrl:
      clean(process.env.OPAY_BASE_URL) ??
      (live
        ? 'https://liveapi.opaycheckout.com'
        : 'https://testapi.opaycheckout.com'),
    // Server-to-server callback, e.g. https://api.gravitest.ng/api/v1/webhooks/opay
    callbackUrl: clean(process.env.OPAY_CALLBACK_URL),
    // Where OPay sends the customer's browser afterwards. OPay does not append
    // the reference itself, so we add ?reference=…&gateway=opay before sending.
    returnUrl,
    cancelUrl: clean(process.env.OPAY_CANCEL_URL) ?? returnUrl,
    expireMinutes: Number.isFinite(expire) && expire > 0 ? expire : 30,
  };
});
