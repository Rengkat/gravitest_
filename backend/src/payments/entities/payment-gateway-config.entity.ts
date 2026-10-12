import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Admin-controlled switchboard for payment gateways. NO SECRETS live here —
 * API keys stay in environment variables; this table only decides which
 * already-configured gateways customers are offered, and in what order.
 */
@Entity('payment_gateway_configs')
export class PaymentGatewayConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** PaymentGatewayCode value. varchar (not a PG enum) so adding a gateway needs no ALTER TYPE. */
  @Column({ type: 'varchar', length: 20, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 120 })
  displayName!: string;

  /** Offered at checkout. Disabling never affects webhooks for in-flight payments. */
  @Column({ type: 'boolean', default: false })
  enabled!: boolean;

  /** Pre-selected at checkout. Exactly one enabled gateway is the default. */
  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
