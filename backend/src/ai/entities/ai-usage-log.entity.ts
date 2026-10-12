import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AIFeature } from 'src/common/enums/enums';

// Every single AI provider call — chat, essay scoring, MCQ explanation,
// whatever comes next — writes exactly one row here via AiRouterService,
// regardless of feature. This is the single source for AICostStats/
// AIPerformanceStats admin analytics, same pattern as the Transactions
// ledger being the single source for Billing/Transactions analytics.
@Entity('ai_usage_logs')
@Index(['userId'])
@Index(['feature'])
@Index(['createdAt'])
export class AiUsageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: AIFeature })
  feature: AIFeature;

  @Column()
  modelId: string;

  @Column({ default: 0 })
  tokensInput: number;

  @Column({ default: 0 })
  tokensOutput: number;

  @Column('decimal', { precision: 10, scale: 6, default: 0 })
  costUsd: number;

  @Column({ type: 'int', nullable: true })
  responseTimeMs: number | null;

  @Column({ default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  // Whether this call landed on the primary model or had to fall back.
  @Column({ default: false })
  usedFallback: boolean;

  @Column({ type: 'varchar', nullable: true })
  relatedEntityType: string | null; // 'conversation' | 'essay_score' | 'explanation'

  @Column({ type: 'varchar', nullable: true })
  relatedEntityId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
