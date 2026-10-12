import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';

import { LeaderboardSettings } from './entities/leaderboard-settings.entity';
import { LeaderboardEntry } from './entities/leaderboard-entry.entity';
import { StudentProfile } from 'src/students/entities/student-profile.entity';
import { StudyActivity } from 'src/students/entities/study-activity.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import {
  ExamType,
  NotificationChannel,
  NotificationType,
  SubscriptionStatus,
  SubscriptionTier,
  UserRole,
} from 'src/common/enums/enums';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { UpdateLeaderboardSettingsDto } from './dto/update-leaderboard-settings.dto';
import {
  LeaderboardQueryDto,
  LeaderboardScope,
} from './dto/leaderboard-query.dto';
import {
  EligibilityProgress,
  LeaderboardListResult,
  LeaderboardPeriodSummary,
  LeaderboardRow,
  MyLeaderboardPosition,
} from './types/leaderboard.types';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  private static readonly CATEGORIES = [
    UserRole.STUDENT,
    UserRole.PROFESSIONAL_STUDENT,
  ];

  constructor(
    @InjectRepository(LeaderboardSettings)
    private readonly settingsRepo: Repository<LeaderboardSettings>,
    @InjectRepository(LeaderboardEntry)
    private readonly entryRepo: Repository<LeaderboardEntry>,
    @InjectRepository(StudentProfile)
    private readonly profileRepo: Repository<StudentProfile>,
    @InjectRepository(StudyActivity)
    private readonly activityRepo: Repository<StudyActivity>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly notificationsService: NotificationsService,
    private readonly paginationProvider: PaginationProvider,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  // ══════════════════════════════════════════════════════════════
  // Settings (§1.3 / §1.7 — admin-configurable, no code changes)
  // ══════════════════════════════════════════════════════════════

  async getSettings(): Promise<LeaderboardSettings> {
    const [existing] = await this.settingsRepo.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    if (existing) return existing;
    return this.settingsRepo.save(this.settingsRepo.create({}));
  }

  async updateSettings(
    dto: UpdateLeaderboardSettingsDto,
    adminUserId: string,
  ): Promise<LeaderboardSettings> {
    const settings = await this.getSettings();
    Object.assign(settings, dto, { lastUpdatedBy: adminUserId });
    return this.settingsRepo.save(settings);
  }

  // ══════════════════════════════════════════════════════════════
  // Period helpers
  // ══════════════════════════════════════════════════════════════

  periodKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private monthRange(period: string): {
    start: Date;
    end: Date;
    daysInMonth: number;
  } {
    const [year, month] = period.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const end = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59));
    return { start, end, daysInMonth };
  }

  private elapsedDaysInPeriod(period: string): number {
    const now = new Date();
    const isCurrentMonth = period === this.periodKey(now);
    const { daysInMonth } = this.monthRange(period);
    return isCurrentMonth ? now.getUTCDate() : daysInMonth;
  }

  // ══════════════════════════════════════════════════════════════
  // Recalculation — runs on a schedule so "current" always reflects
  // live standings (§1.3 / §1.4). Also callable manually by admins.
  // ══════════════════════════════════════════════════════════════

  @Cron(CronExpression.EVERY_30_MINUTES)
  async recalculateCurrentPeriod(): Promise<{
    period: string;
    updated: number;
  }> {
    const now = new Date();
    const period = this.periodKey(now);
    const settings = await this.getSettings();
    const { start } = this.monthRange(period);
    const elapsedDays = this.elapsedDaysInPeriod(period);

    // 1) Aggregate this period's activity per student, in one grouped query.
    const raw = await this.activityRepo
      .createQueryBuilder('a')
      .select('a.studentProfileId', 'studentProfileId')
      .addSelect('COALESCE(SUM(a.xpEarned), 0)', 'xp')
      .addSelect('COALESCE(SUM(a.questionsAttempted), 0)', 'questionsAttempted')
      .addSelect('COALESCE(SUM(a.questionsCorrect), 0)', 'questionsCorrect')
      .addSelect(
        'COALESCE(SUM(a.examSessionsCompleted), 0)',
        'sessionsCompleted',
      )
      .addSelect('COUNT(*)', 'activeDays')
      .where('a.date >= :start', { start })
      .andWhere('a.date <= :now', { now })
      .groupBy('a.studentProfileId')
      .getRawMany<{
        studentProfileId: string;
        xp: string;
        questionsAttempted: string;
        questionsCorrect: string;
        sessionsCompleted: string;
        activeDays: string;
      }>();

    const activityByProfile = new Map(raw.map((r) => [r.studentProfileId, r]));

    // 2) All active students/professionals with a profile.
    const profiles = await this.profileRepo
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('user.role IN (:...roles)', {
        roles: LeaderboardService.CATEGORIES,
      })
      .andWhere('user.isActive = true')
      .andWhere('user.deletedAt IS NULL')
      .getMany();

    if (profiles.length === 0) return { period, updated: 0 };

    // 3) Which of these users currently have an active subscription?
    const userIds = profiles.map((p) => p.user.id);
    const activeSubUserIds = await this.getActiveSubscriberIds(userIds);

    // 4) Existing entries this period, so we update in place instead of
    //    creating duplicates (unique constraint on studentProfileId+period).
    const existing = await this.entryRepo.find({ where: { period } });
    const existingByProfile = new Map(
      existing.map((e) => [e.studentProfileId, e]),
    );

    const toSave: LeaderboardEntry[] = [];

    for (const profile of profiles) {
      const agg = activityByProfile.get(profile.id);
      const xpEarned = agg ? Number(agg.xp) : 0;
      const questionsAttempted = agg ? Number(agg.questionsAttempted) : 0;
      const questionsCorrect = agg ? Number(agg.questionsCorrect) : 0;
      const sessionsCompleted = agg ? Number(agg.sessionsCompleted) : 0;
      const activeDays = agg ? Number(agg.activeDays) : 0;

      const performance =
        questionsAttempted > 0
          ? (questionsCorrect / questionsAttempted) * 100
          : 0;
      const consistency =
        elapsedDays > 0 ? Math.min(100, (activeDays / elapsedDays) * 100) : 0;
      const streak = profile.currentStreak ?? 0;

      const score =
        xpEarned * settings.xpWeight +
        streak * settings.streakWeight +
        performance * settings.performanceWeight +
        consistency * settings.consistencyWeight;

      const isSubscriber = activeSubUserIds.has(profile.user.id);
      const isEligible =
        (!settings.subscribersOnly || isSubscriber) &&
        sessionsCompleted >= settings.minSessionsRequired &&
        questionsAttempted >= settings.minQuestionsAttemptedRequired;

      const entry =
        existingByProfile.get(profile.id) ??
        this.entryRepo.create({
          studentProfileId: profile.id,
          userId: profile.user.id,
          period,
        });

      entry.userId = profile.user.id;
      entry.category = profile.user.role;
      entry.examTargets = profile.examTargets ?? [];
      entry.xpEarned = xpEarned;
      entry.streak = streak;
      entry.performance = Math.round(performance * 100) / 100;
      entry.consistency = Math.round(consistency * 100) / 100;
      entry.sessionsCompleted = sessionsCompleted;
      entry.questionsAttempted = questionsAttempted;
      entry.activeDays = activeDays;
      entry.score = Math.round(score * 100) / 100;
      entry.isSubscriber = isSubscriber;
      entry.isEligible = isEligible;

      toSave.push(entry);
    }

    // Batch save to avoid one giant parameterized statement.
    const chunkSize = 250;
    for (let i = 0; i < toSave.length; i += chunkSize) {
      await this.entryRepo.save(toSave.slice(i, i + chunkSize));
    }

    this.logger.log(
      `Recalculated leaderboard for ${period}: ${toSave.length} entries`,
    );

    // Cache-invalidation ping for anyone subscribed via the realtime
    // gateway's `leaderboard:{scope}` rooms (join event already wired up
    // client-side per RealtimeGateway's leaderboard:join handler) — the
    // payload is intentionally light; clients refetch via the REST
    // endpoints above rather than trusting the socket as a data source.
    this.realtimeGateway.emitLeaderboardUpdate('general', {
      period,
      updatedAt: new Date(),
    });
    for (const category of LeaderboardService.CATEGORIES) {
      this.realtimeGateway.emitLeaderboardUpdate(`category:${category}`, {
        period,
        updatedAt: new Date(),
      });
    }

    return { period, updated: toSave.length };
  }

  private async getActiveSubscriberIds(
    userIds: string[],
  ): Promise<Set<string>> {
    if (userIds.length === 0) return new Set();
    const rows = await this.subscriptionRepo
      .createQueryBuilder('s')
      .select('s.user_id', 'userId')
      .where('s.user_id IN (:...userIds)', { userIds })
      .andWhere('s.status = :status', { status: SubscriptionStatus.ACTIVE })
      // The free plan is stored as an ACTIVE subscription row too — it must not
      // make someone a "subscriber" for a subscribers-only leaderboard.
      .andWhere('s.tier != :free', { free: SubscriptionTier.FREE })
      .andWhere('(s.expiresAt IS NULL OR s.expiresAt > :now)', {
        now: new Date(),
      })
      .getRawMany<{ userId: string }>();
    return new Set(rows.map((r) => r.userId));
  }

  // ══════════════════════════════════════════════════════════════
  // Monthly finalization (§1.5 / §1.11) — freezes the period, marks
  // incentive qualifiers, and kicks off the next period automatically
  // (the next recalculation simply targets the new month's periodKey).
  // ══════════════════════════════════════════════════════════════

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async autoFinalizeIfMonthEnd(): Promise<void> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(now.getUTCDate() + 1);
    const isLastDayOfMonth = tomorrow.getUTCMonth() !== now.getUTCMonth();
    if (!isLastDayOfMonth) return;

    // Recalculate one last time with today's activity before freezing.
    const period = this.periodKey(now);
    await this.recalculateCurrentPeriod();
    await this.finalizeMonth(period);
  }

  async finalizeMonth(
    period: string,
  ): Promise<{ period: string; finalized: number }> {
    const settings = await this.getSettings();
    const entries = await this.entryRepo.find({
      where: { period, isFinalized: false },
    });
    if (entries.length === 0) return { period, finalized: 0 };

    for (const category of LeaderboardService.CATEGORIES) {
      const eligibleInCategory = entries
        .filter((e) => e.category === category && e.isEligible)
        .sort((a, b) => b.score - a.score);

      eligibleInCategory.slice(0, settings.incentiveTopN).forEach((e) => {
        e.qualifiesForIncentive = true;
      });
    }

    const now = new Date();
    entries.forEach((e) => {
      e.isFinalized = true;
      e.finalizedAt = now;
    });

    const chunkSize = 250;
    for (let i = 0; i < entries.length; i += chunkSize) {
      await this.entryRepo.save(entries.slice(i, i + chunkSize));
    }

    if (settings.notifyOnResultsPublished) {
      await this.sendMonthEndNotifications(period, entries);
    }

    this.logger.log(
      `Finalized leaderboard for ${period}: ${entries.length} entries`,
    );
    this.realtimeGateway.emitLeaderboardUpdate('general', {
      period,
      finalized: true,
      updatedAt: new Date(),
    });
    return { period, finalized: entries.length };
  }

  private async sendMonthEndNotifications(
    period: string,
    entries: LeaderboardEntry[],
  ): Promise<void> {
    for (const entry of entries) {
      try {
        await this.notificationsService.notify({
          userId: entry.userId,
          type: NotificationType.LEADERBOARD_UPDATE,
          channel: NotificationChannel.IN_APP,
          context: { type: 'results_published', period, rank: null },
        });
        if (entry.qualifiesForIncentive) {
          await this.notificationsService.notify({
            userId: entry.userId,
            type: NotificationType.LEADERBOARD_UPDATE,
            channel: NotificationChannel.IN_APP,
            context: { type: 'incentive_qualified', period },
          });
        }
      } catch (err) {
        // Never let one failed notification abort the finalization pass.
        this.logger.warn(
          `Failed to send month-end notification to user ${entry.userId}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // "Closing soon" nudges (§1.9)
  // ══════════════════════════════════════════════════════════════

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async notifyApproachingClose(): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.notifyDaysBeforeClose?.length) return;

    const now = new Date();
    const period = this.periodKey(now);
    const { daysInMonth } = this.monthRange(period);
    const daysLeft = daysInMonth - now.getUTCDate();
    if (!settings.notifyDaysBeforeClose.includes(daysLeft)) return;

    const entries = await this.entryRepo
      .createQueryBuilder('entry')
      .where('entry.period = :period', { period })
      .andWhere('entry.isEligible = true')
      .andWhere('NOT (:daysLeft = ANY(entry.notifiedCloseOffsets))', {
        daysLeft,
      })
      .getMany();

    for (const entry of entries) {
      const rank = await this.computeRank(entry, { scope: 'category' });
      try {
        await this.notificationsService.notify({
          userId: entry.userId,
          type: NotificationType.LEADERBOARD_UPDATE,
          channel: NotificationChannel.IN_APP,
          context: { type: 'closing_soon', daysLeft, rank },
        });
        entry.notifiedCloseOffsets = [...entry.notifiedCloseOffsets, daysLeft];
        await this.entryRepo.save(entry);
      } catch (err) {
        this.logger.warn(
          `Failed to send closing-soon notification to user ${entry.userId}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Reads — general / category / exam-type / monthly (§1.1, §1.6, §1.8)
  // ══════════════════════════════════════════════════════════════

  /**
   * What is still missing for this entry to count on the leaderboard, in plain
   * English. Single source of truth for the admin list and the student's own
   * "why am I not ranked?" message.
   */
  private eligibilityProgress(
    entry: Pick<LeaderboardEntry, 'isSubscriber' | 'sessionsCompleted' | 'questionsAttempted'> | null,
    settings: LeaderboardSettings,
  ): EligibilityProgress {
    const isSubscriber = entry?.isSubscriber ?? false;
    const sessions = entry?.sessionsCompleted ?? 0;
    const questions = entry?.questionsAttempted ?? 0;
    const missing: string[] = [];
    if (settings.subscribersOnly && !isSubscriber) missing.push('Needs an active paid subscription');
    if (sessions < settings.minSessionsRequired) {
      missing.push(`${sessions} of ${settings.minSessionsRequired} practice sessions this month`);
    }
    if (questions < settings.minQuestionsAttemptedRequired) {
      missing.push(`${questions} of ${settings.minQuestionsAttemptedRequired} questions attempted this month`);
    }
    return {
      subscribersOnly: settings.subscribersOnly,
      isSubscriber,
      sessions: { have: sessions, need: settings.minSessionsRequired },
      questions: { have: questions, need: settings.minQuestionsAttemptedRequired },
      missing,
    };
  }

  async getLeaderboard(
    query: LeaderboardQueryDto,
    currentUserId?: string,
  ): Promise<LeaderboardListResult> {
    const scope = query.scope ?? LeaderboardScope.GENERAL;
    const period =
      !query.period || query.period === 'current'
        ? this.periodKey(new Date())
        : query.period;

    if (scope === LeaderboardScope.CATEGORY && !query.category) {
      throw new BadRequestException('category is required when scope=category');
    }
    if (scope === LeaderboardScope.EXAM_TYPE && !query.examType) {
      throw new BadRequestException(
        'examType is required when scope=exam_type',
      );
    }

    const qb = this.entryRepo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.studentProfile', 'profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('entry.period = :period', { period });

    if (!query.includeIneligible) {
      qb.andWhere('entry.isEligible = true');
    }
    if (scope === LeaderboardScope.CATEGORY) {
      qb.andWhere('entry.category = :category', { category: query.category });
    }
    if (scope === LeaderboardScope.EXAM_TYPE) {
      qb.andWhere(':examType = ANY(entry.examTargets)', {
        examType: query.examType,
      });
    }

    qb.orderBy('entry.score', 'DESC').addOrderBy('entry.createdAt', 'ASC');

    const paginated = await this.paginationProvider.paginateQueryBuilder(qb, {
      page: query.page,
      limit: query.limit,
    });

    const settings = query.includeIneligible ? await this.getSettings() : null;

    const offset =
      (paginated.meta.currentPage - 1) * paginated.meta.itemsPerPage;
    const rows: LeaderboardRow[] = paginated.data.map((entry, index) => ({
      rank: offset + index + 1,
      studentProfileId: entry.studentProfileId,
      userId: entry.userId,
      fullName: entry.studentProfile?.user?.fullName ?? 'Unknown',
      avatarUrl: entry.studentProfile?.user?.avatarUrl ?? null,
      category: entry.category,
      examTargets: entry.examTargets,
      xpEarned: entry.xpEarned,
      streak: entry.streak,
      performance: entry.performance,
      consistency: entry.consistency,
      score: entry.score,
      qualifiesForIncentive: entry.qualifiesForIncentive,
      isCurrentUser: currentUserId ? entry.userId === currentUserId : undefined,
      isEligible: entry.isEligible,
      ineligibleReasons:
        settings && !entry.isEligible ? this.eligibilityProgress(entry, settings).missing : undefined,
    }));

    return {
      period,
      isFinalized: period !== this.periodKey(new Date()),
      scope,
      category:
        scope === LeaderboardScope.CATEGORY ? (query.category ?? null) : null,
      examType:
        scope === LeaderboardScope.EXAM_TYPE ? (query.examType ?? null) : null,
      rows,
      meta: {
        totalItems: paginated.meta.totalItems,
        itemCount: paginated.meta.itemCount,
        itemsPerPage: paginated.meta.itemsPerPage,
        totalPages: paginated.meta.totalPages,
        currentPage: paginated.meta.currentPage,
      },
    };
  }

  // ══════════════════════════════════════════════════════════════
  // "Me" — a user's own standing across every scope they care about (§1.8)
  // ══════════════════════════════════════════════════════════════

  async getMyPosition(
    userId: string,
    periodInput = 'current',
  ): Promise<MyLeaderboardPosition> {
    const period =
      !periodInput || periodInput === 'current'
        ? this.periodKey(new Date())
        : periodInput;

    const entry = await this.entryRepo.findOne({ where: { userId, period } });
    const settings = await this.getSettings();
    if (!entry) {
      return {
        period,
        isFinalized: period !== this.periodKey(new Date()),
        isEligible: false,
        qualifiesForIncentive: false,
        entry: null,
        ranks: { general: null, category: null, examType: [] },
        totals: { general: 0, category: 0 },
        eligibility: this.eligibilityProgress(null, settings),
      };
    }

    const [generalRank, categoryRank, generalTotal, categoryTotal] =
      await Promise.all([
        this.computeRank(entry, { scope: 'general' }),
        this.computeRank(entry, { scope: 'category' }),
        this.entryRepo.count({ where: { period, isEligible: true } }),
        this.entryRepo.count({
          where: { period, isEligible: true, category: entry.category },
        }),
      ]);

    const examTypeRanks = await Promise.all(
      entry.examTargets.map(async (examType) => ({
        examType,
        rank: await this.computeRank(entry, { scope: 'exam_type', examType }),
      })),
    );

    return {
      period,
      isFinalized: entry.isFinalized,
      isEligible: entry.isEligible,
      qualifiesForIncentive: entry.qualifiesForIncentive,
      entry: {
        xpEarned: entry.xpEarned,
        streak: entry.streak,
        performance: entry.performance,
        consistency: entry.consistency,
        score: entry.score,
      },
      ranks: {
        general: generalRank,
        category: categoryRank,
        examType: examTypeRanks,
      },
      totals: { general: generalTotal, category: categoryTotal },
      eligibility: this.eligibilityProgress(entry, settings),
    };
  }

  /** 1-based rank of `entry` within the given scope, among eligible entries. */
  private async computeRank(
    entry: LeaderboardEntry,
    opts: { scope: 'general' | 'category' | 'exam_type'; examType?: ExamType },
  ): Promise<number | null> {
    if (!entry.isEligible) return null;

    const qb = this.entryRepo
      .createQueryBuilder('e')
      .where('e.period = :period', { period: entry.period })
      .andWhere('e.isEligible = true')
      .andWhere('e.score > :score', { score: entry.score });

    if (opts.scope === 'category') {
      qb.andWhere('e.category = :category', { category: entry.category });
    }
    if (opts.scope === 'exam_type' && opts.examType) {
      qb.andWhere(':examType = ANY(e.examTargets)', {
        examType: opts.examType,
      });
    }

    const ahead = await qb.getCount();
    return ahead + 1;
  }

  // ══════════════════════════════════════════════════════════════
  // History (§1.11)
  // ══════════════════════════════════════════════════════════════

  async getHistoryPeriods(): Promise<LeaderboardPeriodSummary[]> {
    const raw = await this.entryRepo
      .createQueryBuilder('entry')
      .select('entry.period', 'period')
      .addSelect('BOOL_AND(entry.isFinalized)', 'isFinalized')
      .addSelect('MAX(entry.finalizedAt)', 'finalizedAt')
      .addSelect('COUNT(*)', 'totalCount')
      .addSelect(
        'SUM(CASE WHEN entry.isEligible THEN 1 ELSE 0 END)',
        'eligibleCount',
      )
      .groupBy('entry.period')
      .orderBy('entry.period', 'DESC')
      .getRawMany<{
        period: string;
        isFinalized: boolean;
        finalizedAt: Date | null;
        totalCount: string;
        eligibleCount: string;
      }>();

    return raw.map((r) => ({
      period: r.period,
      isFinalized: r.isFinalized,
      finalizedAt: r.finalizedAt,
      totalCount: Number(r.totalCount),
      eligibleCount: Number(r.eligibleCount),
    }));
  }

  // ══════════════════════════════════════════════════════════════
  // Admin — incentive-eligible list for a finalized (or current) period
  // ══════════════════════════════════════════════════════════════

  async getIncentiveEligible(
    period: string,
    category?: UserRole,
  ): Promise<LeaderboardRow[]> {
    const qb = this.entryRepo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.studentProfile', 'profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('entry.period = :period', { period })
      .andWhere('entry.qualifiesForIncentive = true');

    if (category) {
      qb.andWhere('entry.category = :category', { category });
    }
    qb.orderBy('entry.category', 'ASC').addOrderBy('entry.score', 'DESC');

    const entries = await qb.getMany();
    return entries.map((entry, index) => ({
      rank: index + 1,
      studentProfileId: entry.studentProfileId,
      userId: entry.userId,
      fullName: entry.studentProfile?.user?.fullName ?? 'Unknown',
      avatarUrl: entry.studentProfile?.user?.avatarUrl ?? null,
      category: entry.category,
      examTargets: entry.examTargets,
      xpEarned: entry.xpEarned,
      streak: entry.streak,
      performance: entry.performance,
      consistency: entry.consistency,
      score: entry.score,
      qualifiesForIncentive: entry.qualifiesForIncentive,
      isEligible: entry.isEligible,
    }));
  }
}
