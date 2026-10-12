import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AIFeature } from 'src/common/enums/enums';

// Matches PracticeQuestionScore + ScoringCriteria from your ai-logs
// types.ts. One row per essay/theory answer graded.
@Entity('ai_essay_scores')
@Index(['userId'])
@Index(['questionId'])
export class AiEssayScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  questionId: string | null; // your Question.id, kept loose (no hard FK)

  @Column({ type: 'text', nullable: true })
  questionText: string | null;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: AIFeature })
  feature: AIFeature; // PRACTICE_SCORING or EXAM_GRADING

  @Column('text')
  studentAnswer: string;

  @Column({ type: 'text', nullable: true })
  modelAnswer: string | null;

  // R2 URLs of any diagrams the student included — persisted so the
  // score can be re-reviewed later with the same visual context an
  // admin/teacher would need to sanity-check the AI's grading.
  @Column({ type: 'jsonb', default: [] })
  diagramImageUrls: string[];

  @Column('int')
  aiScore: number;

  @Column('int')
  maxScore: number;

  @Column('text')
  aiFeedback: string;

  @Column({ type: 'jsonb', default: [] })
  strengths: string[];

  @Column({ type: 'jsonb', default: [] })
  improvements: string[];

  // 0-1. Below 0.65 is treated as "needs human review" — see
  // AiScoringService.NEEDS_REVIEW_THRESHOLD.
  @Column('decimal', { precision: 3, scale: 2, default: 1 })
  confidence: number;

  // Per-criterion breakdown when a rubric was supplied. Empty array when
  // scored freeform (no rubric).
  @Column({ type: 'jsonb', default: [] })
  scoringCriteria: {
    criterion: string;
    maxPoints: number;
    awardedPoints: number;
    feedback: string;
  }[];

  @Column({ type: 'varchar', nullable: true })
  modelId: string | null;

  // Deeper, on-demand elaboration of aiFeedback — quotes specific parts of
  // the student's answer, maps feedback to each scoring criterion, and
  // suggests a concrete rewrite of the weakest section. Generated lazily
  // (see AiScoringService.elaborate) so a student who never asks for more
  // detail never costs an extra AI call.
  @Column({ type: 'text', nullable: true })
  detailedFeedback: string | null;

  @Column({ type: 'varchar', nullable: true })
  reviewedBy: string | null; // User.id of the teacher/admin who reviewed

  @Column({ type: 'int', nullable: true })
  reviewedScore: number | null;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null;

  @CreateDateColumn()
  gradedAt: Date;
}
