import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AIConversationStatus, AIFeature } from 'src/common/enums/enums';
import { AiMessage } from './ai-message.entity';

@Entity('ai_conversations')
@Index(['userId'])
@Index(['isFlagged'])
export class AiConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: AIFeature, default: AIFeature.SABI_TUTOR })
  feature: AIFeature;

  // Derived from the first user message, like ChatGPT conversation titles.
  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'varchar', nullable: true })
  subject: string | null; // your Subject enum, kept as string to avoid a hard import cycle

  @Column({ type: 'varchar', nullable: true })
  topic: string | null;

  @Column({ type: 'varchar', nullable: true })
  examType: string | null; // your ExamType enum, same reasoning as subject

  @Column({ type: 'varchar', nullable: true })
  lastModelId: string | null;

  @Column({
    type: 'enum',
    enum: AIConversationStatus,
    default: AIConversationStatus.ACTIVE,
  })
  status: AIConversationStatus;

  @Column({ default: 0 })
  messageCount: number;

  @Column({ default: 0 })
  totalTokens: number;

  @Column('decimal', { precision: 10, scale: 6, default: 0 })
  totalCostUsd: number;

  @Column({ default: false })
  isFlagged: boolean;

  @Column({ type: 'varchar', nullable: true })
  flagReason: string | null;

  @Column({ type: 'int', nullable: true })
  userRating: number | null; // 1-5

  @Column({ type: 'varchar', nullable: true })
  userFeedback: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastActivityAt: Date | null;

  @OneToMany(() => AiMessage, (m) => m.conversation)
  messages: AiMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
