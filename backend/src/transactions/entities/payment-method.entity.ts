import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * A saved, reusable Paystack card authorization. Created automatically the
 * first time a user pays with a card Paystack marks `reusable: true`
 * (see TransactionsService.markSuccessful). Used to charge renewals and
 * one-click "pay with saved card" flows via /transaction/charge_authorization.
 */
@Entity('payment_methods')
@Index(['userId'])
@Unique('UQ_payment_methods_user_signature', ['userId', 'signature'])
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  // Never store raw card data — this is Paystack's token for the card.
  @Column({ type: 'varchar' })
  authorizationCode: string;

  // Paystack's dedupe fingerprint for the physical card — prevents the SAME
  // USER saving the same card twice (unique per user, see @Unique below; a
  // globally-unique signature let one account's payment collide with another's).
  @Column({ type: 'varchar', nullable: true })
  signature: string | null;

  @Column({ type: 'varchar' })
  last4: string;

  @Column({ type: 'varchar', nullable: true })
  cardType: string | null; // visa / mastercard / verve

  @Column({ type: 'varchar', nullable: true })
  bank: string | null;

  @Column({ type: 'varchar' })
  expMonth: string;

  @Column({ type: 'varchar' })
  expYear: string;

  @Column({ type: 'varchar', nullable: true })
  holderName: string | null;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
