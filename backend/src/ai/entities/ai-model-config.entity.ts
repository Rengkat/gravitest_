import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AIProvider } from 'src/common/enums/enums';

// One row per model you can route traffic to. Admin toggles `isActive`/
// `isFallback` here — no redeploy needed to switch models. Matches your
// AIModelSelector.tsx AVAILABLE_MODELS shape.
@Entity('ai_model_configs')
export class AiModelConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The literal string sent to the provider's API, e.g. 'gpt-4o',
  // 'claude-3-5-sonnet-20241022', 'gemini-1.5-pro'.
  @Column({ unique: true })
  modelId: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: AIProvider })
  provider: AIProvider;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  // USD per 1M tokens — matches AIModelSelector.tsx costInput/costOutput.
  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  costInputPerMillion: number;

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  costOutputPerMillion: number;

  @Column({ default: 0 })
  avgLatencyMs: number;

  @Column({ default: true })
  isActive: boolean;

  // Tags like 'reasoning', 'math', 'cheap', 'long-context' — cosmetic,
  // shown in the admin UI, not used for routing logic.
  @Column({ type: 'jsonb', nullable: true })
  tags: string[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
