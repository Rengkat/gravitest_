import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AIFeature } from 'src/common/enums/enums';

// Which model handles which feature, with a fallback chain. This is what
// makes models swappable at runtime — change a row here, traffic moves,
// no deploy. AiRouterService reads this before every call.
@Entity('ai_feature_model_mappings')
export class AiFeatureModelMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AIFeature, unique: true })
  feature: AIFeature;

  // References AiModelConfig.modelId (not a hard FK — keeps this table
  // simple to seed/edit without join complexity, and a bad modelId here
  // just fails loudly at call time rather than corrupting anything).
  @Column()
  primaryModelId: string;

  @Column({ type: 'varchar', nullable: true })
  fallbackModelId: string | null;

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  maxTokens: number | null;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  temperature: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
