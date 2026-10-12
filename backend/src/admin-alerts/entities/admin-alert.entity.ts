import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminAlertPriority, AdminAlertStatus, AdminAlertType } from 'src/common/enums/enums';

// One row per operational event an admin might need to see/act on —
// fraud signals, new signups, payment disputes, infra health. Distinct
// from `Notification` (student-facing) — see the comment on AdminAlertType
// in src/common/enums/enums.ts for why these aren't merged.
@Entity('admin_alerts')
@Index(['status'])
@Index(['type'])
@Index(['createdAt'])
export class AdminAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AdminAlertType })
  type: AdminAlertType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'enum', enum: AdminAlertPriority, default: AdminAlertPriority.MEDIUM })
  priority: AdminAlertPriority;

  @Column({ type: 'enum', enum: AdminAlertStatus, default: AdminAlertStatus.UNREAD })
  status: AdminAlertStatus;

  @Column({ type: 'varchar', nullable: true })
  actionUrl: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  // Admin User.id who resolved/archived it, not a display name — resolve
  // to a name at the API layer if/when you need one, same pattern as
  // AdminBroadcast.createdBy.
  @Column({ type: 'uuid', nullable: true })
  resolvedBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
