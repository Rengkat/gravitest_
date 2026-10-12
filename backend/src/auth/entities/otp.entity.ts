import { Exclude } from 'class-transformer';
import { OtpPurpose } from 'src/common/enums/enums';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('otps')
@Index(['userId', 'purpose'])
@Index(['expiresAt'])
@Index(['usedAt'])
@Index(['revokedAt'])
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (user) => user.otps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: OtpPurpose,
  })
  purpose: OtpPurpose;

  @Column({ type: 'varchar', length: 255 })
  codeHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  channel: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  target: string | null;

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isUsed(): boolean {
    return !!this.usedAt;
  }

  isRevoked(): boolean {
    return !!this.revokedAt;
  }

  isAttemptLimitReached(maxAttempts = 5): boolean {
    return this.attempts >= maxAttempts;
  }

  canBeValidated(maxAttempts = 5): boolean {
    return (
      !this.isExpired() &&
      !this.isUsed() &&
      !this.isRevoked() &&
      !this.isAttemptLimitReached(maxAttempts)
    );
  }

  incrementAttempts(): void {
    this.attempts += 1;
  }

  markUsed(): void {
    this.usedAt = new Date();
  }

  revoke(): void {
    this.revokedAt = new Date();
  }
}
