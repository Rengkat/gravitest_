import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PaginationModule } from './common/pagination/pagination.module';
import { MailModule } from './mail/mail.module';

import appConfig from './config/appConfig';
import databaseConfig from './config/databaseConfig';
import mailConfig from './mail/config/mailConfig';
import jwtConfig from './auth/config/jwtConfig';
import paystackConfig from './config/paystackConfig';
import opayConfig from './config/opayConfig';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { HashModule } from './common/hash/hash.module';
import { StudentsModule } from './students/students.module';
import { QuestionsModule } from './questions/questions.module';
import { GamesModule } from './games/games.module';
import { LibraryModule } from './library/library.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UserBillingModule } from './user-billing/user-billing.module';
import { PlansModule } from './plans/plans.module';
import { PaymentsModule } from './payments/payments.module';
import { EntitlementsModule } from './entitlements/entitlements.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BlogModule } from './blog/blog.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AiModule } from './ai/ai.module';
import { ExamsModule } from './exams/exams.module';
import aiConfig from './config/aiConfig';
import redisConfig from './config/redisConfig';
import storageConfig from './config/storageConfig';
import searchConfig from './config/searchConfig';
import vectorConfig from './config/vectorConfig';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';
import { SearchModule } from './search/search.module';
import { VectorModule } from './vector/vector.module';
import { RealtimeModule } from './realtime/realtime.module';
import { AdminAlertsModule } from './admin-alerts/admin-alerts.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { PlatformSettingsModule } from './platform-settings/platform-settings.module';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
      load: [
        appConfig,
        databaseConfig,
        mailConfig,
        jwtConfig,
        aiConfig,
        paystackConfig,
        opayConfig,
        redisConfig,
        storageConfig,
        searchConfig,
        vectorConfig,
      ],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        APP_NAME: Joi.string().default('Gravitest'),
        APP_URL: Joi.string().uri().default('http://localhost:3000'),
        APP_LOGO_URL: Joi.string()
          .uri()
          .default('https://gravitest.ng/logo.png'),
        APP_PORT: Joi.number().default(5000),
        API_URL: Joi.string().uri().default('http://localhost:5000/api/v1'),

        // DATABASE
        DATABASE_TYPE: Joi.string().default('postgres'),
        DATABASE_HOST: Joi.string().default('localhost'),
        DATABASE_PORT: Joi.number().default(5432),
        DATABASE_USERNAME: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),

        // JWT
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_TOKEN_AUDIENCE: Joi.string().required(),
        JWT_TOKEN_ISSUER: Joi.string().required(),
        JWT_ACCESS_TOKEN_TTL: Joi.number().default(900),
        JWT_REFRESH_TOKEN_TTL: Joi.number().default(2592000),

        // MAIL
        RESEND_API_KEY: Joi.string().required(),
        MAIL_FROM_NAME: Joi.string().default('Gravitest'),
        MAIL_FROM_ADDRESS: Joi.string().email().required(),
        MAIL_SUPPORT_ADDRESS: Joi.string()
          .email()
          .default('support@gravitest.ng'),

        // REDIS (Upstash or self-hosted) — not `.required()` so local dev
        // without Redis provisioned yet doesn't fail app bootstrap; the
        // RedisModule factory will just fail loudly the first time
        // something tries to use it.
        REDIS_URL: Joi.string().optional(),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().optional().allow(''),
        REDIS_TLS: Joi.boolean().default(false),

        // CLOUDFLARE R2
        R2_ACCOUNT_ID: Joi.string().optional().allow(''),
        R2_ACCESS_KEY_ID: Joi.string().optional().allow(''),
        R2_SECRET_ACCESS_KEY: Joi.string().optional().allow(''),
        R2_BUCKET: Joi.string().default('gravitest-library'),
        R2_PUBLIC_BASE_URL: Joi.string().optional().allow(''),
        R2_SIGNED_URL_TTL: Joi.number().default(3600),

        // MEILISEARCH
        MEILISEARCH_HOST: Joi.string().default('http://localhost:7700'),
        MEILISEARCH_API_KEY: Joi.string().optional().allow(''),

        // QDRANT
        QDRANT_URL: Joi.string().default('http://localhost:6333'),
        QDRANT_API_KEY: Joi.string().optional().allow(''),
        QDRANT_VECTOR_SIZE: Joi.number().default(768),

        // AI PROVIDERS
        GROQ_API_KEY: Joi.string().optional().allow(''),
        GOOGLE_AI_API_KEY: Joi.string().optional().allow(''),
        OPENAI_API_KEY: Joi.string().optional().allow(''),
        ANTHROPIC_API_KEY: Joi.string().optional().allow(''),
        DEEPSEEK_API_KEY: Joi.string().optional().allow(''),
        MISTRAL_API_KEY: Joi.string().optional().allow(''),
        OPENROUTER_API_KEY: Joi.string().optional().allow(''),

        // PAYSTACK — required in production: without these the gateway reports
        // itself unconfigured and customers could not pay, so fail the boot
        // loudly instead of discovering it from a support ticket.
        PAYSTACK_SECRET_KEY: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.string().required(),
          otherwise: Joi.string().optional().allow(''),
        }),
        PAYSTACK_PUBLIC_KEY: Joi.string().optional().allow(''),
        PAYSTACK_BASE_URL: Joi.string()
          .uri()
          .default('https://api.paystack.co'),
        PAYSTACK_CALLBACK_URL: Joi.string()
          .uri()
          .when('NODE_ENV', {
            is: 'production',
            then: Joi.string()
              .uri({ scheme: ['https'] })
              .required(),
            otherwise: Joi.string().uri().optional().allow(''),
          }),

        // PAYMENT GATEWAYS — Paystack's vars are read directly in
        // config/paystackConfig.ts. OPay (config/opayConfig.ts) is optional:
        // unset = the gateway simply can't be enabled by admins.
        OPAY_ENV: Joi.string().valid('sandbox', 'live').default('sandbox'),
        OPAY_MERCHANT_ID: Joi.string().when('OPAY_ENV', {
          is: 'live',
          then: Joi.string().required(),
          otherwise: Joi.string().optional().allow(''),
        }),
        OPAY_PUBLIC_KEY: Joi.string().when('OPAY_ENV', {
          is: 'live',
          then: Joi.string().required(),
          otherwise: Joi.string().optional().allow(''),
        }),
        OPAY_SECRET_KEY: Joi.string().when('OPAY_ENV', {
          is: 'live',
          then: Joi.string().required(),
          otherwise: Joi.string().optional().allow(''),
        }),
        OPAY_CALLBACK_URL: Joi.string().when('OPAY_ENV', {
          is: 'live',
          then: Joi.string()
            .uri({ scheme: ['https'] })
            .required(),
          otherwise: Joi.string().uri().optional().allow(''),
        }),
        OPAY_RETURN_URL: Joi.string().when('OPAY_ENV', {
          is: 'live',
          then: Joi.string()
            .uri({ scheme: ['https'] })
            .required(),
          otherwise: Joi.string().uri().optional().allow(''),
        }),
        OPAY_CANCEL_URL: Joi.string().uri().optional().allow(''),
        OPAY_EXPIRE_MINUTES: Joi.number().min(1).max(1440).default(30),

        // RATE LIMITING (global API throttle, distinct from the AI
        // feature-level rate limiter in AiRateLimitService)
        THROTTLE_TTL_MS: Joi.number().default(60000),
        THROTTLE_LIMIT: Joi.number().default(120),
      }),
      validationOptions: {
        abortEarly: true,
      },
    }),

    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (dbConfig: TypeOrmModuleOptions): TypeOrmModuleOptions =>
        dbConfig,
    }),

    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: parseInt(process.env.THROTTLE_TTL_MS || '60000', 10),
            limit: parseInt(process.env.THROTTLE_LIMIT || '120', 10),
          },
        ],
      }),
    }),

    // Registered once here, at the root, so every @Cron()-decorated method
    // anywhere in the app (BroadcastSchedulerProvider, SubscriptionsService,
    // etc.) is discovered and scheduled. This was previously only imported
    // inside NotificationsModule, which the schedule discovery relies on
    // being present in the module graph at all — moving it to the root
    // makes that dependency explicit instead of incidental.
    ScheduleModule.forRoot(),

    PaginationModule,
    MailModule,

    RedisModule,
    StorageModule,
    SearchModule,
    VectorModule,
    QueueModule,
    RealtimeModule,

    UserModule,
    AuthModule,
    HashModule,
    StudentsModule,
    QuestionsModule,
    GamesModule,
    LibraryModule,
    NotificationsModule,
    TransactionsModule,
    BlogModule,
    EventEmitterModule.forRoot(),
    SubscriptionsModule,
    UserBillingModule,
    PlansModule,
    PaymentsModule,
    EntitlementsModule,
    AiModule,
    ExamsModule,
    AdminAlertsModule,
    LeaderboardModule,
    PlatformSettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
