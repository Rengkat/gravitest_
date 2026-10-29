import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SessionQuestion } from './session-questions.entity';

export enum EssayScoringStatus {
  NOT_APPLICABLE = 'not_applicable', // MCQ answers
  PENDING = 'pending', // essay submitted, AI scoring not yet run
  SCORED = 'scored',
  NEEDS_REVIEW = 'needs_review', // low AI confidence — see AiScoringService.NEEDS_REVIEW_THRESHOLD
}

@Entity('student_answers')
export class StudentAnswer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ── MCQ ─────────────────────────────────────────────────────
  @Column({ type: 'char', length: 1, nullable: true })
  selectedLabel: string | null; // 'A', 'B', 'C', 'D' or null if skipped

  @Column({ type: 'uuid', nullable: true })
  selectedOptionId: string | null;

  // ── Essay / theory ──────────────────────────────────────────
  @Column({ type: 'text', nullable: true })
  essayText: string | null;

  // R2 URLs of diagrams/images the student attached to an essay answer
  // (e.g. a labeled biology diagram, a circuit sketch). Passed through
  // to AiScoringService.scoreEssay as `diagramImageUrls`, which forces
  // vision-model routing so they're actually evaluated, not ignored.
  @Column({ type: 'jsonb', default: [] })
  essayImageUrls: string[];

  // ── Structured (nested) theory/practical answers ────────────
  // One entry per answerable leaf of Question.structure, keyed by its
  // dot-path (see flattenEssayParts). null for MCQ and for plain
  // single-part essays. essayText above still holds a flattened,
  // labelled copy so anything reading essayText keeps working.
  @Column({ type: 'jsonb', nullable: true })
  partAnswers: { path: string; essayText: string; essayImageUrls: string[] }[] | null;

  // Per-leaf AI results. awardedScore/maxScore above are the SUM of these,
  // so grading, analytics and leaderboards need no changes.
  @Column({ type: 'jsonb', nullable: true })
  partScores:
    | {
        path: string;
        awardedScore: number;
        maxScore: number;
        confidence: number;
        aiEssayScoreId: string | null;
        feedback: string;
        strengths: string[];
        improvements: string[];
        // 'failed' = the AI call for this part errored; it carries no grade and
        // can be retried. Absent on older rows (= scored).
        status?: 'scored' | 'failed';
      }[]
    | null;

  @Column({ type: 'enum', enum: EssayScoringStatus, default: EssayScoringStatus.NOT_APPLICABLE })
  scoringStatus: EssayScoringStatus;

  // FK to AiEssayScore.id (kept loose, no hard FK — ai module and
  // students module don't otherwise depend on each other)
  @Column({ type: 'uuid', nullable: true })
  aiEssayScoreId: string | null;

  @Column({ type: 'int', nullable: true })
  awardedScore: number | null; // MCQ: 1 or 0 (via isCorrect). Essay: AI score, or teacher override if reviewed.

  @Column({ type: 'int', nullable: true })
  maxScore: number | null; // essay questions only — MCQ is always worth 1

  // ── Shared ───────────────────────────────────────────────────
  @Column({ type: 'boolean', default: false })
  isCorrect!: boolean; // MCQ only — essays use awardedScore/maxScore instead

  @Column({ type: 'timestamptz' })
  answeredAt!: Date;

  @OneToOne(() => SessionQuestion, (sq) => sq.studentAnswer, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_question_id' })
  sessionQuestion!: SessionQuestion;
}
