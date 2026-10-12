import { BadRequestException, ConflictException } from '@nestjs/common';
import { PlansService } from './plans.service';
import { Plan } from './entities/plan.entity';
import { BillingInterval, SubscriptionTier } from 'src/common/enums/enums';

const H = 3_600_000;
const NOW = new Date('2026-10-01T12:00:00Z');
const at = (h: number) => new Date(NOW.getTime() + h * H);

function plan(over: Partial<Plan> = {}): Plan {
  return {
    id: 'p1', code: 'standard-monthly', name: 'Standard Monthly', description: null,
    tier: SubscriptionTier.STANDARD, interval: BillingInterval.MONTHLY,
    amountKobo: 500000, currency: 'NGN', features: [], badge: null, sortOrder: 0,
    isActive: true, isPublic: true, isSelfServe: true,
    promoAmountKobo: null, promoLabel: null, promoStartsAt: null, promoEndsAt: null,
    createdAt: NOW, updatedAt: NOW, ...over,
  } as Plan;
}

describe('PlansService', () => {
  let repo: any;
  let alerts: { raise: jest.Mock };
  let svc: PlansService;

  beforeEach(() => {
    repo = {
      find: jest.fn(), findOne: jest.fn(), count: jest.fn(),
      exist: jest.fn().mockResolvedValue(false),
      create: jest.fn((x) => ({ ...x })),
      save: jest.fn(async (x) => x),
    };
    alerts = { raise: jest.fn().mockResolvedValue(undefined) };
    svc = new PlansService(repo, alerts as any);
    jest.useFakeTimers().setSystemTime(NOW);
  });
  afterEach(() => jest.useRealTimers());

  describe('getEffectivePrice', () => {
    it('is the list price when there is no promo', () => {
      expect(svc.getEffectivePrice(plan())).toMatchObject({ amountKobo: 500000, isPromo: false, discountPercent: 0 });
    });

    it('applies a promo inside its window and reports the discount', () => {
      const p = plan({ promoAmountKobo: 400000, promoLabel: 'Back to school', promoStartsAt: at(-1), promoEndsAt: at(24) });
      expect(svc.getEffectivePrice(p, NOW)).toMatchObject({
        amountKobo: 400000, listAmountKobo: 500000, isPromo: true, discountPercent: 20, promoLabel: 'Back to school',
      });
    });

    it('does not apply a promo before it starts', () => {
      const p = plan({ promoAmountKobo: 400000, promoStartsAt: at(1), promoEndsAt: at(24) });
      expect(svc.getEffectivePrice(p, NOW).isPromo).toBe(false);
    });

    it('expires by itself: at and after promoEndsAt the list price is back', () => {
      const p = plan({ promoAmountKobo: 400000, promoStartsAt: at(-10), promoEndsAt: at(0) });
      expect(svc.getEffectivePrice(p, NOW)).toMatchObject({ amountKobo: 500000, isPromo: false });
    });

    it('ignores a promo that is not actually cheaper than the list price', () => {
      const p = plan({ promoAmountKobo: 500000, promoStartsAt: at(-1), promoEndsAt: at(5) });
      expect(svc.getEffectivePrice(p, NOW).isPromo).toBe(false);
    });
  });

  describe('setPromo', () => {
    const future = at(48);
    beforeEach(() => repo.findOne.mockResolvedValue(plan()));

    it('sets a valid promo and audits it', async () => {
      const saved = await svc.setPromo('p1', { promoAmountKobo: 400000, promoEndsAt: future, promoLabel: 'X' } as any, 'admin1');
      expect(saved.promoAmountKobo).toBe(400000);
      expect(saved.promoStartsAt).toEqual(NOW); // defaults to "now"
      expect(alerts.raise).toHaveBeenCalledWith(expect.objectContaining({ metadata: expect.objectContaining({ adminId: 'admin1' }) }));
    });

    it.each([
      ['promo not below list', { promoAmountKobo: 500000, promoEndsAt: future }],
      ['promo above list', { promoAmountKobo: 900000, promoEndsAt: future }],
      ['ends in the past', { promoAmountKobo: 400000, promoEndsAt: at(-1) }],
      ['ends before it starts', { promoAmountKobo: 400000, promoStartsAt: at(72), promoEndsAt: future }],
    ])('rejects: %s', async (_n, dto) => {
      await expect(svc.setPromo('p1', dto as any)).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('refuses to put a promo on a free plan', async () => {
      repo.findOne.mockResolvedValue(plan({ tier: SubscriptionTier.FREE, interval: null, amountKobo: 0 }));
      await expect(svc.setPromo('p1', { promoAmountKobo: 10000, promoEndsAt: future } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('drops a running promo if the list price is cut to or below it (never leave a promo that raises the price)', async () => {
      repo.findOne.mockResolvedValue(plan({ promoAmountKobo: 400000, promoStartsAt: at(-1), promoEndsAt: at(24) }));
      const saved = await svc.update('p1', { amountKobo: 350000 });
      expect(saved.amountKobo).toBe(350000);
      expect(saved.promoAmountKobo).toBeNull();
      expect(saved.promoEndsAt).toBeNull();
    });

    it('keeps a running promo when the list price change leaves it cheaper', async () => {
      repo.findOne.mockResolvedValue(plan({ promoAmountKobo: 400000, promoStartsAt: at(-1), promoEndsAt: at(24) }));
      const saved = await svc.update('p1', { amountKobo: 600000 });
      expect(saved.promoAmountKobo).toBe(400000);
    });

    it('cannot make a self-serve paid plan free', async () => {
      repo.findOne.mockResolvedValue(plan());
      await expect(svc.update('p1', { amountKobo: 0 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('audits price changes, and states that existing subscribers keep their price', async () => {
      repo.findOne.mockResolvedValue(plan());
      await svc.update('p1', { amountKobo: 550000 }, 'admin1');
      expect(alerts.raise.mock.calls[0][0].body).toMatch(/keep the price/i);
    });
  });

  describe('create', () => {
    const dto = { code: 'x-monthly', name: 'X', tier: SubscriptionTier.BASIC, interval: BillingInterval.MONTHLY, amountKobo: 100000 } as any;

    it('rejects a duplicate code', async () => {
      repo.exist.mockResolvedValue(true);
      await expect(svc.create(dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it.each([
      ['a paid plan with no interval', { ...dto, interval: undefined }],
      ['a self-serve paid plan priced at 0', { ...dto, amountKobo: 0 }],
      ['a FREE plan with a price', { ...dto, tier: SubscriptionTier.FREE, interval: undefined, amountKobo: 100 }],
      ['a FREE plan with an interval', { ...dto, tier: SubscriptionTier.FREE, amountKobo: 0 }],
    ])('rejects %s', async (_n, bad) => {
      await expect(svc.create(bad)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows a contact-sales plan with a 0 placeholder price', async () => {
      await expect(svc.create({ ...dto, amountKobo: 0, isSelfServe: false })).resolves.toBeTruthy();
    });
  });

  describe('listing & purchase', () => {
    it('archive() is a soft delete', async () => {
      repo.findOne.mockResolvedValue(plan());
      expect((await svc.archive('p1')).isActive).toBe(false);
    });

    it('refuses to purchase a retired plan', async () => {
      repo.findOne.mockResolvedValue(plan({ isActive: false }));
      await expect(svc.getPurchasableById('p1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('public list shows the promo-aware price', async () => {
      repo.find.mockResolvedValue([plan({ promoAmountKobo: 400000, promoStartsAt: at(-1), promoEndsAt: at(5) })]);
      const [v] = await svc.listPublic();
      expect(v).toMatchObject({ amountKobo: 400000, listAmountKobo: 500000, isPromo: true });
    });

    it('legacy {tier, interval} resolves to the matching active plan', async () => {
      repo.find.mockResolvedValue([
        plan({ id: 'a', interval: BillingInterval.ANNUALLY }),
        plan({ id: 'm', interval: BillingInterval.MONTHLY }),
      ]);
      expect((await svc.resolveByTierInterval(SubscriptionTier.STANDARD, BillingInterval.MONTHLY))?.id).toBe('m');
      expect(await svc.resolveByTierInterval(SubscriptionTier.STANDARD, null)).toBeNull();
    });
  });

  describe('seeding', () => {
    it('does nothing when plans already exist (never overwrites admin edits)', async () => {
      repo.count.mockResolvedValue(3);
      await svc.onModuleInit();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('seeds the legacy catalogue on an empty table, with the legacy prices', async () => {
      repo.count.mockResolvedValue(0);
      await svc.onModuleInit();
      const seeded = repo.save.mock.calls[0][0] as Plan[];
      const price = (code: string) => seeded.find((p) => p.code === code)?.amountKobo;
      expect(price('basic-monthly')).toBe(250000);
      expect(price('standard-monthly')).toBe(500000);
      expect(price('standard-annual')).toBe(4800000);
      expect(price('premium-monthly')).toBe(900000);
      expect(seeded.find((p) => p.code === 'enterprise')?.isSelfServe).toBe(false);
    });

    it('never crashes boot if seeding fails', async () => {
      repo.count.mockRejectedValue(new Error('relation "plans" does not exist'));
      await expect(svc.onModuleInit()).resolves.toBeUndefined();
    });
  });
});
