import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AdminInviteStatus, UserRole } from 'src/common/enums/enums';
import { User } from 'src/user/entities/user.entity';

/**
 * A pending (or resolved) invitation for someone to join the admin team.
 *
 * Flow: a SUPER_ADMIN creates one (see AdminInviteService.createInvite),
 * which emails a one-time link containing the raw token. Only the SHA-256
 * hash of that token is ever persisted — the same pattern used for OTPs
 * and refresh tokens elsewhere in this codebase — so a leaked database
 * dump doesn't hand out usable invite links.
 */
@Entity('admin_invites')
@Index(['email', 'status'])
@Index(['tokenHash'], { unique: true })
export class AdminInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'phone_number' })
  phoneNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  designation: string | null;

  /** Only ADMIN or SUPER_ADMIN — enforced in the DTO, not at the DB level. */
  @Column({ type: 'enum', enum: UserRole, default: UserRole.ADMIN })
  role!: UserRole;

  @Column({ type: 'varchar', length: 255, select: false })
  tokenHash!: string;

  @Column({ type: 'enum', enum: AdminInviteStatus, default: AdminInviteStatus.PENDING })
  status!: AdminInviteStatus;

  @Column({ type: 'uuid', nullable: true })
  invitedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'invitedById' })
  invitedBy: User | null;

  /** Populated once the invite is accepted — the account it created. */
  @Column({ type: 'uuid', nullable: true })
  createdUserId: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  isExpired(): boolean {
    return this.expiresAt.getTime() < Date.now();
  }

  isPending(): boolean {
    return this.status === AdminInviteStatus.PENDING && !this.isExpired();
  }
}
