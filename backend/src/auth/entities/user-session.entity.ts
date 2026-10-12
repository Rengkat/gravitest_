import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';

export enum SessionRevokeReason {
  LOGOUT = 'logout',
  LOGOUT_ALL = 'logout_all',
  REFRESH_ROTATED = 'refresh_rotated',
  ADMIN_REVOKED = 'admin_revoked',
  SECURITY_REVOKED = 'security_revoked',
}

@Entity('user_sessions')
@Index(['userId'])
@Index(['jti'], { unique: true })
@Index(['expiresAt'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  jti!: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  refreshTokenHash!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', nullable: true })
  deviceId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  deviceName!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({
    type: 'enum',
    enum: SessionRevokeReason,
    nullable: true,
  })
  revokedReason!: SessionRevokeReason | null;

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isRevoked(): boolean {
    return !!this.revokedAt;
  }

  isActive(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  touch(): void {
    this.lastUsedAt = new Date();
  }

  revoke(reason: SessionRevokeReason): void {
    this.revokedAt = new Date();
    this.revokedReason = reason;
  }
}
