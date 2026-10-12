import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// Singleton table — exactly one row, created lazily on first read (see
// AiSettingsService.get()). Deliberately does NOT duplicate settings that
// already have a real home elsewhere: default/fallback model and
// temperature are per-feature via AiFeatureModelMapping (see
// AIModelSelector.tsx / AIConfigPanel.tsx), not global values — adding a
// second "default model" knob here would just create two conflicting
// sources of truth.
@Entity('ai_settings')
export class AiSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Confidence threshold below which an AI-graded essay/theory answer is
  // flagged NEEDS_REVIEW instead of trusted outright. Replaces what used
  // to be a hardcoded 0.65 in three places — see
  // AiScoringService.NEEDS_REVIEW_THRESHOLD (now removed) and the two
  // essay-scoring blocks in ExamsService.
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.65 })
  autoFlagThreshold: number;

  // Whether a NEEDS_REVIEW essay triggers an admin alert at all (the
  // alert itself — AdminAlertType.SYSTEM — was previously unconditional).
  @Column({ type: 'boolean', default: true })
  notifyOnFlagged: boolean;

  // Null = no budget limit configured, no budget alerts fire regardless
  // of notifyOnBudgetAlert.
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthlyBudgetLimitUsd: number | null;

  @Column({ type: 'boolean', default: false })
  notifyOnBudgetAlert: boolean;

  // Where flagged/budget alerts get emailed, in addition to the in-app
  // AdminAlert every admin already sees. Null = in-app only.
  @Column({ type: 'varchar', nullable: true })
  notifyEmail: string | null;

  // How long to keep AI conversation transcripts (AiConversation +
  // AiMessage rows) before the retention cron prunes them. Null = keep
  // forever (retention cron no-ops).
  @Column({ type: 'int', nullable: true })
  retentionDays: number | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
