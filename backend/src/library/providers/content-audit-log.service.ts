import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentAuditAction } from 'src/common/enums/enums';
import { User } from 'src/user/entities/user.entity';
import { ContentAuditLog } from '../entities/content-audit-log.entity';

export interface LogContentActionParams {
  contentId: string;
  action: ContentAuditAction;
  description: string;
  performedBy?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class ContentAuditLogService {
  private readonly logger = new Logger(ContentAuditLogService.name);

  constructor(
    @InjectRepository(ContentAuditLog)
    private readonly auditLogRepo: Repository<ContentAuditLog>,
  ) {}

  /**
   * Fire-and-forget-friendly: callers should generally `.catch()` this
   * rather than await+throw, matching the pattern used for AdminAlerts —
   * a logging failure must never break the actual content mutation that
   * triggered it. See call sites in LibraryService.
   */
  async log(params: LogContentActionParams): Promise<ContentAuditLog> {
    const entry = this.auditLogRepo.create({
      contentId: params.contentId,
      action: params.action,
      description: params.description,
      performedBy: params.performedBy ?? null,
      metadata: params.metadata ?? null,
    });
    return this.auditLogRepo.save(entry);
  }

  async listForContent(contentId: string): Promise<
    {
      id: string;
      action: ContentAuditAction;
      description: string;
      performedBy: string | null;
      performedByName: string | null;
      metadata: Record<string, unknown> | null;
      createdAt: Date;
    }[]
  > {
    const rows = await this.auditLogRepo
      .createQueryBuilder('log')
      .leftJoin(User, 'u', 'u.id = log.performedBy')
      .where('log.contentId = :contentId', { contentId })
      .select([
        'log.id AS id',
        'log.action AS action',
        'log.description AS description',
        'log.performedBy AS "performedBy"',
        'u.firstName AS "firstName"',
        'u.lastName AS "lastName"',
        'log.metadata AS metadata',
        'log.createdAt AS "createdAt"',
      ])
      .orderBy('log.createdAt', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      description: r.description,
      performedBy: r.performedBy,
      performedByName: r.firstName
        ? `${r.firstName} ${r.lastName}`.trim()
        : null,
      metadata: r.metadata,
      createdAt: r.createdAt,
    }));
  }
}
