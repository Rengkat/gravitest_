import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from '../../common/enums/enums';
import { User } from '../../user/entities/user.entity';

@Entity('notifications')
@Index(['userId', 'status'])
@Index(['userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP,
  })
  channel!: NotificationChannel;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status!: NotificationStatus;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  /** Deep-link or action URL */
  @Column({ type: 'varchar', length: 255, nullable: true })
  actionUrl: string | null;

  /** Extra context: e.g. examId, conversationId, paymentRef */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledFor: Date | null; // For deferred/scheduled notifications

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (u: User) => u.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  markRead(): void {
    this.status = NotificationStatus.READ;
    this.readAt = new Date();
  }
}
