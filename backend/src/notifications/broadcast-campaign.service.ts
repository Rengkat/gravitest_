import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { NotificationsService } from './notifications.service';
import { AdminBroadcast } from './entities/admin-broadcast.entity';
import {
  CreateAdminBroadcastDto,
  AdminBroadcastFiltersDto,
} from './dto/admin-broadcast.dto';
import { BroadcastNotificationDto } from './dto/notification.dto';
import {
  NotificationChannel,
  BroadcastAudienceType,
  BroadcastStatus,
} from 'src/common/enums/enums';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginatedResult } from 'src/common/pagination/pagination.interface';

@Injectable()
export class BroadcastCampaignService {
  private readonly logger = new Logger(BroadcastCampaignService.name);

  constructor(
    @InjectRepository(AdminBroadcast)
    private readonly broadcastRepo: Repository<AdminBroadcast>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════

  async create(
    adminUserId: string,
    dto: CreateAdminBroadcastDto,
  ): Promise<AdminBroadcast> {
    const scheduledFor = dto.scheduledFor ? new Date(dto.scheduledFor) : null;
    const isFuture =
      scheduledFor !== null && scheduledFor.getTime() > Date.now();

    const campaign = this.broadcastRepo.create({
      title: dto.title,
      body: dto.body,
      emailSubject: dto.emailSubject ?? null,
      channels: dto.channels,
      notificationType: dto.notificationType,
      audienceType: dto.audienceType,
      audienceTier:
        dto.audienceType === BroadcastAudienceType.SEGMENT
          ? (dto.tier ?? null)
          : null,
      audienceExamType:
        dto.audienceType === BroadcastAudienceType.SEGMENT
          ? (dto.examType ?? null)
          : null,
      audienceUserIds:
        dto.audienceType === BroadcastAudienceType.SPECIFIC
          ? (dto.userIds ?? null)
          : null,
      recipientCount: 0,
      status: BroadcastStatus.QUEUED,
      scheduledFor: isFuture ? scheduledFor : null,
      sentAt: null,
      createdBy: adminUserId,
      errorMessage: null,
    });

    const saved = await this.broadcastRepo.save(campaign);

    if (!isFuture) {
      // Send now — execute inline so the admin gets an immediate result
      // back in the response (matches your existing adminSend/adminBroadcast
      // pattern, which also awaits synchronously).
      return this.execute(saved.id);
    }

    return saved;
  }

  // ═══════════════════════════════════════════════════════════════
  // EXECUTE — called immediately for "send now", or by the cron
  // scheduler (see BroadcastSchedulerService) for scheduled campaigns
  // ═══════════════════════════════════════════════════════════════

  async execute(campaignId: string): Promise<AdminBroadcast> {
    const campaign = await this.broadcastRepo.findOne({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundException('Broadcast campaign not found.');

    campaign.status = BroadcastStatus.SENDING;
    await this.broadcastRepo.save(campaign);

    try {
      const userIds = await this.resolveAudience(campaign);

      if (!userIds.length) {
        campaign.status = BroadcastStatus.FAILED;
        campaign.errorMessage = 'No recipients matched this audience.';
        campaign.sentAt = new Date();
        return this.broadcastRepo.save(campaign);
      }

      let totalSent = 0;
      const errors: string[] = [];

      // Fan out once per channel — the underlying Notification row is
      // always single-channel, so "in-app + email" just means two passes.
      for (const channel of campaign.channels) {
        const isEmailChannel = channel === NotificationChannel.EMAIL;
        const sendDto: BroadcastNotificationDto = {
          userIds,
          type: campaign.notificationType,
          channel,
          title: isEmailChannel
            ? (campaign.emailSubject ?? campaign.title)
            : campaign.title,
          body: campaign.body,
        };

        const result = await this.notificationsService.broadcast(sendDto);

        totalSent += result.sent;
        if (result.errors.length) {
          errors.push(...result.errors.map((e) => `${e.userId}: ${e.reason}`));
        }
      }

      campaign.recipientCount = userIds.length;
      campaign.status = BroadcastStatus.SENT;
      campaign.sentAt = new Date();
      campaign.errorMessage = errors.length
        ? errors.slice(0, 20).join('; ')
        : null;

      this.logger.log(
        `Broadcast campaign ${campaignId} sent: ${totalSent} deliveries across ${campaign.channels.length} channel(s), ${errors.length} errors.`,
      );

      return this.broadcastRepo.save(campaign);
    } catch (err: any) {
      this.logger.error(
        `Broadcast campaign ${campaignId} failed: ${err.message}`,
        err.stack,
      );
      campaign.status = BroadcastStatus.FAILED;
      campaign.errorMessage = err.message;
      campaign.sentAt = new Date();
      return this.broadcastRepo.save(campaign);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LIST / GET — backs the admin "sent history" panel
  // ═══════════════════════════════════════════════════════════════

  async findAll(
    filters: AdminBroadcastFiltersDto,
  ): Promise<PaginatedResult<AdminBroadcast>> {
    const {
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status,
    } = filters;

    const qb = this.broadcastRepo.createQueryBuilder('b');
    if (status) qb.andWhere('b.status = :status', { status });

    const sortMap: Record<string, string> = {
      createdAt: 'b.createdAt',
      scheduledFor: 'b.scheduledFor',
      sentAt: 'b.sentAt',
    };
    qb.orderBy(sortMap[sortBy] ?? 'b.createdAt', sortOrder);

    return this.paginationProvider.paginateQueryBuilder(qb, { page, limit });
  }

  async findOne(id: string): Promise<AdminBroadcast> {
    const campaign = await this.broadcastRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Broadcast campaign not found.');
    return campaign;
  }

  // ═══════════════════════════════════════════════════════════════
  // AUDIENCE RESOLUTION
  //
  // Verified against the real Subscription/StudentProfile entities:
  // both FK columns are user_id (deliberately snake_case per an
  // explicit @JoinColumn override); tier/status/expiresAt are plain
  // property-name columns (no naming-strategy conversion anywhere in
  // this codebase); examTargets is a Postgres array column, not a
  // scalar, so it needs an array-contains check rather than equality.
  // ═══════════════════════════════════════════════════════════════

  private async resolveAudience(campaign: AdminBroadcast): Promise<string[]> {
    if (campaign.audienceType === BroadcastAudienceType.SPECIFIC) {
      return campaign.audienceUserIds ?? [];
    }

    if (campaign.audienceType === BroadcastAudienceType.ALL) {
      const rows = await this.dataSource.query(
        `SELECT id FROM users WHERE "isActive" = true`,
      );
      return rows.map((r: any) => r.id);
    }

    // SEGMENT — combine whichever filters were set
    if (campaign.audienceType === BroadcastAudienceType.SEGMENT) {
      const conditions: string[] = ['u."isActive" = true'];
      const joins: string[] = [];
      const params: any[] = [];

      if (campaign.audienceTier) {
        joins.push(
          `INNER JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active' ` +
            `AND (s."expiresAt" IS NULL OR s."expiresAt" > NOW())`,
        );
        params.push(campaign.audienceTier);
        conditions.push(`s.tier = $${params.length}`);
      }

      if (campaign.audienceExamType) {
        // examTargets is a Postgres array column (a student can be
        // preparing for more than one exam), so this needs an
        // array-contains check, not equality — and the column name is
        // camelCase (no naming-strategy override on this entity, unlike
        // the manually-named user_id FK), so it must stay quoted or
        // Postgres folds it to lowercase and the join silently returns
        // nothing.
        joins.push(`INNER JOIN student_profiles sp ON sp.user_id = u.id`);
        params.push(campaign.audienceExamType);
        conditions.push(`$${params.length} = ANY(sp."examTargets")`);
      }

      if (!joins.length) {
        throw new BadRequestException(
          'Segment audience requires at least one of: tier, examType.',
        );
      }

      const sql = `
        SELECT DISTINCT u.id FROM users u
        ${joins.join('\n        ')}
        WHERE ${conditions.join(' AND ')}
      `;
      const rows = await this.dataSource.query(sql, params);
      return rows.map((r: any) => r.id);
    }

    return [];
  }
}
