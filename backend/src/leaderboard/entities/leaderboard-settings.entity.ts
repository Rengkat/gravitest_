import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Singleton settings row that drives the entire leaderboard/ranking
 * algorithm. There should only ever be one row in this table — the
 * service always reads/creates via LeaderboardService.getSettings(),
 * never by id, so the algorithm can be tuned from the Admin Dashboard
 * without touching application code (spec §1.3 / §1.7).
 */
@Entity('leaderboard_settings')
export class LeaderboardSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ── Score Formula Weights ───────────────────────────────────
  // score = (xpEarned * xpWeight) + (streak * streakWeight)
  //       + (performance * performanceWeight) + (consistency * consistencyWeight)
  // performance and consistency are already 0–100 scores; xpEarned and
  // streak are raw counts, which is why their weights are usually much
  // smaller. Tune from the admin settings screen — no deploy needed.
  @Column({ type: 'float', default: 1 })
  xpWeight!: number;

  @Column({ type: 'float', default: 50 })
  streakWeight!: number;

  @Column({ type: 'float', default: 15 })
  performanceWeight!: number;

  @Column({ type: 'float', default: 15 })
  consistencyWeight!: number;

  // ── Anti-Gaming / One-Session Exploitation Guardrails (§1.4) ──
  @Column({ type: 'int', default: 3 })
  minSessionsRequired!: number;

  @Column({ type: 'int', default: 20 })
  minQuestionsAttemptedRequired!: number;

  // ── Eligibility (§1.2) ──────────────────────────────────────
  @Column({ type: 'boolean', default: true })
  subscribersOnly!: boolean;

  // ── Monthly Incentives (§1.5) ───────────────────────────────
  // Top N *eligible* users per category qualify for the monthly
  // incentive once the month is finalized.
  @Column({ type: 'int', default: 10 })
  incentiveTopN!: number;

  // ── Notifications (§1.9 / §1.10) ────────────────────────────
  // Days-before-month-end on which a "closing soon" nudge is sent.
  // 0 = final day. Kept small/sane by default to avoid notification spam.
  @Column({ type: 'int', array: true, default: '{7,3,1,0}' })
  notifyDaysBeforeClose!: number[];

  @Column({ type: 'boolean', default: true })
  notifyOnResultsPublished!: boolean;

  // ── Audit ────────────────────────────────────────────────────
  @Column({ type: 'varchar', nullable: true })
  lastUpdatedBy: string | null; // admin userId

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
