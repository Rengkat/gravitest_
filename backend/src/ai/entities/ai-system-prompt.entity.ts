import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AIFeature } from 'src/common/enums/enums';

// Matches your SystemPromptConfig type. One feature can have multiple
// prompt rows over time (version history) but only one isActive=true at
// once — AiPromptService resolves the active one per feature at call time.
@Entity('ai_system_prompts')
@Index(['feature', 'isActive'])
export class AiSystemPrompt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: AIFeature })
  feature: AIFeature;

  @Column('text')
  prompt: string;

  @Column({ default: 1 })
  version: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  createdBy: string | null; // User.id of the admin who wrote it

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
