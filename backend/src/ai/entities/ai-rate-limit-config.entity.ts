import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SubscriptionTier } from 'src/common/enums/enums';

// Keyed to your REAL SubscriptionTier enum (FREE/PRO) rather than the
// four-tier free/basic/pro/enterprise scheme in RateLimitControls.tsx —
// that mockup's tier system doesn't match your actual Subscriptions
// module. Seed one row per SubscriptionTier value (see
// AiRateLimitService.onModuleInit) and admins edit the numbers from there.
@Entity('ai_rate_limit_configs')
export class AiRateLimitConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SubscriptionTier, unique: true })
  tier: SubscriptionTier;

  @Column({ default: 20 })
  requestsPerDay: number;

  @Column({ default: 5 })
  requestsPerHour: number;

  @Column({ default: 20000 })
  tokensPerDay: number;

  @Column({ default: 1 })
  concurrentSessions: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
