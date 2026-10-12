import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as passport from 'passport';
import { requestContextMiddleware } from './common/request-context/request-context';
async function bootstrap() {
  // rawBody: true is REQUIRED for Paystack webhook signature verification —
  // TransactionsService.handleWebhook() HMACs req.rawBody against the
  // x-paystack-signature header. Without this flag, req.rawBody is
  // undefined and PaystackWebhookController.handle() would either crash
  // or (worse) silently no-op depending on how it's called — this was the
  // actual missing piece, not the HMAC check itself (that part was already
  // implemented correctly in TransactionsService.handleWebhook()).
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Makes the current request available to PaginationProvider without
  // making it (and every service using it) request-scoped — that bubbling is
  // what kept the subscription renewal/expiry cron jobs from ever running.
  app.use(requestContextMiddleware);

  // ── Get ConfigService from the DI container ──
  const configService = app.get(ConfigService);

  // console.log('=== PASSPORT STRATEGIES ===');
  // console.log((passport as any)._strategies);
  // console.log('===========================');

  const port = configService.get<number>('app.port', 5000);
  const nodeEnv = configService.get<string>('appConfig.env', 'production');

  // ── Hardening ─────────────────────────────────────────────────
  // Behind a load balancer/CDN (Railway, Render, Cloudflare…) the real client
  // IP and protocol arrive in X-Forwarded-*. Without this, rate limiting sees
  // ONE IP for every user and page links are built with http://.
  const http = app.getHttpAdapter().getInstance();
  http.set('trust proxy', 1);
  http.disable('x-powered-by');
  // The API only serves JSON, so lock the browser-side defaults down.
  http.use((_req: unknown, res: { setHeader(k: string, v: string): void }, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    if (nodeEnv === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // ── CORS ──────────────────────────────────────────────────────
  // Frontend (Next.js dev server, or the deployed app) lives on a
  // different origin than the API, so the browser enforces CORS on
  // every request unless we explicitly allow it here. `credentials: true`
  // is required because auth uses httpOnly cookies/refresh tokens —
  // without it, the browser silently drops Set-Cookie on cross-origin
  // responses even if the request itself succeeds.
  app.enableCors({
    origin: configService.get<string>(
      'appConfig.frontendUrl',
      'http://localhost:3000',
    ),
    credentials: true,
  });

  //======== Global prefix ==========
  app.setGlobalPrefix('api/v1');

  //======== Validation pipe =========
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // ── Swagger (dev + staging only) ────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Gravitest API')
      .setDescription(
        'Nigerian EdTech SaaS — JAMB, WAEC, ICAN exam prep + AI tutoring',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addServer(`http://localhost:${port}`, 'Local')
      .addServer('https://api.gravitest.ng', 'Production')
      .addTag('Auth', 'Registration, login, OTP, password reset')
      .addTag('Users', 'User profile management')
      .addTag('CBT', 'Exam sessions, questions, timer')
      .addTag('AI', 'Sabi-Explain, Sabi-Tutor chat, essay marking')
      .addTag('Payments', 'Paystack payments and subscriptions')
      .addTag('Library', 'Video lessons and PDF content')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
      },
    });
  }

  // Let in-flight requests (e.g. a payment webhook mid-way through activating a
  // plan) finish when the platform sends SIGTERM during a deploy.
  app.enableShutdownHooks();

  await app.listen(port);
}
bootstrap();
