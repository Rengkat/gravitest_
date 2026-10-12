import { registerAs } from '@nestjs/config';

export default registerAs('appConfig', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  name: process.env.APP_NAME || 'Gravitest',
  frontendUrl: process.env.APP_URL || 'http://localhost:3000',
  // The backend's own public base URL, including the global API prefix
  // (see main.ts's setGlobalPrefix) — needed for links that must hit the
  // API directly rather than the frontend, e.g. the one-click unsubscribe
  // link in emails (mail/mail.controller.ts), which renders its own HTML
  // response and isn't a frontend route.
  apiUrl: process.env.API_URL || 'http://localhost:5000/api/v1',
  logoUrl: process.env.APP_LOGO_URL || 'https://gravitest.ng/logo.png',
}));
