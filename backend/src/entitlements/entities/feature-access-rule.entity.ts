import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import {
  FeatureAccessMode,
  QuotaPeriod,
  SubscriptionTier,
} from 'src/common/enums/enums';

/**
 * One row per gate-able feature; edited by admins at runtime (no redeploy).
 * Rows are seeded from FEATURE_CATALOG on boot and never deleted.
 */
@Entity('feature_access_rules')
export class FeatureAccessRule {
  /** FeatureKey value. */
  @PrimaryColumn({ type: 'varchar', length: 60 })
  featureKey!: string;

  @Column({ type: 'enum', enum: FeatureAccessMode, default: FeatureAccessMode.FREE })
  mode!: FeatureAccessMode;

  /** Required when mode = PAID: lowest tier that gets the feature without limits. */
  @Column({ type: 'enum', enum: SubscriptionTier, nullable: true })
  minTier!: SubscriptionTier | null;

  /** PAID only: uses per period granted to users BELOW minTier ("free taste"). null/0 = none. */
  @Column({ type: 'int', nullable: true })
  freeQuota!: number | null;

  @Column({ type: 'enum', enum: QuotaPeriod, nullable: true })
  quotaPeriod!: QuotaPeriod | null;

  /**
   * PAID only: until this instant the feature is open to everyone (a timed
   * promo, e.g. "AI is free this weekend"). It reverts by itself — there is
   * no job to forget to run.
   */
  @Column({ type: 'timestamptz', nullable: true })
  freeUntil!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  updatedBy!: string | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
