import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';

import { AiRateLimitConfig } from './entities/ai-rate-limit-config.entity';
import { AiUsageLog } from './entities/ai-usage-log.entity';
import { EntitlementsService } from 'src/entitlements/entitlements.service';
import { NotificationType, SubscriptionTier, AdminAlertPriority, AdminAlertType, FeatureKey } from 'src/common/enums/enums';
import { NotificationsService } from 'src/notifications/notifications.service';
import { AdminAlertsService } from 'src/admin-alerts/admin-alerts.service';

interface SeedLimit {
  requestsPerDay: number;
  requestsPerHour: number;
  tokensPerDay: number;
  concurrentSessions: number;
}

// Which admin-editable access rule governs each AI capability.
const AI_FEATURE_KEY: Record<'tutor' | 'explain' | 'explain_more', FeatureKey> = {
  tutor: FeatureKey.AI_TUTOR,
  explain: FeatureKey.AI_EXPLAIN,
  explain_more: FeatureKey.AI_EXPLAIN_MORE,
};

// Real tier scheme: FREE, BASIC, STANDARD, PREMIUM, ENTERPRISE. These are
// starter numbers, not pricing decisions — edit via
// PATCH /ai/admin/rate-limits/:tier, no redeploy needed. ENTERPRISE is
// left generous on the assumption it's sales-negotiated / effectively
// unmetered; tighten it if that's not the case.
//
// These are NUMERIC caps (how much, per tier). WHETHER a feature is free or
// paid at all is a separate, admin-editable rule — see EntitlementsService /
// PATCH /admin/feature-rules/:key. By default AI Tutor and AI Explain are
// paid features (blocked for FREE); AI scoring is open, so free users still
// get their CBT attempts graded within the small cap below.
const SEED_LIMITS: Record<SubscriptionTier, SeedLimit> = {
  [SubscriptionTier.FREE]: {
    requestsPerDay: 5,
    requestsPerHour: 5,
    tokensPerDay: 8_000,
    concurrentSessions: 1,
  },
  [SubscriptionTier.BASIC]: {
    requestsPerDay: 100,
    requestsPerHour: 20,
    tokensPerDay: 100_000,
    concurrentSessions: 1,
  },
  [SubscriptionTier.STANDARD]: {
    requestsPerDay: 300,
    requestsPerHour: 50,
    tokensPerDay: 300_000,
    concurrentSessions: 2,
  },
  [SubscriptionTier.PREMIUM]: {
    requestsPerDay: 800,
    requestsPerHour: 150,
    tokensPerDay: 800_000,
    concurrentSessions: 3,
  },
  [SubscriptionTier.ENTERPRISE]: {
    requestsPerDay: 5000,
    requestsPerHour: 1000,
    tokensPerDay: 5_000_000,
    concurrentSessions: 10,
  },
};

@Injectable()
export class AiRateLimitService implements OnModuleInit {
  private readonly logger = new Logger(AiRateLimitService.name);

  constructor(
    @InjectRepository(AiRateLimitConfig)
    private readonly rateLimitRepository: Repository<AiRateLimitConfig>,

    @InjectRepository(AiUsageLog)
    private readonly usageLogRepository: Repository<AiUsageLog>,

    private readonly entitlements: EntitlementsService,
    private readonly notificationsService: NotificationsService,
    private readonly adminAlertsService: AdminAlertsService,
  ) {}

  /**
   * Best-effort in-app alert so the student understands *why* they were
   * blocked, beyond the inline 429 error message. Never throws — a
   * notification failure must not mask or replace the real rate-limit
   * error being thrown by the caller.
   */
  private async alertLimitReached(userId: string, message: string): Promise<void> {
    try {
      await this.notificationsService.notify({
        userId,
        type: NotificationType.SYSTEM,
        context: {
          title: 'AI usage limit reached',
          body: message,
          actionUrl: '/pricing',
        },
        actionUrl: '/pricing',
      });
    } catch (err: any) {
      this.logger.warn(`AI-limit-reached notification failed for ${userId}: ${err.message}`);
    }
  }

  async onModuleInit(): Promise<void> {
    for (const tier of Object.values(SubscriptionTier)) {
      const exists = await this.rateLimitRepository.findOne({ where: { tier } });
      if (!exists) {
        await this.rateLimitRepository.save(
          this.rateLimitRepository.create({ tier, ...SEED_LIMITS[tier] }),
        );
        this.logger.log(`Seeded default AI rate limits for tier "${tier}".`);
      }
    }
  }

