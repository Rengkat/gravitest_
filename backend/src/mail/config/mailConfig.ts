import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  fromName: process.env.MAIL_FROM_NAME,
  fromAddress: process.env.MAIL_FROM_ADDRESS,
  supportAddress: process.env.MAIL_SUPPORT_ADDRESS,
  resendApiKey: process.env.RESEND_API_KEY,
}));
