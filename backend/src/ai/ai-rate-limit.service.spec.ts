import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AiRateLimitService } from './ai-rate-limit.service';
import { AiRateLimitConfig } from './entities/ai-rate-limit-config.entity';
import { AiUsageLog } from './entities/ai-usage-log.entity';
import { EntitlementsService } from 'src/entitlements/entitlements.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { AdminAlertsService } from 'src/admin-alerts/admin-alerts.service';
import { FeatureKey, SubscriptionTier } from 'src/common/enums/enums';

const FREE_CONFIG: Partial<AiRateLimitConfig> = {
  tier: SubscriptionTier.FREE,
  requestsPerDay: 5,
  requestsPerHour: 5,
  tokensPerDay: 8_000,
  concurrentSessions: 1,
};

const BASIC_CONFIG: Partial<AiRateLimitConfig> = {
  tier: SubscriptionTier.BASIC,
  requestsPerDay: 100,
  requestsPerHour: 20,
  tokensPerDay: 100_000,
  concurrentSessions: 1,
};

describe('AiRateLimitService', () => {
  let service: AiRateLimitService;

  let rateLimitRepo: { findOne: jest.Mock; find: jest.Mock; update: jest.Mock };
  let usageLogRepo: { count: jest.Mock; createQueryBuilder: jest.Mock };
  let entitlements: { resolveTier: jest.Mock; assertAccess: jest.Mock };
  let notificationsService: { notify: jest.Mock };
  let adminAlertsService: { raise: jest.Mock };

  // Controls what usageLogRepo.createQueryBuilder(...).getRawOne() resolves
  // to for the token-sum query, without pulling in a real query builder.
  let tokenSumResult: { sum: string } | undefined;

  beforeEach(async () => {
    tokenSumResult = { sum: '0' };

    rateLimitRepo = {
      findOne: jest.fn().mockResolvedValue(FREE_CONFIG),
      find: jest.fn(),
      update: jest.fn(),
    };
    usageLogRepo = {
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockImplementation(() => Promise.resolve(tokenSumResult)),
      }),
    };
    entitlements = {
      resolveTier: jest.fn().mockResolvedValue(SubscriptionTier.FREE), // default
      assertAccess: jest.fn().mockResolvedValue(undefined),
    };
    notificationsService = { notify: jest.fn().mockResolvedValue(undefined) };
    adminAlertsService = { raise: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiRateLimitService,
        { provide: getRepositoryToken(AiRateLimitConfig), useValue: rateLimitRepo },
        { provide: getRepositoryToken(AiUsageLog), useValue: usageLogRepo },
        { provide: EntitlementsService, useValue: entitlements },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: AdminAlertsService, useValue: adminAlertsService },
      ],
    }).compile();

    service = module.get(AiRateLimitService);
  });

  describe('assertWithinLimits', () => {
    it('does not throw when usage is under every limit', async () => {
      usageLogRepo.count.mockResolvedValue(2); // under FREE's 5/hour and 5/day
      tokenSumResult = { sum: '100' }; // under 8,000/day

      await expect(service.assertWithinLimits('user-1')).resolves.toBeUndefined();
      expect(notificationsService.notify).not.toHaveBeenCalled();
    });

    it('throws 429 and notifies the user when the hourly limit is reached', async () => {
      usageLogRepo.count.mockResolvedValueOnce(5); // requestsLastHour === requestsPerHour (5)

      await expect(service.assertWithinLimits('user-1')).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
      expect(notificationsService.notify).toHaveBeenCalledTimes(1);
      // Hourly limit is friction, not abuse — should NOT raise an admin alert.
      expect(adminAlertsService.raise).not.toHaveBeenCalled();
    });

    it('throws 429 and raises an admin alert when the daily request limit is reached', async () => {
      usageLogRepo.count
        .mockResolvedValueOnce(1) // under hourly limit
        .mockResolvedValueOnce(5); // requestsLastDay === requestsPerDay (5)

      await expect(service.assertWithinLimits('user-1')).rejects.toBeInstanceOf(HttpException);
      expect(notificationsService.notify).toHaveBeenCalledTimes(1);
      expect(adminAlertsService.raise).toHaveBeenCalledTimes(1);
      expect(adminAlertsService.raise).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'high_usage_alert' }),
      );
    });

    it('throws 429 when the daily token limit is reached, independent of request counts', async () => {
      usageLogRepo.count.mockResolvedValue(0); // well under request limits
      tokenSumResult = { sum: '8000' }; // === tokensPerDay (8,000)

      await expect(service.assertWithinLimits('user-1')).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
      expect(adminAlertsService.raise).toHaveBeenCalledTimes(1);
    });

    it('a notification failure does not mask the underlying rate-limit error', async () => {
      usageLogRepo.count.mockResolvedValueOnce(5);
      notificationsService.notify.mockRejectedValue(new Error('notify service down'));

      // Should still reject with the 429, not the notify error.
      await expect(service.assertWithinLimits('user-1')).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
    });

    it('resolves limits for the paid tier the user is actually subscribed to, not FREE', async () => {
      entitlements.resolveTier.mockResolvedValue(SubscriptionTier.BASIC);
      rateLimitRepo.findOne.mockResolvedValue(BASIC_CONFIG);
      // count() backs BOTH the hourly and the daily query. Give each its own
      // value: 15 in the last hour (over FREE's 5, under BASIC's 20) and 50
      // today (over FREE's 5, under BASIC's 100). The original test returned
      // 50 for both, which correctly tripped BASIC's 20/hour cap.
      usageLogRepo.count.mockResolvedValueOnce(15).mockResolvedValueOnce(50);

      await expect(service.assertWithinLimits('user-1')).resolves.toBeUndefined();
      expect(rateLimitRepo.findOne).toHaveBeenCalledWith({ where: { tier: SubscriptionTier.BASIC } });
    });

    it('does nothing (no throw) if no rate limit config exists for the tier — fails open, not closed', async () => {
      rateLimitRepo.findOne.mockResolvedValue(null);
      await expect(service.assertWithinLimits('user-1')).resolves.toBeUndefined();
    });
  });

  describe('assertFeatureAllowedForTier', () => {
    // WHETHER a feature is free/paid is now an admin-editable rule owned by
    // EntitlementsService (tested in entitlements.service.spec.ts). Here we
    // only pin the wiring: right feature key, and denials propagate untouched.
    it('checks the AI_TUTOR rule for the tutor', async () => {
      await service.assertFeatureAllowedForTier('user-1', 'tutor');
      expect(entitlements.assertAccess).toHaveBeenCalledWith('user-1', FeatureKey.AI_TUTOR);
    });

    it('checks the AI_EXPLAIN rule for explain', async () => {
      await service.assertFeatureAllowedForTier('user-1', 'explain');
      expect(entitlements.assertAccess).toHaveBeenCalledWith('user-1', FeatureKey.AI_EXPLAIN);
    });

    it('propagates the 403 when the rule denies access', async () => {
      entitlements.assertAccess.mockRejectedValue(
        new HttpException('Upgrade required', HttpStatus.FORBIDDEN),
      );
      await expect(service.assertFeatureAllowedForTier('user-1', 'tutor')).rejects.toMatchObject({
        status: HttpStatus.FORBIDDEN,
      });
    });
  });

  describe('resolveTier (via getLimitsForUser)', () => {
    it('falls back to FREE when the user has no active subscription', async () => {
      entitlements.resolveTier.mockResolvedValue(SubscriptionTier.FREE);
      rateLimitRepo.findOne.mockResolvedValue(FREE_CONFIG);

      await service.getLimitsForUser('user-1');
      expect(rateLimitRepo.findOne).toHaveBeenCalledWith({ where: { tier: SubscriptionTier.FREE } });
    });
  });
});
