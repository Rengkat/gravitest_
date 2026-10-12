import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

import type { StudentProfile } from '../../students/entities/student-profile.entity';

import {
  AuthProvider,
  DeactivationType,
  Gender,
  NigerianState,
  UserRole,
} from 'src/common/enums/enums';
import { UserSettings } from './user-settings.entity';
import { UserNotificationPreferences } from '../../notifications/entities/user-notification-preferences.entity';
import { Otp } from 'src/auth/entities/otp.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { UserSession } from 'src/auth/entities/user-session.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';

@Entity('users')
@Index(['email'], { unique: true, where: '"email" IS NOT NULL' })
@Index(['phoneNumber'], { unique: true, where: '"phone_number" IS NOT NULL' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ── Personal Info ──────────────────────────────────────────
  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  middleName: string | null;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: true,
    name: 'phone_number',
  })
  phoneNumber: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender | null;

  @Column({ type: 'enum', enum: NigerianState, nullable: true })
  stateOfResidence: NigerianState | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lga: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  // ── Auth ───────────────────────────────────────────────────
  @Column({ type: 'varchar', select: false })
  @Exclude()
  passwordHash!: string;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.EMAIL })
  authProvider!: AuthProvider;

  @Column({ type: 'varchar', nullable: true, select: false })
  @Exclude()
  googleId: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  @Exclude()
  facebookId: string | null;

  // ── Two-Factor Auth ────────────────────────────────────────
  @Column({ type: 'varchar', nullable: true, select: false })
  @Exclude()
  twoFactorSecret: string | null;

  @Column({ type: 'boolean', default: false, select: false })
  @Exclude()
  twoFactorEnabled!: boolean;

  // ── Account Locking ────────────────────────────────────────
  @Column({ type: 'int', default: 0, select: false })
  @Exclude()
  failedLoginAttempts!: number;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  @Exclude()
  lockedUntil: Date | null;

  // ── Pending Email Change ───────────────────────────────────
  @Column({ type: 'varchar', nullable: true, select: false })
  @Exclude()
  newEmailPending: string | null;

  // ── Role & Status ──────────────────────────────────────────
  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role!: UserRole;

  @Column({ type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({ type: 'boolean', default: false })
  isPhoneVerified!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isOnboarded!: boolean; // Completed onboarding wizard?

  // ── Login Tracking ─────────────────────────────────────────
  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'int', default: 0 })
  totalLoginCount!: number;

  // ── Referral ───────────────────────────────────────────────
  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  referralCode: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  referredByCode: string | null;

  // ── Deactivation ───────────────────────────────────────────
  @Column({ type: 'timestamptz', nullable: true })
  deactivatedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  deactivatedBy: string | null;

  @Column({ type: 'text', nullable: true })
  deactivationReason: string | null;

  @Column({ type: 'enum', enum: DeactivationType, nullable: true })
  deactivationType: DeactivationType | null;

  // ── Soft Delete ────────────────────────────────────────────
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  deletedBy: string | null;

  @Column({ type: 'text', nullable: true })
  deletionReason: string | null;

  // ── Timestamps ─────────────────────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ── Relations (all nullable — profile created in same transaction) ──
  @OneToOne('StudentProfile', (p: StudentProfile) => p.user, { nullable: true })
  studentProfile: StudentProfile | null;

  @OneToMany('Notification', (n: Notification) => n.user)
  notifications: Notification[];

  @OneToOne(
    'UserNotificationPreferences',
    (n: UserNotificationPreferences) => n.user,
  )
  notificationPreferences: UserNotificationPreferences | null;
  @OneToOne(() => UserSettings, (s) => s.user, { nullable: true })
  settings: UserSettings | null;

  @OneToMany(() => Subscription, (s) => s.user)
  subscriptions: Subscription[];

  @OneToMany('UserSession', (s: UserSession) => s.user)
  sessions: UserSession[];

  @OneToMany('Otp', (o: Otp) => o.user)
  otps: Otp[];

  // @OneToMany('AiChatSession', (s: AiChatSession) => s.user)
  // aiChatSessions: AiChatSession[];

  // @OneToMany('Payment', (p: Payment) => p.user)
  // payments: Payment[];

  // ── Computed ───────────────────────────────────────────────
  @Expose()
  get fullName(): string {
    return [this.firstName, this.middleName, this.lastName]
      .filter(Boolean)
      .join(' ');
  }

  @Expose()
  get age(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const dob = new Date(this.dateOfBirth);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }

  // ── Domain Methods ─────────────────────────────────────────
  isAccountLocked(): boolean {
    return !!this.lockedUntil && new Date() < this.lockedUntil;
  }

  incrementFailedLoginAttempts(maxAttempts = 5, lockMinutes = 15): void {
    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= maxAttempts) {
      this.lockedUntil = new Date(Date.now() + lockMinutes * 60_000);
    }
  }

  resetFailedLoginAttempts(): void {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
  }

  recordSuccessfulLogin(): void {
    this.lastLoginAt = new Date();
    this.totalLoginCount += 1;
    this.resetFailedLoginAttempts();
  }

  markEmailVerified(): void {
    this.isEmailVerified = true;
  }
  markPhoneVerified(): void {
    this.isPhoneVerified = true;
  }

  changePassword(newHash: string): void {
    this.passwordHash = newHash;
    this.resetFailedLoginAttempts();
    this.lockedUntil = null;
  }

  deactivate(type: DeactivationType, by?: string, reason?: string): void {
    this.isActive = false;
    this.deactivatedAt = new Date();
    this.deactivatedBy = by ?? null;
    this.deactivationReason = reason ?? null;
    this.deactivationType = type;
    this.resetFailedLoginAttempts();
  }

  softDelete(by: string, reason?: string): void {
    this.deletedAt = new Date();
    this.deletedBy = by;
    this.deletionReason = reason ?? null;
    this.isActive = false;
    this.resetFailedLoginAttempts();
  }

  restore(): void {
    this.deletedAt = null;
    this.deletedBy = null;
    this.deletionReason = null;
    this.deactivatedAt = null;
    this.deactivatedBy = null;
    this.deactivationReason = null;
    this.deactivationType = null;
    this.isActive = true;
  }

  scheduleEmailChange(newEmail: string): void {
    this.newEmailPending = newEmail.toLowerCase().trim();
    this.isEmailVerified = false;
  }

  completeEmailChange(): void {
    if (!this.newEmailPending) throw new Error('No pending email change');
    this.email = this.newEmailPending;
    this.newEmailPending = null;
    this.isEmailVerified = true;
  }

  enableTwoFactor(secret: string): void {
    this.twoFactorSecret = secret;
    this.twoFactorEnabled = true;
  }

  disableTwoFactor(): void {
    this.twoFactorSecret = null;
    this.twoFactorEnabled = false;
  }

  completeOnboarding(): void {
    this.isOnboarded = true;
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail(): void {
    if (this.email) this.email = this.email.toLowerCase().trim();
    if (this.newEmailPending)
      this.newEmailPending = this.newEmailPending.toLowerCase().trim();
  }
}
