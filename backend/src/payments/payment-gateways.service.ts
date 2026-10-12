import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { errorMessage } from 'src/common/error-message.util';
import { PaymentGatewayCode } from 'src/common/enums/enums';
import { GatewayCapabilities, PaymentGateway } from './gateway.interface';
import { PaymentGatewayRegistry } from './payment-gateway.registry';
import { PaymentGatewayConfig } from './entities/payment-gateway-config.entity';
import { UpdatePaymentGatewayDto } from './dto/update-gateway.dto';

export interface CheckoutGatewayOption {
  code: string;
  displayName: string;
  isDefault: boolean;
  capabilities: GatewayCapabilities;
}

export interface AdminGatewayView extends CheckoutGatewayOption {
  enabled: boolean;
  /** Are the env credentials present? Unconfigured gateways can't be enabled. */
  configured: boolean;
  sortOrder: number;
  updatedAt: Date;
}

@Injectable()
export class PaymentGatewaysService implements OnModuleInit {
  private readonly logger = new Logger(PaymentGatewaysService.name);

  constructor(
    @InjectRepository(PaymentGatewayConfig)
    private readonly repo: Repository<PaymentGatewayConfig>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly registry: PaymentGatewayRegistry,
  ) {}

  /**
   * Ensure a config row per implemented gateway. Paystack is enabled+default
   * on first seed (it is what the app already runs on); every newer gateway
   * starts OFF until an admin turns it on.
   */
  async onModuleInit(): Promise<void> {
    try {
      const existing = new Set((await this.repo.find()).map((r) => r.code));
      let order = existing.size;
      for (const g of this.registry.all()) {
        if (existing.has(g.code)) continue;
        const first = g.code === PaymentGatewayCode.PAYSTACK;
        await this.repo.save(
          this.repo.create({
            code: g.code,
            displayName: g.defaultDisplayName,
            enabled: first,
            isDefault: first,
            sortOrder: first ? 0 : ++order,
          }),
        );
        this.logger.log(`Registered payment gateway "${g.code}" (enabled=${first}).`);
      }
    } catch (err) {
      this.logger.error(`Gateway config seeding skipped: ${errorMessage(err)}`);
    }
  }

  // ─── READS ────────────────────────────────────────────────────────────────

  /** What the checkout UI shows: enabled AND fully configured, in admin order. */
  async listCheckoutOptions(): Promise<CheckoutGatewayOption[]> {
    const rows = await this.repo.find({
      where: { enabled: true },
      order: { sortOrder: 'ASC' },
    });
    return rows
      .filter((r) => this.registry.has(r.code) && this.registry.get(r.code).isConfigured())
      .map((r) => ({
        code: r.code,
        displayName: r.displayName,
        isDefault: r.isDefault,
        capabilities: this.registry.get(r.code).capabilities,
      }));
  }

  async listForAdmin(): Promise<AdminGatewayView[]> {
    const rows = await this.repo.find({ order: { sortOrder: 'ASC' } });
    return rows
      .filter((r) => this.registry.has(r.code))
      .map((r) => {
        const g = this.registry.get(r.code);
        return {
          code: r.code,
          displayName: r.displayName,
          isDefault: r.isDefault,
          enabled: r.enabled,
          configured: g.isConfigured(),
          sortOrder: r.sortOrder,
          capabilities: g.capabilities,
          updatedAt: r.updatedAt,
        };
      });
  }

  /**
   * Pick the gateway for a NEW checkout. Explicit code must be enabled and
   * configured; no code → the admin's default.
   */
  async resolveForCheckout(code?: string): Promise<PaymentGateway> {
    const options = await this.listCheckoutOptions();
    if (options.length === 0) {
      throw new BadRequestException('Payments are temporarily unavailable. Please try again later.');
    }
    if (code) {
      const chosen = options.find((o) => o.code === code);
      if (!chosen) {
        throw new BadRequestException(`Payment method "${code}" is not available right now.`);
      }
      return this.registry.get(chosen.code);
    }
    const fallback = options.find((o) => o.isDefault) ?? options[0];
    return this.registry.get(fallback.code);
  }

  // ─── ADMIN WRITES ─────────────────────────────────────────────────────────

  async update(code: string, dto: UpdatePaymentGatewayDto): Promise<AdminGatewayView[]> {
    if (!this.registry.has(code)) throw new NotFoundException(`Unknown gateway "${code}".`);
    const gateway = this.registry.get(code);

    await this.dataSource.transaction(async (m) => {
      const repo = m.getRepository(PaymentGatewayConfig);
      const row = await repo.findOne({ where: { code } });
      if (!row) throw new NotFoundException(`Gateway "${code}" has no config row.`);

      if (dto.enabled === true && !gateway.isConfigured()) {
        throw new BadRequestException(
          `"${code}" can't be enabled: its credentials/URLs are not set in the server environment.`,
        );
      }
      if (dto.displayName !== undefined) row.displayName = dto.displayName;
      if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;
      if (dto.enabled !== undefined) row.enabled = dto.enabled;
      if (dto.isDefault === true) row.isDefault = true;
      if (dto.isDefault === false) row.isDefault = false;

      // A default must be enabled.
      if (row.isDefault && !row.enabled) {
        if (dto.isDefault === true) {
          throw new BadRequestException('Enable a gateway before making it the default.');
        }
        row.isDefault = false;
      }
      await repo.save(row);

      // Exactly one default among the enabled gateways.
      if (row.isDefault) {
        await repo
          .createQueryBuilder()
          .update()
          .set({ isDefault: false })
          .where('code != :code', { code })
          .execute();
      }

      const enabled = await repo.find({ where: { enabled: true }, order: { sortOrder: 'ASC' } });
      if (enabled.length === 0) {
        throw new BadRequestException('At least one payment gateway must stay enabled.');
      }
      if (!enabled.some((e) => e.isDefault)) {
        enabled[0].isDefault = true;
        await repo.save(enabled[0]);
      }
    });

    return this.listForAdmin();
  }
}
