import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Matches RubricManager.tsx — its own code comment says "frontend-only
// until the rubric endpoints exist." This is those endpoints' backing
// table. Pass a rubric's `criteria` into AiScoringService.scoreEssay() to
// get a per-criterion breakdown back instead of a single freeform score.
@Entity('ai_rubrics')
export class AiRubric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  subject: string | null;

  @Column({ type: 'varchar', nullable: true })
  examType: string | null;

  @Column({ type: 'jsonb' })
  criteria: {
    criterion: string;
    maxPoints: number;
    description?: string;
  }[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
