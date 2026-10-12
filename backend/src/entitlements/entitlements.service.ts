import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  AdminAlertPriority,
  AdminAlertType,
  FeatureAccessMode,
  FeatureKey,
  QuotaPeriod,
  SubscriptionStatus,
  SubscriptionTier,
} from 'src/common/enums/enums';
import { tierAtLeast } from 'src/common/subscription-tier.util';
import { errorMessage } from 'src/common/error-message.util';
import { AdminAlertsService } from 'src/admin-alerts/admin-alerts.service';
import {
  RENEWAL_GRACE_MS,
  SubscriptionsService,
} from 'src/subscriptions/subscriptions.service';
import { FeatureAccessRule } from './entities/feature-access-rule.entity';
import { FeatureUsage } from './entities/feature-usage.entity';
import { FEATURE_BY_KEY, FEATURE_CATALOG } from './feature-catalog';
import { UpdateFeatureRuleDto } from './dto/feature-rule.dto';

export type AccessReason =
  | 'free' // feature is free for everyone
  | 'promo' // paid feature, inside its timed free window
  | 'tier' // user's plan includes it
  | 'free_quota' // below the plan, but using a free-taste allowance
  | 'upgrade_required'
  | 'quota_exhausted'
  | 'disabled';

export interface AccessDecision {
  feature: FeatureKey;
  allowed: boolean;
  reason: AccessReason;
  /** Lowest plan that unlocks it (when a plan would help). */
  requiredTier: SubscriptionTier | null;
  quota: {
    limit: number;
    used: number;
    remaining: number;
    period: QuotaPeriod;
    resetsAt: Date;
  } | null;
  /** If a timed free window is open, when it closes. */
  freeUntil: Date | null;
}

const RULE_CACHE_TTL_MS = 15_000;
// Nigeria is UTC+1 all year (no DST): quotas reset at Lagos midnight.
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

@Injectable()
export class EntitlementsService implements OnModuleInit {
  private readonly logger = new Logger(EntitlementsService.name);
  // Small TTL cache: rules are read on hot paths (every AI message). An admin
  // edit clears this instance's cache immediately; other instances converge
  // within RULE_CACHE_TTL_MS.
  private cache = new Map<string, { rule: FeatureAccessRule; at: number }>();