  async assertWithinLimits(userId: string): Promise<void> {
    const tier = await this.resolveTier(userId);
    const config = await this.rateLimitRepository.findOne({ where: { tier } });
    if (!config) return;

    const now = Date.now();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    const [requestsLastHour, requestsLastDay, tokensToday] = await Promise.all([
      this.usageLogRepository.count({ where: { userId, success: true, createdAt: MoreThan(oneHourAgo) } }),
      this.usageLogRepository.count({ where: { userId, success: true, createdAt: MoreThan(oneDayAgo) } }),
      this.sumTokens(userId, oneDayAgo),
    ]);

    if (requestsLastHour >= config.requestsPerHour) {
      const message = `Hourly AI request limit reached (${config.requestsPerHour}/hour on your plan). Try again later or upgrade your plan.`;
      await this.alertLimitReached(userId, message);
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }
    if (requestsLastDay >= config.requestsPerDay) {
      const message = `Daily AI request limit reached (${config.requestsPerDay}/day on your plan). Try again tomorrow or upgrade your plan.`;
      await this.alertLimitReached(userId, message);
      this.raiseHighUsageAdminAlert(userId, 'requests/day', config.requestsPerDay);
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }
    if (tokensToday >= config.tokensPerDay) {
      const message = `Daily AI usage limit reached for your plan. Try again tomorrow or upgrade your plan.`;
      await this.alertLimitReached(userId, message);
      this.raiseHighUsageAdminAlert(userId, 'tokens/day', config.tokensPerDay);
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  /**
   * Best-effort, non-blocking. Fires every time a user hits their DAILY cap
   * (deliberately not the hourly cap — that's normal usage friction, not a
   * signal worth an admin's attention). Doesn't try to deduplicate repeat
   * hits from the same user across a day — if that turns out to be noisy
   * in practice, add a cooldown check here (e.g. skip if an unresolved
   * high_usage_alert for this userId was raised in the last N hours).
   */
  private raiseHighUsageAdminAlert(userId: string, limitType: string, limitValue: number): void {
    this.adminAlertsService
      .raise({
        type: AdminAlertType.HIGH_USAGE_ALERT,
        title: 'User hit daily AI usage cap',
        body: `User ${userId} hit their daily AI ${limitType} limit (${limitValue}). Could be legitimate heavy use or abuse (e.g. scripted requests) — worth a quick look if it recurs.`,
        priority: AdminAlertPriority.LOW,
        actionUrl: `/admin/users/${userId}`,
        metadata: { userId, limitType, limitValue },
      })
      .catch((err) => this.logger.warn(`high_usage_alert admin alert failed for ${userId}: ${err.message}`));
  }

  /**
   * Is this AI feature open to this user under the CURRENT admin-configured
   * rule (free / paid-from-tier / free-quota / timed promo / disabled)?
   * Throws a 403 with { code: 'UPGRADE_REQUIRED' | 'QUOTA_EXHAUSTED' |
   * 'FEATURE_DISABLED' } otherwise.
   *
   * Each AI capability has its OWN admin rule, so the first explanation, the
   * deeper "Explain more", and the tutor can each be free or paid on their
   * own. `alreadyUnlocked` = the caller has already spent a free use on this
   * exact item (e.g. re-opening the same question): it is let through without
   * counting a second free use — but a switched-off or paid-only feature still
   * blocks.
   */
  async assertFeatureAllowedForTier(
    userId: string,
    feature: 'tutor' | 'explain' | 'explain_more',
    opts: { alreadyUnlocked?: boolean } = {},
  ): Promise<void> {
    await this.entitlements.assertAccess(userId, AI_FEATURE_KEY[feature], opts);
  }

  async getLimitsForUser(userId: string): Promise<AiRateLimitConfig> {
    const tier = await this.resolveTier(userId);
    const config = await this.rateLimitRepository.findOne({ where: { tier } });
    if (!config) throw new Error(`No rate limit config for tier "${tier}" — seeding may have failed.`);
    return config;
  }

  async listAll(): Promise<AiRateLimitConfig[]> {
    return this.rateLimitRepository.find();
  }

  async update(tier: SubscriptionTier, patch: Partial<AiRateLimitConfig>): Promise<AiRateLimitConfig> {
    await this.rateLimitRepository.update({ tier }, patch);
    const updated = await this.rateLimitRepository.findOne({ where: { tier } });
    if (!updated) throw new Error(`No rate limit config for tier "${tier}".`);
    return updated;
  }

  // Delegates to the shared resolver so expiry/grace is judged identically
  // everywhere (this used to trust any ACTIVE/PAST_DUE row, expired or not).
  private async resolveTier(userId: string): Promise<SubscriptionTier> {
    return this.entitlements.resolveTier(userId);
  }

  private async sumTokens(userId: string, since: Date): Promise<number> {
    const result = await this.usageLogRepository
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.tokensInput + l.tokensOutput), 0)', 'sum')
      .where('l.userId = :userId', { userId })
      .andWhere('l.createdAt > :since', { since })
      .andWhere('l.success = true')
      .getRawOne<{ sum: string }>();
    return Number(result?.sum ?? 0);
  }
}
