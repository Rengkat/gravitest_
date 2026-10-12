import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StudentProfile } from './student-profile.entity';

@Entity('study_activities')
@Index(['studentProfileId', 'date'], { unique: true })
@Index(['date'])
export class StudyActivity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  studentProfileId!: string;

  @Column({ type: 'date' })
  date!: Date; // The calendar date for this activity record

  // ── Daily Totals ───────────────────────────────────────────
  @Column({ type: 'int', default: 0 })
  minutesStudied!: number;

  @Column({ type: 'int', default: 0 })
  questionsAttempted!: number;

  @Column({ type: 'int', default: 0 })
  questionsCorrect!: number;

  @Column({ type: 'float', default: 0 })
  averageScore!: number;

  @Column({ type: 'int', default: 0 })
  xpEarned!: number;

  @Column({ type: 'int', default: 0 })
  examSessionsCompleted!: number;

  @Column({ type: 'int', default: 0 })
  aiChatsStarted!: number;

  @Column({ type: 'boolean', default: false })
  isStreakDay!: boolean; // Met the daily study goal?

  // ── Per-Subject Breakdown ──────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  subjects:
    | {
        subject: string;
        minutes: number;
        questionsAttempted: number;
        questionsCorrect: number;
        score: number;
      }[]
    | null;

  // ── Goals ──────────────────────────────────────────────────
  @Column({ type: 'int', default: 0 })
  dailyGoalMinutes!: number; // Copied from settings at time of study

  @Column({ type: 'boolean', default: false })
  goalMet!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => StudentProfile, (p) => p.studyActivities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_profile_id' })
  studentProfile!: StudentProfile;
}
