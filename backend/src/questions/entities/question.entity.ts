import {
  CandidateType,
  DifficultyLevel,
  ExamType,
  QuestionType,
  Subject,
} from 'src/common/enums/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QuestionOption } from './question-option.entity';
import { QuestionAnswer } from './question-answer.entity';
import { QuestionExplanation } from './question-explanation.entity';
import { Passage } from './passage.entity';
import { EssayPart } from '../types/essay-part.interface';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', nullable: true })
  questionNumber: string | null; // for theory questions e.g Question 1a, 1b etc

  @Column({ type: 'enum', enum: ExamType })
  examType!: ExamType; // JAMB, WAEC, NECO etc

  // Only meaningful for exam types in CANDIDATE_TYPE_EXAM_TYPES (WAEC,
  // NECO, NABTEB, BECE, Junior NECO) — null means this question applies
  // to both school (internal) and private (external) candidates, which
  // is the common case. Set it only when a paper genuinely differs
  // between the two streams.
  @Column({ type: 'enum', enum: CandidateType, nullable: true })
  candidateType: CandidateType | null;

  @Column({ type: 'enum', enum: Subject })
  subject!: Subject;

  @Column({ type: 'int' })
  year!: number; // 2019, 2020 etc — past questions

  @Column({ type: 'text' })
  questionText!: string; // the actual question

  // ── Image support ──────────────────────────
  @Column({ type: 'varchar', nullable: true })
  questionImageUrl: string | null; // question has an image/diagram

  @Column({ type: 'enum', enum: DifficultyLevel })
  difficulty!: DifficultyLevel;

  @Column({ type: 'enum', enum: QuestionType })
  type!: QuestionType; // MCQ, THEORY etc

  // Marks/points this question is worth — used for essay/theory scoring
  // (MCQ questions are always worth 1 point, this is ignored for those).
  @Column({ type: 'int', nullable: true, default: 10 })
  maxScore: number | null;

  // Optional model/mark-scheme answer for theory questions — passed to
  // AiScoringService as context so the AI grades against what the exam
  // board actually expects, not just its own judgment.
  @Column({ type: 'text', nullable: true })
  modelAnswer: string | null;

  // Essay/theory questions with real exam structure — custom numbering
  // (1 → (a) → (i) → (ii)), sub-questions, per-part marks, tables and
  // images. Null for a plain essay that's just questionText + maxScore +
  // modelAnswer, and always null/ignored for MCQ-like types. See
  // EssayPart for the shape.
  @Column({ type: 'jsonb', nullable: true })
  structure: EssayPart[] | null;

  @Column({ type: 'varchar', nullable: true })
  topic: string | null; // e.g "Organic Chemistry", "Algebra"

  // Set when this question belongs to a comprehension/passage set (see
  // Passage entity) — a run of questions like "1–5" that all refer back
  // to the same shared text/diagram. Null for a normal standalone question.
  @Column({ type: 'uuid', nullable: true })
  passageId: string | null;

  @ManyToOne(() => Passage, (p) => p.questions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'passageId' })
  passage: Passage | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // ── Timestamps ─────────────────────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ── Relations ──────────────────────────────
  @OneToMany(() => QuestionOption, (o) => o.question, { cascade: true })
  options: QuestionOption[]; // A, B, C, D

  @OneToOne(() => QuestionAnswer, (a) => a.question, { cascade: true })
  answer: QuestionAnswer; // correct answer — separate table!

  @OneToMany(() => QuestionExplanation, (e) => e.question)
  explanations: QuestionExplanation[];
}
