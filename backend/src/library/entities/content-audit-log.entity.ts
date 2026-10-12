import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ContentAuditAction } from 'src/common/enums/enums';

@Entity('content_audit_logs')
@Index(['contentId'])
@Index(['createdAt'])
export class ContentAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  contentId: string;

  @Column({ type: 'enum', enum: ContentAuditAction })
  action: ContentAuditAction;

  @Column({ type: 'text' })
  description: string;

  // Admin User.id who performed the action — null for system-initiated
  // rows (there currently are none, but keeping this nullable avoids a
  // migration if a future cron ever needs to log here).
  @Column({ type: 'uuid', nullable: true })
  performedBy: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
