import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  AdminAlertPriority,
  AdminAlertType,
  BillingInterval,
  SubscriptionTier,
} from 'src/common/enums/enums';
import { errorMessage } from 'src/common/error-message.util';
import { AdminAlertsService } from 'src/admin-alerts/admin-alerts.service';
import { Plan } from './entities/plan.entity';
import { CreatePlanDto, SetPlanPromoDto, UpdatePlanDto } from './dto/plan.dto';

export interface EffectivePrice {
  /** What the customer pays today, in kobo. */
  amountKobo: number;
  /** Regular price, in kobo. */
  listAmountKobo: number;
  isPromo: boolean;
  promoLabel: string | null;
  promoEndsAt: Date | null;
  discountPercent: number;
}

/** Shape returned to clients. Superset of the old hardcoded plan shape. */
export interface PlanView {
  id: string;
  code: string;
  name: string;
  description: string | null;
  tier: SubscriptionTier;
  interval: BillingInterval | null;
  currency: string;
  amountKobo: number; // effective price right now (promo-aware)
  listAmountKobo: number;
  isPromo: boolean;
  promoLabel: string | null;
  promoEndsAt: Date | null;
  discountPercent: number;
  features: string[];
  badge: string | null;
  isSelfServe: boolean;
}

@Injectable()
export class PlansService implements OnModuleInit {
  private readonly logger = new Logger(PlansService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    private readonly adminAlerts: AdminAlertsService,
  ) {}

  // ─── PRICING (pure — unit tested) ─────────────────────────────────────────

  /**
   * The promo price applies only while `now` is inside [promoStartsAt,
   * promoEndsAt) — both bounds optional except the end, which admins are
   * forced to set (see SetPlanPromoDto). A promo that has expired simply stops
   * applying; nothing has to run to "turn it off".
   */
  getEffectivePrice(plan: Plan, now: Date = new Date()): EffectivePrice {
    const list = plan.amountKobo;
    const promoLive =
      plan.promoAmountKobo != null &&
      plan.promoAmountKobo < list &&
      (!plan.promoStartsAt || plan.promoStartsAt <= now) &&
      (!plan.promoEndsAt || plan.promoEndsAt > now);

    const amount = promoLive ? (plan.promoAmountKobo as number) : list;
    return {
      amountKobo: amount,
      listAmountKobo: list,
      isPromo: promoLive,
      promoLabel: promoLive ? plan.promoLabel : null,
      promoEndsAt: promoLive ? plan.promoEndsAt : null,
      discountPercent:
        promoLive && list > 0 ? Math.round(((list - amount) / list) * 100) : 0,
    };
  }

