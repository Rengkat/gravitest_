import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StudentAnswer } from '../../students/entities/student-answers.entity';
import { ExamSession } from './exam-session.entity';

@Entity('session_questions')
export class SessionQuestion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  order!: number; // shuffled position for THIS student

  @Column({ type: 'boolean', default: false })
  isFlagged!: boolean;

  @Column({ type: 'boolean', default: false })
  isAnswered!: boolean;

  @Column({ type: 'int', default: 0 })
  timeSpentSeconds!: number; // time on THIS question

  @ManyToOne(() => ExamSession, (s) => s.sessionQuestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exam_session_id' })
  examSession!: ExamSession;

  @Column({ type: 'uuid' })
  questionId!: string; // raw FK to questions table

  // ── Relation to answer ─────────────────────
  @OneToOne(() => StudentAnswer, (a) => a.sessionQuestion, { nullable: true })
  studentAnswer: StudentAnswer | null;
}
