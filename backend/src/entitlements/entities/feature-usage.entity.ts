import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Counter of free-quota uses: one row per (user, feature, period). The period
 * key is the Lagos calendar day ("2026-09-29") or month ("2026-09"), so quotas
 * reset at local midnight. Increments are done in a single atomic SQL upsert
 * (see EntitlementsService.consumeQuota) — never read-then-write.
 */
@Entity('feature_usage')
@Index('UQ_feature_usage_user_feature_period', ['userId', 'featureKey', 'periodKey'], { unique: true })
export class FeatureUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId!: string;

  @Column({ name: 'feature_key', type: 'varchar', length: 60 })
  featureKey!: string;

  @Column({ name: 'period_key', type: 'varchar', length: 10 })
  periodKey!: string;

  @Column({ type: 'int', default: 0 })
  count!: number;
}