  toView(plan: Plan, now: Date = new Date()): PlanView {
    const price = this.getEffectivePrice(plan, now);
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      tier: plan.tier,
      interval: plan.interval,
      currency: plan.currency,
      amountKobo: price.amountKobo,
      listAmountKobo: price.listAmountKobo,
      isPromo: price.isPromo,
      promoLabel: price.promoLabel,
      promoEndsAt: price.promoEndsAt,
      discountPercent: price.discountPercent,
      features: plan.features ?? [],
      badge: plan.badge,
      isSelfServe: plan.isSelfServe,
    };
  }

  // ─── READS ────────────────────────────────────────────────────────────────

  /** Public pricing page: active + listed plans only. */
  async listPublic(): Promise<PlanView[]> {
    const plans = await this.planRepo.find({
      where: { isActive: true, isPublic: true },
      order: { sortOrder: 'ASC', amountKobo: 'ASC' },
    });
    const now = new Date();
    return plans.map((p) => this.toView(p, now));
  }

  /** Admin: everything, including retired and unlisted plans. */
  async listAll(): Promise<Array<Plan & { effective: EffectivePrice }>> {
    const plans = await this.planRepo.find({
      order: { sortOrder: 'ASC', amountKobo: 'ASC' },
    });
    const now = new Date();
    return plans.map((p) =>
      Object.assign(p, { effective: this.getEffectivePrice(p, now) }),
    );
  }

  async getById(id: string): Promise<Plan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan "${id}" not found.`);
    return plan;
  }

  /** Checkout path: refuses retired plans. */
  async getPurchasableById(id: string): Promise<Plan> {
    const plan = await this.getById(id);
    if (!plan.isActive) {
      throw new BadRequestException('This plan is no longer available.');
    }
    return plan;
  }

  /**
   * Back-compat for clients still sending { tier, interval } instead of a
   * planId. Picks the first active plan by admin sort order.
   */
  async resolveByTierInterval(
    tier: SubscriptionTier,
    interval: BillingInterval | null,
  ): Promise<Plan | null> {
    const candidates = await this.planRepo.find({
      where: { tier, isActive: true },
      order: { sortOrder: 'ASC', amountKobo: 'ASC' },
    });
    return (
      candidates.find((p) => (p.interval ?? null) === (interval ?? null)) ??
      null
    );
  }

  // ─── ADMIN WRITES ─────────────────────────────────────────────────────────

  async create(dto: CreatePlanDto, adminId?: string): Promise<Plan> {
    this.assertConsistent({
      tier: dto.tier,
      interval: dto.interval ?? null,
      amountKobo: dto.amountKobo,
      isSelfServe: dto.isSelfServe ?? true,
    });

    if (await this.planRepo.exist({ where: { code: dto.code } })) {
      throw new ConflictException(`A plan with code "${dto.code}" exists.`);
    }

    const plan = await this.planRepo.save(
      this.planRepo.create({
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
        tier: dto.tier,
        interval: dto.interval ?? null,
        amountKobo: dto.amountKobo,
        features: dto.features ?? [],
        badge: dto.badge ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        isPublic: dto.isPublic ?? true,
        isSelfServe: dto.isSelfServe ?? true,
      }),
    );
    this.audit(`Plan created: ${plan.name}`, plan, adminId);
    return plan;
  }

  async update(id: string, dto: UpdatePlanDto, adminId?: string): Promise<Plan> {
    const plan = await this.getById(id);
    const before = plan.amountKobo;

    const next = {
      tier: plan.tier,
      interval: plan.interval,
      amountKobo: dto.amountKobo ?? plan.amountKobo,
      isSelfServe: dto.isSelfServe ?? plan.isSelfServe,
    };
    this.assertConsistent(next);

    // Lowering the list price under a running promo would make the promo a
    // price *increase* — drop the promo rather than leave it incoherent.
    if (
      plan.promoAmountKobo != null &&
      next.amountKobo <= plan.promoAmountKobo
    ) {
      this.clearPromoFields(plan);
    }

    Object.assign(plan, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.amountKobo !== undefined && { amountKobo: dto.amountKobo }),
      ...(dto.features !== undefined && { features: dto.features }),
      ...(dto.badge !== undefined && { badge: dto.badge || null }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      ...(dto.isSelfServe !== undefined && { isSelfServe: dto.isSelfServe }),
    });
    const saved = await this.planRepo.save(plan);

    if (dto.amountKobo !== undefined && dto.amountKobo !== before) {
      this.audit(
        `Plan price changed: ${saved.name}`,
        saved,
        adminId,
        `List price ₦${before / 100} → ₦${saved.amountKobo / 100}. Existing subscribers keep the price they signed up at.`,
      );
    }
    return saved;
  }

  async setPromo(id: string, dto: SetPlanPromoDto, adminId?: string): Promise<Plan> {
    const plan = await this.getById(id);
    if (plan.tier === SubscriptionTier.FREE || plan.amountKobo <= 0) {
      throw new BadRequestException('A free plan cannot have a promo price.');
    }
    if (dto.promoAmountKobo >= plan.amountKobo) {
      throw new BadRequestException(
        'Promo price must be lower than the list price.',
      );
    }
    const startsAt = dto.promoStartsAt ?? new Date();
    if (dto.promoEndsAt <= startsAt) {
      throw new BadRequestException('promoEndsAt must be after promoStartsAt.');
    }
    if (dto.promoEndsAt <= new Date()) {
      throw new BadRequestException('promoEndsAt must be in the future.');
    }

    plan.promoAmountKobo = dto.promoAmountKobo;
    plan.promoLabel = dto.promoLabel ?? null;
    plan.promoStartsAt = startsAt;
    plan.promoEndsAt = dto.promoEndsAt;
    const saved = await this.planRepo.save(plan);
    this.audit(
      `Promo set: ${saved.name}`,
      saved,
      adminId,
      `₦${plan.amountKobo / 100} → ₦${dto.promoAmountKobo / 100} until ${dto.promoEndsAt.toISOString()}`,
    );
    return saved;
  }

  async clearPromo(id: string, adminId?: string): Promise<Plan> {
    const plan = await this.getById(id);
    this.clearPromoFields(plan);
    const saved = await this.planRepo.save(plan);
    this.audit(`Promo cleared: ${saved.name}`, saved, adminId);
    return saved;
  }

  /** "Delete" = retire. Subscriptions keep their FK; history stays intact. */
  async archive(id: string, adminId?: string): Promise<Plan> {
    const plan = await this.getById(id);
    plan.isActive = false;
    const saved = await this.planRepo.save(plan);
    this.audit(`Plan retired: ${saved.name}`, saved, adminId);
    return saved;
  }

  // ─── SEED (one-time migration of the old hardcoded catalogue) ────────────

  /**
   * On first boot after this feature ships the `plans` table is empty. Seed it
   * with exactly the plans the app used to hardcode (env-overridable amounts
   * preserved) so behaviour is unchanged until an admin edits something.
   * Never runs again once any plan exists.
   */
  async onModuleInit(): Promise<void> {
    try {
      if ((await this.planRepo.count()) > 0) return;
      const num = (v: string | undefined, d: number) => (v ? Number(v) : d);
      const seed: Array<Partial<Plan>> = [
        {
          code: 'free', name: 'Free', tier: SubscriptionTier.FREE, interval: null,
          amountKobo: 0, sortOrder: 0,
          features: ['Limited practice sessions', 'Basic progress tracking'],
        },
        {
          code: 'basic-monthly', name: 'Basic Monthly', tier: SubscriptionTier.BASIC,
          interval: BillingInterval.MONTHLY, sortOrder: 10,
          amountKobo: num(process.env.PLAN_BASIC_MONTHLY_AMOUNT_KOBO, 250000),
          features: ['Unlimited practice', 'Sabi Tutor chat (standard limits)'],
        },
        {
          code: 'standard-monthly', name: 'Standard Monthly', tier: SubscriptionTier.STANDARD,
          interval: BillingInterval.MONTHLY, sortOrder: 20, badge: 'Most Popular',
          amountKobo: num(process.env.PLAN_STANDARD_MONTHLY_AMOUNT_KOBO, 500000),
          features: ['Everything in Basic', 'Higher Sabi Tutor limits', 'AI essay scoring'],
        },
        {
          code: 'standard-annual', name: 'Standard Annual', tier: SubscriptionTier.STANDARD,
          interval: BillingInterval.ANNUALLY, sortOrder: 30, badge: 'Best Value',
          amountKobo: num(process.env.PLAN_STANDARD_ANNUAL_AMOUNT_KOBO, 4800000),
          features: ['Everything in Standard Monthly', 'Save ~20% vs monthly'],
        },
        {
          code: 'premium-monthly', name: 'Premium Monthly', tier: SubscriptionTier.PREMIUM,
          interval: BillingInterval.MONTHLY, sortOrder: 40,
          amountKobo: num(process.env.PLAN_PREMIUM_MONTHLY_AMOUNT_KOBO, 900000),
          features: ['Everything in Standard', 'Highest Sabi Tutor limits', 'Priority AI grading'],
        },
        {
          code: 'enterprise', name: 'Enterprise', tier: SubscriptionTier.ENTERPRISE,
          interval: BillingInterval.ANNUALLY, sortOrder: 50, amountKobo: 0,
          isSelfServe: false,
          features: ['Custom limits', 'Dedicated support', 'Contact sales'],
        },
      ];
      await this.planRepo.save(seed.map((p) => this.planRepo.create(p)));
      this.logger.log(`Seeded ${seed.length} default plans from the legacy catalogue.`);
    } catch (err) {
      // Never block app boot on seeding (e.g. tables not migrated yet).
      this.logger.error(`Plan seeding skipped: ${errorMessage(err)}`);
    }
  }

  // ─── INTERNALS ────────────────────────────────────────────────────────────

  private assertConsistent(p: {
    tier: SubscriptionTier;
    interval: BillingInterval | null;
    amountKobo: number;
    isSelfServe: boolean;
  }): void {
    if (p.tier === SubscriptionTier.FREE) {
      if (p.interval !== null || p.amountKobo !== 0) {
        throw new BadRequestException(
          'A FREE plan must have no billing interval and a price of 0.',
        );
      }
      return;
    }
    if (!p.interval) {
      throw new BadRequestException('Paid plans need a billing interval.');
    }
    // Sales-negotiated plans may carry a 0 placeholder price.
    if (p.amountKobo <= 0 && p.isSelfServe) {
      throw new BadRequestException(
        'A self-serve paid plan needs a price above 0 (mark it not self-serve for "contact sales").',
      );
    }
  }

  private clearPromoFields(plan: Plan): void {
    plan.promoAmountKobo = null;
    plan.promoLabel = null;
    plan.promoStartsAt = null;
    plan.promoEndsAt = null;
  }

  private audit(title: string, plan: Plan, adminId?: string, detail?: string): void {
    this.adminAlerts
      .raise({
        type: AdminAlertType.ADMIN_ACTION,
        title,
        body: detail ?? `${plan.name} (${plan.code}) was modified by an admin.`,
        priority: AdminAlertPriority.LOW,
        metadata: { planId: plan.id, planCode: plan.code, adminId: adminId ?? null },
      })
      .catch((err: unknown) => this.logger.warn(`plan audit alert failed: ${errorMessage(err)}`));
  }
}
