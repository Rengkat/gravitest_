import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { StudentProfile } from './student-profile.entity';
import { DifficultyLevel, WeakTopicStatus } from 'src/common/enums/enums';

@Entity('weak_topics')
@Index(['studentProfileId', 'subject', 'topic'])
@Index(['studentProfileId', 'status'])
export class WeakTopic {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'student_profile_id' })
  studentProfileId!: string;

  @ManyToOne(() => StudentProfile, (profile) => profile.weakTopics, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_profile_id' })
  studentProfile!: StudentProfile;

  // ── Topic Identification ───────────────────────────────────────────────
  @Column({ type: 'varchar', length: 100 })
  subject!: string;

  @Column({ type: 'varchar', length: 200 })
  topic!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subTopic: string | null;

  // ── Performance Metrics ────────────────────────────────────────────────
  @Column({ type: 'float', default: 0 })
  averageScore!: number; // 0–100

  @Column({ type: 'float', default: 0 })
  lowestScore!: number;

  @Column({ type: 'float', default: 0 })
  highestScore!: number;

  @Column({ type: 'float', default: 0 })
  recentScore!: number; // Last 3 attempts average

  @Column({ type: 'int', default: 0 })
  timesPracticed!: number;

  @Column({ type: 'int', default: 0 })
  questionsAttempted!: number;

  @Column({ type: 'int', default: 0 })
  questionsCorrect!: number;

  // ── Difficulty Tracking ────────────────────────────────────────────────
  @Column({ type: 'enum', enum: DifficultyLevel, nullable: true })
  perceivedDifficulty: DifficultyLevel | null;

  @Column({ type: 'float', nullable: true })
  confidenceLevel: number | null; // 0–100 (self-assessed)

  // ── Time Tracking ──────────────────────────────────────────────────────
  @Column({ type: 'int', default: 0 })
  totalMinutesSpent!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastPracticedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  firstIdentifiedAt: Date | null;

  // ── Status & Progress ──────────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: WeakTopicStatus,
    default: WeakTopicStatus.ACTIVE,
  })
  status!: WeakTopicStatus;

  @Column({ type: 'float', default: 0 })
  improvementRate!: number; // Percentage improvement over time

  // ── Recommended Resources ──────────────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  recommendedResources: {
    videos?: string[];
    exercises?: string[];
    articles?: string[];
  } | null;

  // ── Metadata for Analytics ─────────────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    examTypes?: string[]; // JAMB, WAEC, etc.
    questionTypes?: string[]; // MCQ, Theory, etc.
    tags?: string[];
    notes?: string;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  recentScoresHistory: number[] | null;

  // ── Timestamps ─────────────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ── Domain Methods ─────────────────────────────────────────
  updateAfterAttempt(score: number, minutesSpent: number): void {
    this.questionsAttempted++;
    if (score >= 50) this.questionsCorrect++;

    this.lowestScore = Math.min(this.lowestScore || score, score);
    this.highestScore = Math.max(this.highestScore, score);

    this.averageScore =
      (this.averageScore * this.timesPracticed + score) /
      (this.timesPracticed + 1);

    this.recentScoresHistory = [
      ...(this.recentScoresHistory ?? []),
      score,
    ].slice(-3);

    this.recentScore =
      this.recentScoresHistory.reduce((a, b) => a + b, 0) /
      this.recentScoresHistory.length;

    this.totalMinutesSpent += minutesSpent;
    this.timesPracticed++;
    this.lastPracticedAt = new Date();

    if (this.averageScore >= 70) this.status = WeakTopicStatus.IMPROVING;
    if (this.averageScore >= 85) this.status = WeakTopicStatus.RESOLVED;
  }
}
