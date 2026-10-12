import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

// A correct MCQ explanation doesn't change once generated, so we cache it
// per (questionId, studentAnswerLabel, detailLevel) instead of re-calling
// the LLM every time a student asks. Meaningful cost saver once a question
// bank gets reused across thousands of students.
@Entity('ai_explanation_cache')
@Index(['questionId', 'studentAnswerLabel', 'detailLevel'], { unique: true })
export class AiExplanationCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  questionId: string;

  // Null = the generic "why is the correct answer right" explanation,
  // not tailored to a specific wrong answer.
  @Column({ type: 'varchar', nullable: true })
  studentAnswerLabel: string | null;

  // 'standard' = the default explanation shown automatically after
  // answering. 'detailed' = the deeper, on-demand "explain more" version —
  // a separate cache row since the two are genuinely different content,
  // not just a longer version of the same generation.
  @Column({ type: 'varchar', default: 'standard' })
  detailLevel: 'standard' | 'detailed';

  @Column('text')
  explanation: string;

  @Column({ type: 'varchar', nullable: true })
  modelId: string | null;

  @Column({ default: 0 })
  hitCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
