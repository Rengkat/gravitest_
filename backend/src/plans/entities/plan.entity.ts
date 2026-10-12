import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BillingInterval, SubscriptionTier } from 'src/common/enums/enums';

/**
 * A purchasable subscription plan, editable by admins at runtime.
 *
 * Replaces the hardcoded SUBSCRIPTION_PLANS array. Design rules:
 *
 *  - `tier` is the *entitlement level* (what the user can do); the plan is the
 *    *commercial wrapper* (price, interval, marketing copy). Many plans can
 *    map to one tier (e.g. "Standard Monthly" and "Standard – Back-to-School").
 *  - Plans are never hard-deleted: subscriptions reference them, and billing
 *    history must stay explainable. Retire a plan with `isActive = false`.
 *  - Promo pricing is a scheduled override of the list price, not a mutation of
 *    it — so a promo expires on its own and the list price is never lost.
 *  - All money is integer kobo.
 */
@Entity('plans')
@Index(['isActive', 'isPublic', 'sortOrder'])
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Stable machine slug, e.g. "standard-monthly". Immutable after creation. */
  @Column({ type: 'varchar', length: 80, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: SubscriptionTier })
  tier!: SubscriptionTier;

  /** null only for the FREE plan (never billed). */
  @Column({ type: 'enum', enum: BillingInterval, nullable: true })
  interval!: BillingInterval | null;

  /** List (regular) price in kobo. */
  @Column({ type: 'int', default: 0 })
  amountKobo!: number;

  @Column({ type: 'varchar', length: 3, default: 'NGN' })
  currency!: string;

  /** Marketing bullets shown on the pricing page. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  features!: string[];

  @Column({ type: 'varchar', length: 40, nullable: true })
  badge!: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  /** Purchasable at all. false = retired (existing subscribers unaffected). */
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  /** Listed on the pricing page. false = purchasable only by direct planId. */
  @Column({ type: 'boolean', default: true })
  isPublic!: boolean;

  /** false = "contact sales" (e.g. ENTERPRISE) — checkout is refused. */
  @Column({ type: 'boolean', default: true })
  isSelfServe!: boolean;

  // ── Scheduled promotional price (first charge only — see SubscriptionsService) ──
  @Column({ type: 'int', nullable: true })
  promoAmountKobo!: number | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  promoLabel!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  promoStartsAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  promoEndsAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
