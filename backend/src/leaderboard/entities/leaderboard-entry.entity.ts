import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ExamType, UserRole } from 'src/common/enums/enums';
import { StudentProfile } from 'src/students/entities/student-profile.entity';

/**
 * One row per (studentProfile, period). `period` is the current
 * calendar month while `isFinalized` is false — recalculated on every
 * cron tick (see LeaderboardService.recalculateCurrentPeriod). Once the
 * month closes, LeaderboardService.finalizeMonth freezes the row
 * (isFinalized = true) and it becomes permanent history (spec §1.5 / §1.11).
 *
 * Ranks are intentionally NOT stored here — they depend on which scope
 * (general / category / exam type) is being viewed, so they're computed
 * at query time from `score` + the eligibility/scope filters. This keeps
 * a single row per user per period correct for every leaderboard view.
 */
@Entity('leaderboard_entries')
@Unique(['studentProfileId', 'period'])
@Index(['period', 'category', 'isEligible', 'score'])
@Index(['period', 'isFinalized'])
export class LeaderboardEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'student_profile_id' })
  studentProfileId!: string;

  @ManyToOne(() => StudentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_profile_id' })
  studentProfile!: StudentProfile;

  // Denormalized for fast joins/notifications without loading the
  // full StudentProfile -> User chain on every leaderboard read.
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  // 'YYYY-MM', e.g. '2026-09'. See LeaderboardService.periodKey().
  @Column({ type: 'varchar', length: 7 })
  period!: string;

  // Snapshot of the user's category at computation time (spec §1.1 /
  // §1.6 — Secondary School vs Professional).
  @Column({ type: 'enum', enum: UserRole })
  category!: UserRole;

  // Snapshot of the user's exam targets at computation time, so the
  // exam-type leaderboard can filter without joining StudentProfile.
  @Column({ type: 'enum', enum: ExamType, array: true, default: '{}' })
  examTargets!: ExamType[];

  // ── Raw metrics for this period (§1.3 / §1.4) ─────────────────
  @Column({ type: 'int', default: 0 })
  xpEarned!: number; // XP earned DURING this period, not lifetime totalXp

  @Column({ type: 'int', default: 0 })
  streak!: number; // currentStreak snapshot at computation time

  @Column({ type: 'float', default: 0 })
  performance!: number; // 0–100 accuracy rate over the period

  @Column({ type: 'float', default: 0 })
  consistency!: number; // 0–100 = activeDaysInPeriod / daysElapsedInPeriod

  @Column({ type: 'int', default: 0 })
  sessionsCompleted!: number;

  @Column({ type: 'int', default: 0 })
  questionsAttempted!: number;

  @Column({ type: 'int', default: 0 })
  activeDays!: number;

  // ── Computed ranking score ─────────────────────────────────────
  @Column({ type: 'float', default: 0 })
  score!: number;

  // ── Eligibility (§1.2 / §1.4) ───────────────────────────────────
  @Column({ type: 'boolean', default: false })
  isSubscriber!: boolean;

  @Column({ type: 'boolean', default: false })
  isEligible!: boolean; // subscriber (if required) + meets min session/question thresholds

  // ── Monthly lifecycle (§1.5) ────────────────────────────────────
  @Column({ type: 'boolean', default: false })
  isFinalized!: boolean;

  @Column({ type: 'boolean', default: false })
  qualifiesForIncentive!: boolean;

  // ── Notification bookkeeping (§1.9 / §1.10) ─────────────────────
  // Which "days before close" offsets we've already notified this user
  // for, so the notifier cron never double-sends for the same offset.
  @Column({ type: 'int', array: true, default: '{}' })
  notifiedCloseOffsets!: number[];

  @Column({ type: 'timestamptz', nullable: true })
  resultsNotifiedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  finalizedAt: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
