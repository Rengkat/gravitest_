import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuestionContribution } from './question-contribution.entity';

export enum ReportReason {
  SPAM = 'spam',
  ABUSIVE = 'abusive',
  INAPPROPRIATE = 'inappropriate',
  WRONG_INFO = 'wrong_info',
  OFF_TOPIC = 'off_topic',
  OTHER = 'other',
}

export enum ReportStatus {
  OPEN = 'open',
  ACTIONED = 'actioned',
  DISMISSED = 'dismissed',
}

@Entity('contribution_reports')
@Index('UQ_report_contribution_reporter', ['contributionId', 'reporterId'], { unique: true })
@Index('IDX_report_status', ['status', 'createdAt'])
export class ContributionReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  contributionId!: string;

  @ManyToOne(() => QuestionContribution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contributionId' })
  contribution?: QuestionContribution;

  @Column({ type: 'uuid' })
  reporterId!: string;

  @Column({ type: 'enum', enum: ReportReason })
  reason!: ReportReason;

  @Column({ type: 'varchar', length: 500, nullable: true })
  details!: string | null;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.OPEN })
  status!: ReportStatus;

  @Column({ type: 'uuid', nullable: true })
  resolvedById!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