  constructor(
    @InjectRepository(FeatureAccessRule)
    private readonly ruleRepo: Repository<FeatureAccessRule>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly subscriptions: SubscriptionsService,
    private readonly adminAlerts: AdminAlertsService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      for (const def of FEATURE_CATALOG) {
        if (await this.ruleRepo.exist({ where: { featureKey: def.key } })) continue;
        await this.ruleRepo.save(
          this.ruleRepo.create({
            featureKey: def.key,
            mode: def.default.mode,
            minTier: def.default.minTier,
            freeQuota: def.default.freeQuota,
            quotaPeriod: def.default.quotaPeriod,
            freeUntil: null,
          }),
        );
        this.logger.log(`Seeded access rule for "${def.key}" (${def.default.mode}).`);
      }
    } catch (err) {
      this.logger.error(`Feature rule seeding skipped: ${errorMessage(err)}`);
    }
  }

  // ─── TIER ─────────────────────────────────────────────────────────────────

  /**
   * The ONE definition of "what plan is this user effectively on right now".
   *
   * A subscription counts while it is ACTIVE/PAST_DUE and either unexpired,
   * or — only for auto-renewing plans whose card is being retried — inside the
   * dunning grace window. Anything else falls back to FREE. (Previously each
   * caller trusted getCurrentSubscription() differently, and a lapsed row
   * kept its tier until the nightly job ran.)
   */
  async resolveTier(userId: string): Promise<SubscriptionTier> {
    const sub = await this.subscriptions.getCurrentSubscription(userId);
    if (!sub) return SubscriptionTier.FREE;
    if (sub.status !== SubscriptionStatus.ACTIVE && sub.status !== SubscriptionStatus.PAST_DUE) {
      return SubscriptionTier.FREE;
    }
    if (!sub.expiresAt) return sub.tier; // FREE / lifetime
    const now = Date.now();
    const end = sub.expiresAt.getTime();
    if (end > now) return sub.tier;
    if (sub.autoRenew && end + RENEWAL_GRACE_MS > now) return sub.tier;
    return SubscriptionTier.FREE;
  }

  // ─── RULES ────────────────────────────────────────────────────────────────

  async getRule(key: FeatureKey): Promise<FeatureAccessRule> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < RULE_CACHE_TTL_MS) return hit.rule;

    let rule = await this.ruleRepo.findOne({ where: { featureKey: key } });
    if (!rule) {
      // Seeding failed or a feature was added without a boot yet: fall back to
      // the code default rather than blocking (or opening) a feature blindly.
      const def = FEATURE_BY_KEY.get(key);
      if (!def) throw new NotFoundException(`Unknown feature "${key}".`);
      rule = this.ruleRepo.create({
        featureKey: key,
        mode: def.default.mode,
        minTier: def.default.minTier,
        freeQuota: def.default.freeQuota,
        quotaPeriod: def.default.quotaPeriod,
        freeUntil: null,
      });
    }
    this.cache.set(key, { rule, at: Date.now() });
    return rule;
  }

  /** True when a feature is open to literally everyone right now (free / promo). */
  async isOpenToEveryone(key: FeatureKey): Promise<boolean> {
    const rule = await this.getRule(key);
    return (
      rule.mode === FeatureAccessMode.FREE ||
      (rule.mode === FeatureAccessMode.PAID && !!rule.freeUntil && rule.freeUntil > new Date())
    );
  }

  // ─── DECISIONS ────────────────────────────────────────────────────────────

  /** Read-only: what would happen if this user tried the feature now. */
  async evaluate(userId: string, key: FeatureKey, knownTier?: SubscriptionTier): Promise<AccessDecision> {
    const rule = await this.getRule(key);
    const base = { feature: key, requiredTier: null, quota: null, freeUntil: null } as const;

    if (rule.mode === FeatureAccessMode.DISABLED) {
      return { ...base, allowed: false, reason: 'disabled' };
    }
    if (rule.mode === FeatureAccessMode.FREE) {
      return { ...base, allowed: true, reason: 'free' };
    }

    // PAID
    if (rule.freeUntil && rule.freeUntil > new Date()) {
      return { ...base, allowed: true, reason: 'promo', freeUntil: rule.freeUntil };
    }
    const minTier = rule.minTier ?? SubscriptionTier.BASIC;
    const tier = knownTier ?? (await this.resolveTier(userId));
    if (tierAtLeast(tier, minTier)) {
      return { ...base, requiredTier: minTier, allowed: true, reason: 'tier' };
    }

    if (rule.freeQuota && rule.freeQuota > 0 && rule.quotaPeriod) {
      const periodKey = this.periodKey(rule.quotaPeriod);
      const used = await this.readUsage(userId, key, periodKey);
      const quota = {
        limit: rule.freeQuota,
        used,
        remaining: Math.max(0, rule.freeQuota - used),
        period: rule.quotaPeriod,
        resetsAt: this.periodEnd(rule.quotaPeriod),
      };
      return {
        ...base,
        requiredTier: minTier,
        quota,
        allowed: quota.remaining > 0,
        reason: quota.remaining > 0 ? 'free_quota' : 'quota_exhausted',
      };
    }
    return { ...base, requiredTier: minTier, allowed: false, reason: 'upgrade_required' };
  }

  /** Everything at once, for the client (e.g. to show lock icons). One tier lookup. */
  async evaluateAll(userId: string): Promise<{ tier: SubscriptionTier; features: AccessDecision[] }> {
    const tier = await this.resolveTier(userId);
    const features = await Promise.all(
      FEATURE_CATALOG.map((f) => this.evaluate(userId, f.key, tier)),
    );
    return { tier, features };
  }

  /**
   * Gate: call this where the feature is actually used. Throws 403 with a
   * machine-readable body if not allowed; when the user is spending a free
   * allowance it is counted here, atomically (so two parallel requests can't
   * both squeeze through the last free use).
   */
  async assertAccess(
    userId: string,
    key: FeatureKey,
    opts: { alreadyUnlocked?: boolean } = {},
  ): Promise<AccessDecision> {
    const decision = await this.evaluate(userId, key);

    // The caller already spent a free use on this exact item (re-opening the
    // same explanation): don't charge or block on the allowance a second time.
    // A switched-off or paid-only feature (disabled / upgrade_required) still
    // blocks — this only forgives the free-taste counter.
    if (
      opts.alreadyUnlocked &&
      (decision.reason === 'free_quota' || decision.reason === 'quota_exhausted')
    ) {
      return { ...decision, allowed: true, reason: 'free_quota' };
    }

    if (!decision.allowed) throw this.deny(decision);

    if (decision.reason === 'free_quota') {
      const rule = await this.getRule(key);
      const ok = await this.consumeQuota(userId, key, rule.quotaPeriod!, rule.freeQuota!);
      if (!ok) {
        throw this.deny({
          ...decision,
          allowed: false,
          reason: 'quota_exhausted',
          quota: decision.quota && { ...decision.quota, used: decision.quota.limit, remaining: 0 },
        });
      }
      if (decision.quota) {
        decision.quota = {
          ...decision.quota,
          used: decision.quota.used + 1,
          remaining: Math.max(0, decision.quota.remaining - 1),
        };
      }
    }
    return decision;
  }

  private deny(d: AccessDecision): ForbiddenException {
    const label = FEATURE_BY_KEY.get(d.feature)?.label ?? d.feature;
    let message: string;
    let code: string;
    switch (d.reason) {
      case 'disabled':
        code = 'FEATURE_DISABLED';
        message = `${label} is temporarily unavailable.`;
        break;
      case 'quota_exhausted':
        code = 'QUOTA_EXHAUSTED';
        message = `You've used your free ${label} ${d.quota?.period === QuotaPeriod.MONTHLY ? 'allowance for this month' : 'uses for today'}. Upgrade to keep going.`;
        break;
      default:
        code = 'UPGRADE_REQUIRED';
        message = `${label} is available on paid plans. Upgrade to unlock it.`;
    }
    return new ForbiddenException({
      statusCode: 403,
      error: 'Forbidden',
      message,
      code,
      feature: d.feature,
      requiredTier: d.requiredTier,
      quota: d.quota,
    });
  }

  // ─── ADMIN ────────────────────────────────────────────────────────────────

  async listForAdmin() {
    const rules = await this.ruleRepo.find();
    const byKey = new Map(rules.map((r) => [r.featureKey, r]));
    return FEATURE_CATALOG.map((def) => {
      const r = byKey.get(def.key);
      return {
        featureKey: def.key,
        label: def.label,
        description: def.description,
        enforcement: def.enforcement,
        supportedModes: def.supportedModes,
        mode: r?.mode ?? def.default.mode,
        minTier: r?.minTier ?? def.default.minTier,
        freeQuota: r?.freeQuota ?? null,
        quotaPeriod: r?.quotaPeriod ?? null,
        freeUntil: r?.freeUntil ?? null,
        promoActive: !!r?.freeUntil && r.freeUntil > new Date(),
        updatedBy: r?.updatedBy ?? null,
        updatedAt: r?.updatedAt ?? null,
      };
    });
  }

  /**
   * Public, read-only view of the rules for the pricing page. Deliberately
   * omits admin metadata (who edited it, internal enforcement notes).
   */
  async publicCatalog() {
    return (await this.listForAdmin()).map((r) => ({
      featureKey: r.featureKey,
      label: r.label,
      description: r.description,
      mode: r.mode,
      minTier: r.minTier,
      freeQuota: r.freeQuota,
      quotaPeriod: r.quotaPeriod,
      freeUntil: r.promoActive ? r.freeUntil : null,
    }));
  }

  async updateRule(key: string, dto: UpdateFeatureRuleDto, adminId?: string) {
    const def = FEATURE_BY_KEY.get(key as FeatureKey);
    if (!def) throw new NotFoundException(`Unknown feature "${key}".`);
    const rule = await this.getRuleFresh(def.key);

    const next = {
      mode: dto.mode ?? rule.mode,
      minTier: dto.minTier ?? rule.minTier,
      freeQuota: dto.freeQuota !== undefined ? dto.freeQuota : rule.freeQuota,
      quotaPeriod: dto.quotaPeriod ?? rule.quotaPeriod,
      freeUntil: dto.freeUntil !== undefined ? dto.freeUntil : rule.freeUntil,
    };

    if (!def.supportedModes.includes(next.mode)) {
      throw new BadRequestException(`"${def.label}" does not support mode "${next.mode}".`);
    }
    if (next.mode === FeatureAccessMode.PAID) {
      if (!next.minTier || next.minTier === SubscriptionTier.FREE) {
        throw new BadRequestException('A paid feature needs minTier above FREE.');
      }
      if (next.freeQuota && next.freeQuota > 0 && !next.quotaPeriod) {
        throw new BadRequestException('Set quotaPeriod (daily/monthly) when granting a free quota.');
      }
      if (next.freeUntil && next.freeUntil <= new Date()) {
        throw new BadRequestException('freeUntil must be in the future (send null to end a promo).');
      }
    } else {
      // free / disabled: paid-only knobs are meaningless — clear them so a
      // later flip back to "paid" starts clean instead of resurrecting an old promo.
      next.minTier = null;
      next.freeQuota = null;
      next.quotaPeriod = null;
      next.freeUntil = null;
    }

    Object.assign(rule, next, { updatedBy: adminId ?? null });
    const saved = await this.ruleRepo.save(rule);
    this.cache.delete(def.key);

    this.adminAlerts
      .raise({
        type: AdminAlertType.ADMIN_ACTION,
        title: `Feature access changed: ${def.label}`,
        body: `${def.label} is now "${saved.mode}"${saved.minTier ? ` (from ${saved.minTier})` : ''}${saved.freeQuota ? `, ${saved.freeQuota} free ${saved.quotaPeriod} uses` : ''}${saved.freeUntil ? `, free until ${saved.freeUntil.toISOString()}` : ''}.`,
        priority: AdminAlertPriority.LOW,
        metadata: { featureKey: def.key, adminId: adminId ?? null },
      })
      .catch((e: unknown) => this.logger.warn(`feature rule audit alert failed: ${errorMessage(e)}`));

    return (await this.listForAdmin()).find((r) => r.featureKey === def.key);
  }

  // ─── USAGE COUNTERS ───────────────────────────────────────────────────────

  /** Atomic "take one free use if any remain". false = allowance exhausted. */
  private async consumeQuota(
    userId: string,
    key: FeatureKey,
    period: QuotaPeriod,
    limit: number,
  ): Promise<boolean> {
    const rows: Array<{ count: number }> = await this.dataSource.query(
      `INSERT INTO feature_usage (user_id, feature_key, period_key, "count")
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (user_id, feature_key, period_key)
       DO UPDATE SET "count" = feature_usage."count" + 1
       WHERE feature_usage."count" < $4
       RETURNING "count"`,
      [userId, key, this.periodKey(period), limit],
    );
    return rows.length > 0;
  }

  private async readUsage(userId: string, key: FeatureKey, periodKey: string): Promise<number> {
    const row = await this.dataSource
      .getRepository(FeatureUsage)
      .findOne({ where: { userId, featureKey: key, periodKey } });
    return row?.count ?? 0;
  }

  private async getRuleFresh(key: FeatureKey): Promise<FeatureAccessRule> {
    this.cache.delete(key);
    return this.getRule(key);
  }

  // ─── PERIOD MATH (Lagos calendar) ─────────────────────────────────────────

  private lagosNow(): Date {
    return new Date(Date.now() + LAGOS_OFFSET_MS);
  }

  periodKey(period: QuotaPeriod): string {
    const iso = this.lagosNow().toISOString();
    return period === QuotaPeriod.MONTHLY ? iso.slice(0, 7) : iso.slice(0, 10);
  }

  private periodEnd(period: QuotaPeriod): Date {
    const l = this.lagosNow();
    const endLagos =
      period === QuotaPeriod.MONTHLY
        ? Date.UTC(l.getUTCFullYear(), l.getUTCMonth() + 1, 1)
        : Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate() + 1);
    return new Date(endLagos - LAGOS_OFFSET_MS);
  }
}
