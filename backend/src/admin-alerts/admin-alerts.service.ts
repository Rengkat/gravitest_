import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';

import { AdminAlert } from './entities/admin-alert.entity';
import { AdminAlertFiltersDto } from './dto/admin-alert-filters.dto';
import { AdminAlertPriority, AdminAlertStatus, AdminAlertType } from 'src/common/enums/enums';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginatedResult } from 'src/common/pagination/pagination.interface';

export interface RaiseAlertParams {
  type: AdminAlertType;
  title: string;
  body: string;
  priority?: AdminAlertPriority;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AdminAlertsService {
  private readonly logger = new Logger(AdminAlertsService.name);

  constructor(
    @InjectRepository(AdminAlert)
    private readonly alertRepo: Repository<AdminAlert>,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  /**
   * Fire-and-forget-friendly by design: callers should generally do
   * `.catch(...)` on this rather than await+throw, so a failure to log an
   * alert never breaks the real event that triggered it (a signup, a
   * webhook, a rate-limit hit). See call sites in AuthService,
   * TransactionsService, SubscriptionsService, AiRateLimitService.
   */
  async raise(params: RaiseAlertParams): Promise<AdminAlert> {
    // Webhook retries and overlapping triggers can raise the identical alert
    // twice. If the same one was raised in the last 2 minutes, reuse it.
    const existing = await this.alertRepo.findOne({
      where: {
        type: params.type,
        title: params.title,
        body: params.body,
        actionUrl: params.actionUrl ?? undefined,
        createdAt: MoreThan(new Date(Date.now() - 120_000)),
      },
    });
    if (existing) return existing;

    const alert = this.alertRepo.create({
      type: params.type,
      title: params.title,
      body: params.body,
      priority: params.priority ?? AdminAlertPriority.MEDIUM,
      actionUrl: params.actionUrl ?? null,
      metadata: params.metadata ?? null,
      status: AdminAlertStatus.UNREAD,
    });
    const saved = await this.alertRepo.save(alert);
    this.logger.log(`Admin alert raised: [${saved.type}] ${saved.title}`);
    return saved;
  }

  async findAll(filters: AdminAlertFiltersDto): Promise<PaginatedResult<AdminAlert>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'DESC', status, type, priority } = filters;

    const qb = this.alertRepo.createQueryBuilder('a');
    if (status) qb.andWhere('a.status = :status', { status });
    if (type) qb.andWhere('a.type = :type', { type });
    if (priority) qb.andWhere('a.priority = :priority', { priority });

    const sortMap: Record<string, string> = {
      createdAt: 'a.createdAt',
      resolvedAt: 'a.resolvedAt',
      priority: 'a.priority',
    };
    qb.orderBy(sortMap[sortBy] ?? 'a.createdAt', sortOrder);

    return this.paginationProvider.paginateQueryBuilder(qb, { page, limit });
  }

  async getStats() {
    const [total, unread, high] = await Promise.all([
      this.alertRepo.count(),
      this.alertRepo.count({ where: { status: AdminAlertStatus.UNREAD } }),
      this.alertRepo.count({
        where: { status: AdminAlertStatus.UNREAD, priority: AdminAlertPriority.HIGH },
      }),
    ]);
    const resolved = await this.alertRepo
      .createQueryBuilder('a')
      .where('a.resolvedAt IS NOT NULL')
      .getCount();
    const archived = await this.alertRepo.count({ where: { status: AdminAlertStatus.ARCHIVED } });

    return { total, unread, highPriority: high, resolved, archived };
  }

  private async findOneOrThrow(id: string): Promise<AdminAlert> {
    const alert = await this.alertRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }

  async markRead(id: string): Promise<AdminAlert> {
    const alert = await this.findOneOrThrow(id);
    if (alert.status === AdminAlertStatus.UNREAD) {
      alert.status = AdminAlertStatus.READ;
      await this.alertRepo.save(alert);
    }
    return alert;
  }

  async markAllRead(): Promise<{ updated: number }> {
    const result = await this.alertRepo
      .createQueryBuilder()
      .update(AdminAlert)
      .set({ status: AdminAlertStatus.READ })
      .where('status = :status', { status: AdminAlertStatus.UNREAD })
      .execute();
    return { updated: result.affected ?? 0 };
  }

  async resolve(id: string, adminUserId: string): Promise<AdminAlert> {
    const alert = await this.findOneOrThrow(id);
    alert.status = AdminAlertStatus.READ;
    alert.resolvedAt = new Date();
    alert.resolvedBy = adminUserId;
    return this.alertRepo.save(alert);
  }

  async archive(id: string): Promise<AdminAlert> {
    const alert = await this.findOneOrThrow(id);
    alert.status = AdminAlertStatus.ARCHIVED;
    return this.alertRepo.save(alert);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    const result = await this.alertRepo.delete({ id });
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
