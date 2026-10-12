import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AIMessageRole } from 'src/common/enums/enums';
import { AiConversation } from './ai-conversation.entity';

@Entity('ai_messages')
@Index(['conversation'])
export class AiMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AiConversation, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: AiConversation;

  @Column({ type: 'enum', enum: AIMessageRole })
  role: AIMessageRole;

  @Column('text')
  content: string;

  @Column({ default: 0 })
  tokensInput: number;

  @Column({ default: 0 })
  tokensOutput: number;

  @Column('decimal', { precision: 10, scale: 6, default: 0 })
  costUsd: number;

  @Column({ type: 'int', nullable: true })
  responseTimeMs?: number | null;

  @Column({ type: 'varchar', nullable: true })
  modelId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
