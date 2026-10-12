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
import {
  BillingInterval,
  SubscriptionStatus,
  SubscriptionTier,
} from 'src/common/enums/enums';
import { User } from 'src/user/entities/user.entity';

@Entity('subscriptions')
@Index(['user', 'status'])
@Index(['expiresAt'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ── Plan Details ───────────────────────────────────────────
  @Column({ type: 'enum', enum: SubscriptionTier })
  tier!: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status!: SubscriptionStatus;

  @Column({ type: 'enum', enum: BillingInterval, nullable: true })
  billingInterval: BillingInterval | null;

  /** Price paid in kobo */
  @Column({ type: 'int', default: 0 })
  amountKobo!: number;

  // ── Dates ──────────────────────────────────────────────────
  @Column({ type: 'timestamptz' })
  startedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null; // Null = lifetime / free

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'boolean', default: false })
  autoRenew!: boolean;

  // ── Plan & managed billing (admin-configurable plans) ───────
  // Snapshot of the plan bought. Deliberately NOT a FK: plans can be retired
  // and re-priced, and this row must stay explainable after they change.
  @Column({ type: 'uuid', nullable: true })
  planId: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  planCode: string | null;

  /** PaymentGatewayCode that took the first payment. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  gateway: string | null;

  /**
   * What each RENEWAL costs, locked at signup (= the plan's list price then).
   * `amountKobo` above is what the first charge was — it can be a promo price.
   * Later admin price changes only affect new subscribers.
   */
  @Column({ type: 'int', nullable: true })
  renewalAmountKobo: number | null;

  /** Saved card charged by the renewal job. null = user must re-pay (e.g. OPay). */
  @Column({ type: 'uuid', nullable: true })
  paymentMethodId: string | null;

  @Column({ type: 'int', default: 0 })
  renewalAttempts!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastRenewalAttemptAt: Date | null;

  /** Last transaction applied to this row — makes activation/renewal idempotent. */
  @Column({ type: 'varchar', nullable: true })
  lastTransactionId: string | null;

  /** Smallest "days left" reminder already sent this period (7 → 3 → 1). */
  @Column({ type: 'int', nullable: true })
  lastReminderDays: number | null;

  // ── Paystack Integration (legacy native subscriptions) ─────
  @Column({ type: 'varchar', nullable: true, unique: true })
  paystackSubscriptionCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  paystackPlanCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  paystackCustomerCode: string | null;

  // Required to call Paystack's POST /subscription/disable (cancellation) —
  // Paystack issues this alongside subscription_code and it isn't derivable
  // later, so we have to store it when we first receive it.
  @Column({ type: 'varchar', nullable: true })
  paystackEmailToken: string | null;

  // ── Feature Limits for this Subscription ──────────────────
  @Column({ type: 'jsonb', nullable: true })
  featureLimits: {
    aiChatsPerDay?: number;
    cbtsPerDay?: number;
    libraryDownloads?: number;
    canAccessPremiumContent?: boolean;
  } | null;

  // ── Timestamps ─────────────────────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ── Relations ──────────────────────────────────────────────
  @ManyToOne(() => User, (u) => u.subscriptions, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // ── Domain Methods ─────────────────────────────────────────
  isActive(): boolean {
    if (this.status !== SubscriptionStatus.ACTIVE) return false;
    if (!this.expiresAt) return true; // lifetime
    return new Date() < this.expiresAt;
  }

  cancel(): void {
    this.status = SubscriptionStatus.CANCELLED;
    this.cancelledAt = new Date();
    this.autoRenew = false;
  }

  daysRemaining(): number | null {
    if (!this.expiresAt) return null;
    const ms = this.expiresAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }
}
