import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import {
  TransactionChannel,
  TransactionStatus,
  TransactionType,
} from 'src/common/enums/enums';

// Generic payment ledger. Any module that needs to charge a user goes
// through TransactionsService, which creates one row here per attempt —
// including renewal charges Paystack initiates on its own for a recurring
// subscription (we create the row retroactively when the webhook lands).
//
// `relatedEntityType` + `relatedEntityId` link it back to whatever it paid
// for (e.g. 'subscription' + Subscription.id) without a hard FK, so this
// entity never needs to know about other modules.
@Entity('transactions')
@Index(['userId'])
@Index(['reference'], { unique: true })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Our own internally-generated reference, sent to Paystack as `reference`.
  // For renewal charges Paystack initiates itself, this is Paystack's own
  // reference instead (we didn't generate one up front for those).
  @Column({ type: 'varchar' })
  reference: string;

  // Which payment rail collected this (PaymentGatewayCode). varchar, not a PG enum.
  @Column({ type: 'varchar', length: 20, default: 'paystack' })
  @Index()
  gateway: string;

  // The provider's own id for the payment (Paystack transaction id / OPay orderNo).
  // NOTE: the physical column is still called "paystackReference" — kept on
  // purpose so existing rows survive and TypeORM's synchronize doesn't treat a
  // rename as drop+add (data loss). Rename it with a proper migration once
  // synchronize is off.
  @Column({ name: 'paystackReference', type: 'varchar', nullable: true })
  gatewayReference: string | null;

  /**
   * @deprecated Read `gatewayReference` (+ `gateway`). Kept as a serialized
   * alias so existing API clients — e.g. the invoice download, which prints
   * `tx.paystackReference` — keep receiving the field they always did.
   * Read-only and NOT a column.
   */
  @Expose()
  get paystackReference(): string | null {
    return this.gatewayReference;
  }

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  // Free-form human-readable purpose, e.g. 'pro_monthly_subscription'
  @Column({ type: 'varchar', nullable: true })
  purpose: string | null;

  // Kobo, matching Subscription.amountKobo elsewhere in the app.
  @Column('bigint')
  amountKobo: number;

  @Column({ type: 'varchar', default: 'NGN' })
  currency: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'enum', enum: TransactionChannel, nullable: true })
  channel: TransactionChannel | null;

  @Column({ type: 'varchar', nullable: true })
  cardLast4: string | null;

  @Column({ type: 'varchar', nullable: true })
  cardType: string | null;

  @Column({ type: 'varchar', nullable: true })
  bank: string | null;

  @Column({ type: 'varchar', nullable: true })
  authorizationCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  relatedEntityType: string | null;

  @Column({ type: 'varchar', nullable: true })
  relatedEntityId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'varchar', nullable: true })
  gatewayMessage: string | null;

  // Full raw Paystack response, kept for reconciliation/support disputes.
  @Column({ type: 'jsonb', nullable: true })
  rawPayload: Record<string, any> | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
