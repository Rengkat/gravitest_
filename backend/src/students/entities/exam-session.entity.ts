// ============================================================
// 14. EXAM SESSION  (exam_sessions table)
//    Records every CBT attempt by any user.
//    Links student, exam type, subjects, score, per-question answers.
// ============================================================
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { StudentProfile } from './student-profile.entity';
import {
  CandidateType,
  DifficultyLevel,
  ExamMode,
  ExamType,
  QuestionType,
  SessionStatus,
  Subject,
} from 'src/common/enums/enums';
import { SessionQuestion } from './session-questions.entity';

@Entity('exam_sessions')
@Index(['studentProfileId', 'createdAt'])
@Index(['studentProfileId', 'examType'])
export class ExamSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'student_profile_id' })
  studentProfileId!: string;

  // ── Exam Identity ──────────────────────────────────────────
  @Column({ type: 'enum', enum: ExamType, nullable: true })
  examType: ExamType | null; // WAEC, JAMB, etc. Null = custom practice exam

  // School (internal) vs private (external) candidate this session was
  // built for — only ever set for WAEC/NECO/NABTEB/BECE/Junior NECO
  // sessions; null for everything else (including "both" selections).
  @Column({ type: 'enum', enum: CandidateType, nullable: true })
  candidateType: CandidateType | null;

  @Column({ type: 'jsonb' })
  subjects!: Subject[]; // JAMB = 4 subjects

  @Column({ type: 'varchar', length: 200, nullable: true })
  topic: string | null; // For topic-specific practice

  @Column({ type: 'enum', enum: QuestionType, default: QuestionType.MCQ })
  questionType!: QuestionType;

  @Column({ type: 'enum', enum: ExamMode })
  mode!: ExamMode; // PRACTICE, MOCK

  @Column({ type: 'enum', enum: DifficultyLevel, nullable: true })
  difficulty: DifficultyLevel | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  sessionTitle: string | null; // e.g. 'WAEC 2019 Mathematics'

  // ── Timing ────────────────────────────────────────────────
  @Column({ type: 'timestamptz' })
  startedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'int', default: 0 })
  timeSpentSeconds!: number; // how long they actually took

  @Column({ type: 'int', nullable: true })
  allowedDurationSeconds: number | null; // Time limit set

  @Column({ type: 'enum', enum: SessionStatus })
  status!: SessionStatus;

  get isTimedOut(): boolean {
    return this.status === SessionStatus.TIMED_OUT;
  }

  // ── Scoring ────────────────────────────────────────────────
  @Column({ type: 'int', default: 0 })
  totalQuestions!: number;

  @Column({ type: 'int', default: 0 })
  questionsAttempted!: number;

  @Column({ type: 'int', default: 0 })
  questionsCorrect!: number;

  @Column({ type: 'int', default: 0 })
  questionsSkipped!: number;

  @Column({ type: 'float', default: 0 })
  percentage!: number;

  @Column({ type: 'float', nullable: true })
  scaledScore: number | null; // JAMB: out of 400, WAEC: out of 100

  @Column({ type: 'int', default: 0 })
  xpEarned!: number;

  // ── Per-Topic Breakdown ────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  topicBreakdown:
    | {
        topic: string;
        total: number;
        correct: number;
        score: number;
      }[]
    | null;

  @Column({ type: 'jsonb', nullable: true })
  subjectScores:
    | {
        subject: Subject;
        score: number;
        total: number;
        percentage: number;
      }[]
    | null;

  // ── Metadata ───────────────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    year?: number; // Past question year e.g. 2019
    examYear?: string;
    shuffled?: boolean;
    device?: string;
    ipAddress?: string;
  } | null;

  // ── Relations (same module) ────────────────
  @OneToMany(() => SessionQuestion, (sq) => sq.examSession, { cascade: true })
  sessionQuestions: SessionQuestion[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ── Relations ──────────────────────────────────────────────
  @ManyToOne(() => StudentProfile, (profile) => profile.examSessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_profile_id' })
  studentProfile!: StudentProfile;
  // ── Domain Methods ─────────────────────────────────────────
  get accuracyRate(): number {
    if (!this.questionsAttempted) return 0;
    return (this.questionsCorrect / this.questionsAttempted) * 100;
  }

  get isCompleted(): boolean {
    return (
      this.status === SessionStatus.SUBMITTED ||
      this.status === SessionStatus.TIMED_OUT
    );
  }

  private calculateScores(): void {
    this.percentage =
      this.totalQuestions > 0
        ? (this.questionsCorrect / this.totalQuestions) * 100
        : 0;

    this.scaledScore = this.examType
      ? this.getScaledScore(this.percentage)
      : null; // practice mode — no scaled score
  }

  private getScaledScore(percentage: number): number {
    switch (this.examType) {
      case ExamType.JAMB:
        return Math.round((percentage / 100) * 400);
      case ExamType.WAEC:
      case ExamType.NECO:
      case ExamType.NABTEB:
        return Math.round((percentage / 100) * 100);
      case ExamType.ICAN:
        return Math.round((percentage / 100) * 150);
      default:
        return Math.round(percentage);
    }
  }

  complete(): void {
    this.status = SessionStatus.SUBMITTED;
    this.completedAt = new Date();
    this.timeSpentSeconds = Math.floor(
      (this.completedAt.getTime() - this.startedAt.getTime()) / 1000,
    );
    this.calculateScores();
  }

  timeout(): void {
    this.status = SessionStatus.TIMED_OUT;
    this.completedAt = new Date();
    this.timeSpentSeconds = this.allowedDurationSeconds ?? 0;
    this.calculateScores();
  }
}
