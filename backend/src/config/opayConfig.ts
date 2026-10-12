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
export default registerAs('opay', () => {
  const live = (process.env.OPAY_ENV ?? 'sandbox').toLowerCase() === 'live';
  return {
    live,
    merchantId: process.env.OPAY_MERCHANT_ID,
    publicKey: process.env.OPAY_PUBLIC_KEY,
    secretKey: process.env.OPAY_SECRET_KEY,
    // Sandbox host is testapi.*, production is liveapi.* (Nigeria region).
    baseUrl:
      process.env.OPAY_BASE_URL ??
      (live ? 'https://liveapi.opaycheckout.com' : 'https://testapi.opaycheckout.com'),
    // Server-to-server callback, e.g. https://api.gravitest.ng/api/v1/webhooks/opay
    callbackUrl: process.env.OPAY_CALLBACK_URL,
    // Where OPay sends the customer's browser afterwards. OPay does not append
    // the reference itself, so we add ?reference=…&gateway=opay before sending.
    returnUrl: process.env.OPAY_RETURN_URL,
    cancelUrl: process.env.OPAY_CANCEL_URL ?? process.env.OPAY_RETURN_URL,
    expireMinutes: Number(process.env.OPAY_EXPIRE_MINUTES ?? 30),
  };
});
