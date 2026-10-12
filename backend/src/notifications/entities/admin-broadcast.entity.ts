import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  NotificationChannel,
  NotificationType,
  BroadcastAudienceType,
  BroadcastStatus,
} from 'src/common/enums/enums';

// One row per "compose and send" action from the admin dashboard. This is
// what backs the sent-history list — separate from `Notification`, which
// stores one row per (user, message) for the actual inbox/delivery record.
@Entity('admin_broadcasts')
@Index(['status'])
@Index(['createdAt'])
export class AdminBroadcast {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  // Only used when channels includes EMAIL. Falls back to `title` at send
  // time if left blank.
  @Column({ type: 'varchar', length: 255, nullable: true })
  emailSubject: string | null;

  // The underlying delivery model is per-channel (see Notification.channel),
  // so a "both" broadcast just means we fan out once per channel here.
  @Column({ type: 'jsonb' })
  channels: NotificationChannel[];

  // Reuses your existing NotificationType enum so this slots into the same
  // per-user preference checks (systemAlerts, newContentAlerts, etc.) that
  // NotificationsService.shouldSkip() already runs. Pick whichever type in
  // that enum best matches "admin broadcast" — SYSTEM is the safe default.
  @Column({ type: 'enum', enum: NotificationType })
  notificationType: NotificationType;

  @Column({ type: 'enum', enum: BroadcastAudienceType })
  audienceType: BroadcastAudienceType;

  // ── Audience filters (only the relevant ones are set, based on audienceType) ──
  @Column({ type: 'varchar', nullable: true })
  audienceTier: string | null; // e.g. 'free' | 'basic' | 'standard' | 'premium' — TODO: verify against your SubscriptionTier enum

  @Column({ type: 'varchar', nullable: true })
  audienceExamType: string | null; // e.g. 'WAEC' | 'JAMB' | 'NECO' — TODO: verify against student_profiles schema

  @Column({ type: 'jsonb', nullable: true })
  audienceUserIds: string[] | null; // only for audienceType = SPECIFIC

  // Snapshot taken at send time (or at scheduled execution time) — not a
  // live count, so it won't drift as users are added/removed later.
  @Column({ type: 'int', default: 0 })
  recipientCount: number;

  @Column({
    type: 'enum',
    enum: BroadcastStatus,
    default: BroadcastStatus.QUEUED,
  })
  status: BroadcastStatus;

  // null = sent immediately. Set = held until BroadcastSchedulerService's
  // cron picks it up.
  @Column({ type: 'timestamptz', nullable: true })
  scheduledFor: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'uuid' })
  createdBy: string; // admin User.id

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
