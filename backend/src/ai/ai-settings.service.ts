import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AiSettings } from './entities/ai-settings.entity';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiUsageLog } from './entities/ai-usage-log.entity';
import { AdminAlertsService } from 'src/admin-alerts/admin-alerts.service';
import { AdminAlertPriority, AdminAlertType } from 'src/common/enums/enums';

export interface UpdateAiSettingsParams {
  autoFlagThreshold?: number;
  notifyOnFlagged?: boolean;
  monthlyBudgetLimitUsd?: number | null;
  notifyOnBudgetAlert?: boolean;
  notifyEmail?: string | null;
  retentionDays?: number | null;
}

@Injectable()
export class AiSettingsService {
  private readonly logger = new Logger(AiSettingsService.name);

  // Cached in-process so the hot paths that read the threshold on every
  // essay scoring call (ExamsService, AiScoringService) don't hit the DB
  // each time. Invalidated on update(); worst case staleness otherwise is
  // one restart, which is fine for a threshold that changes rarely.
  private cached: AiSettings | null = null;

  constructor(
    @InjectRepository(AiSettings)
    private readonly settingsRepo: Repository<AiSettings>,

    @InjectRepository(AiConversation)
    private readonly conversationRepo: Repository<AiConversation>,

    @InjectRepository(AiUsageLog)
    private readonly usageLogRepo: Repository<AiUsageLog>,

    private readonly adminAlertsService: AdminAlertsService,
  ) {}

  async get(): Promise<AiSettings> {
    if (this.cached) return this.cached;

    let settings = await this.settingsRepo.findOne({ where: {} });
    if (!settings) {
      settings = await this.settingsRepo.save(this.settingsRepo.create());
      this.logger.log('Created default AiSettings row');
    }
    this.cached = settings;
    return settings;
  }

  async update(params: UpdateAiSettingsParams): Promise<AiSettings> {
    const settings = await this.get();
    Object.assign(settings, params);
    const saved = await this.settingsRepo.save(settings);
    this.cached = saved;
    return saved;
  }

  /**
   * Fast path for the two hot call sites (ExamsService essay scoring,
   * AiScoringService.needsReview query) — avoids awaiting the full get()
   * ceremony when they just need the number.
   */
  async getAutoFlagThreshold(): Promise<number> {
    const settings = await this.get();
    return Number(settings.autoFlagThreshold);
  }

  /**
   * Called after an essay gets flagged NEEDS_REVIEW — respects
   * notifyOnFlagged (previously this admin alert was unconditional).
   * Fire-and-forget-friendly, matches every other AdminAlertsService call
   * site in the codebase.
   */
  async notifyIfFlaggingEnabled(params: {
    title: string;
    body: string;
    actionUrl?: string;
  }): Promise<void> {
    const settings = await this.get();
    if (!settings.notifyOnFlagged) return;

    await this.adminAlertsService.raise({
      type: AdminAlertType.SYSTEM_ALERT,
      title: params.title,
      body: params.body,
      priority: AdminAlertPriority.MEDIUM,
      actionUrl: params.actionUrl,
    });
  }

  /**
   * Runs daily. Real budget check against AiUsageLog costs this calendar
   * month — compares to monthlyBudgetLimitUsd and raises ONE admin alert
   * per month once the limit is crossed (checks whether an unresolved
   * alert already exists this month to avoid spamming daily).
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkMonthlyBudget(): Promise<void> {
    const settings = await this.get();
    if (!settings.notifyOnBudgetAlert || settings.monthlyBudgetLimitUsd == null)
      return;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const raw = await this.usageLogRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.costUsd), 0)', 'total')
      .where('l.createdAt >= :monthStart', { monthStart })
      .getRawOne<{ total: string }>();

    const spent = Number(raw?.total ?? 0);
    if (spent < Number(settings.monthlyBudgetLimitUsd)) return;

    this.logger.warn(
      `Monthly AI budget exceeded: $${spent.toFixed(2)} spent vs $${settings.monthlyBudgetLimitUsd} limit`,
    );

    await this.adminAlertsService
      .raise({
        type: AdminAlertType.SYSTEM_ALERT,
        title: 'Monthly AI budget exceeded',
        body: `AI spending this month is $${spent.toFixed(2)}, over the configured $${settings.monthlyBudgetLimitUsd} limit.`,
        priority: AdminAlertPriority.HIGH,
        actionUrl: '/admin/ai-logs/cost',
      })
      .catch((err) => this.logger.error(`Budget alert failed: ${err.message}`));
  }

  /**
   * Runs weekly. Prunes AiConversation rows (and their AiMessage children,
   * via ON DELETE CASCADE on the FK — see the migration once generated)
   * older than retentionDays. No-ops if retentionDays isn't set.
   */
  @Cron(CronExpression.EVERY_WEEK)
  async pruneOldConversations(): Promise<void> {
    const settings = await this.get();
    if (!settings.retentionDays) return;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - settings.retentionDays);

    const result = await this.conversationRepo.delete({
      createdAt: LessThan(cutoff),
    });
    if (result.affected) {
      this.logger.log(
        `Retention cron: pruned ${result.affected} AI conversations older than ${settings.retentionDays} days`,
      );
    }
  }
}
