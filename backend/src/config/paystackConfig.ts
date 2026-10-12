import { registerAs } from '@nestjs/config';

// Blank values in .env (e.g. "PAYSTACK_BASE_URL=") arrive as empty strings, so
// use a trimmed check, not `??`: an empty value must behave like an unset one.
const clean = (v: string | undefined): string | undefined => v?.trim() || undefined;

export default registerAs('paystack', () => ({
  secretKey: clean(process.env.PAYSTACK_SECRET_KEY),
  publicKey: clean(process.env.PAYSTACK_PUBLIC_KEY),
  baseUrl: clean(process.env.PAYSTACK_BASE_URL) ?? 'https://api.paystack.co',
  // Where Paystack redirects the browser after checkout completes.
  // Your frontend route reads `?reference=` from the URL and calls
  // GET /billing/verify/:reference to confirm status and show a result screen.
  callbackUrl: clean(process.env.PAYSTACK_CALLBACK_URL),
}));
