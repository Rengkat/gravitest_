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
import { StreakStatus } from 'src/common/enums/enums';

@Entity('study_streaks')
@Index(['studentProfileId', 'lastStudyDate'])
export class StudyStreak {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'student_profile_id' })
  studentProfileId!: string;

  @ManyToOne(() => StudentProfile, (profile) => profile.streakHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_profile_id' })
  studentProfile!: StudentProfile;

  // ── Streak Tracking ────────────────────────────────────────────────────
  @Column({ type: 'int', default: 1 })
  currentStreak!: number;

  @Column({ type: 'int', default: 0 })
  longestStreak!: number;

  @Column({ type: 'enum', enum: StreakStatus, default: StreakStatus.ACTIVE })
  status!: StreakStatus;

  // ── Date Tracking ──────────────────────────────────────────────────────
  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  lastStudyDate!: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date | null;

  // ── Milestone Tracking ─────────────────────────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  milestones: {
    day3?: Date;
    day7?: Date;
    day14?: Date;
    day30?: Date;
    day100?: Date;
    [key: string]: Date | undefined;
  } | null;

  // ── Timestamps ─────────────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
