import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import {
  BulkCreateUsersDto,
  BulkCreateUsersResponseDto,
  CreateUserDto,
} from './dto/create-user.dto';
import {
  AdminResetPasswordDto,
  AdminUpdateUserDto,
  ChangePasswordDto,
  UpdateUserDto,
} from './dto/update-user.dto';
import { DataSource, IsNull, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BulkCreateUsersProvider } from './providers/create-bulk-users.provider';
import {
  AuthProvider,
  DeactivationType,
  SubscriptionStatus,
  SubscriptionTier,
  UserRole,
} from 'src/common/enums/enums';
import {
  CreateUserResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { UserFilterDto } from './dto';
import { PaginatedResult } from 'src/common/pagination/pagination.interface';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { RegisterUserDto } from 'src/auth/dto/auth.dto';
import { HashProvider } from 'src/common/hash/providers/Hash.provider';
import { EmailVerificationProvider } from './providers/email-verification.provider';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { UserSettings } from './entities/user-settings.entity';
import { UserNotificationPreferences } from '../notifications/entities/user-notification-preferences.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { StudentProfile } from 'src/students/entities/student-profile.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly hashProvider: HashProvider,

    private readonly bulkCreateUserProvider: BulkCreateUsersProvider,

    private readonly paginationProvider: PaginationProvider,

    private readonly emailVerificationProvider: EmailVerificationProvider,

    private readonly mailService: MailService,

    private readonly configService: ConfigService,

    private readonly dataSource: DataSource,
  ) {}

  // FIND HELPERS — used internally + by AuthService
  // ══════════════════════════════════════════

  //  Default: does NOT select sensitive columns (passwordHash etc).
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async findActiveById(id: string): Promise<User> {
    const user = await this.findById(id);

    if (!user.isActive) {
      throw new BadRequestException('User account is inactive');
    }

    return user;
  }
  // This will be used  by auth service to verify email
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: this.normalizeEmail(email), deletedAt: IsNull() },
    });
  }

  /**
   * Find-or-create for OAuth login (Google/Facebook). Three cases:
   *  1. A user already exists with this provider ID (googleId/facebookId)
   *     — returning user, just fetch them.
   *  2. A user exists with this email but signed up locally — link the
   *     provider ID to their existing account rather than creating a
   *     duplicate. This means "Sign in with Google" using the same email
   *     as an existing password account just logs into that account.
   *  3. Brand new — create a user with a random, never-shared password
   *     hash (passwordHash is NOT NULL on the entity; OAuth users simply
   *     never use it — password login for this email will always fail
   *     the hash comparison, which is the correct behavior).
   */
  async findOrCreateFromOAuth(params: {
    provider: AuthProvider.GOOGLE | AuthProvider.FACEBOOK;
    providerId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  }): Promise<User> {
    const providerIdColumn =
      params.provider === AuthProvider.GOOGLE ? 'googleId' : 'facebookId';

    const existingByProviderId = await this.userRepository.findOne({
      where: {
        [providerIdColumn]: params.providerId,
        deletedAt: IsNull(),
      } as any,
    });
    if (existingByProviderId) return existingByProviderId;

    const existingByEmail = await this.findByEmail(params.email);
    if (existingByEmail) {
      (existingByEmail as any)[providerIdColumn] = params.providerId;
      return this.userRepository.save(existingByEmail);
    }

    const randomPasswordHash = await this.hashProvider.hashPassword(
      `oauth:${params.provider}:${crypto.randomUUID()}:${Date.now()}`,
    );

    const user = this.userRepository.create({
      email: this.normalizeEmail(params.email),
      firstName: params.firstName || 'User',
      lastName: params.lastName || '',
      passwordHash: randomPasswordHash,
      authProvider: params.provider,
      [providerIdColumn]: params.providerId,
      avatarUrl: params.avatarUrl ?? null,
      isEmailVerified: true, // the provider already verified this email
      role: UserRole.STUDENT,
    });

    return this.userRepository.save(user);
  }

  /**
   * Find user by email for auth purposes.
   * Selects passwordHash (excluded by default in other queries).
   * Returns null instead of throwing — caller decides how to handle.
   */
  async findSensitiveUserByEmail(email: string): Promise<User | null> {
    return this.securityUserQuery()
      .where('LOWER(user.email) = LOWER(:email)', {
        email: this.normalizeEmail(email),
      })
      .andWhere('user.deletedAt IS NULL')
      .andWhere('user.isActive = true')
      .getOne();
  }

  /**
   * Find by phone — for phone OTP login.
   */
  async findSensitiveUserByPhone(phone: string): Promise<User | null> {
    return this.securityUserQuery()
      .where('user.phoneNumber = :phone', {
        phone: this.normalizePhone(phone),
      })
      .andWhere('user.deletedAt IS NULL')
      .andWhere('user.isActive = true')
      .getOne();
  }

  //get profile
  async getProfile(id: string): Promise<User> {
    return this.findActiveById(id);
  }

  //update profile by user

  async updateProfile(
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.findActiveById(id);

    if (dto.phoneNumber !== undefined && dto.phoneNumber !== null) {
      const normalizedPhone = this.normalizePhone(dto.phoneNumber);
      await this.assertUniquePhone(normalizedPhone, id);
      user.phoneNumber = normalizedPhone;
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) user.lastName = dto.lastName.trim();
    if (dto.middleName !== undefined)
      user.middleName = dto.middleName?.trim() ?? null;
    if (dto.avatar !== undefined) user.avatarUrl = dto.avatar ?? null;
    if (dto.dateOfBirth !== undefined)
      user.dateOfBirth = dto.dateOfBirth ?? null;
    if (dto.stateOfResidence !== undefined)
      user.stateOfResidence = dto.stateOfResidence ?? null;
    if (dto.lga !== undefined) user.lga = dto.lga ?? null;
    if (dto.gender !== undefined) user.gender = dto.gender ?? null;
    if (dto.bio !== undefined) user.bio = dto.bio ?? null;

    const saved = await this.userRepository.save(user);

    return this.toUserDto(saved);
  }

  // Marks the post-verification onboarding wizard (personal + academic +
  // exam-goals steps on /complete-registration) as done. Idempotent — safe
  // to call even if already onboarded.
  async completeOnboarding(id: string): Promise<UserResponseDto> {
    const user = await this.findActiveById(id);
    user.completeOnboarding();
    const saved = await this.userRepository.save(user);
    return this.toUserDto(saved);
  }

  //change password
  async changePassword(
    id: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect([
        'user.passwordHash',
        'user.failedLoginAttempts',
        'user.lockedUntil',
      ])
      .where('user.id = :id', { id })
      .andWhere('user.deletedAt IS NULL')
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'This account uses social login. Use forgot password to create a password.',
      );
    }

    const isCorrect = await this.hashProvider.comparePassword(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCorrect) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const newPasswordHash = await this.hashProvider.hashPassword(
      dto.newPassword,
    );
    //call the change password method
    user.changePassword(newPasswordHash);
    await this.userRepository.save(user);
    this.logger.warn(
      `SECURITY: Password changed for user ${user.id}. Sessions revoked.`,
    );

    return {
      message:
        'Password changed successfully. Please log in again on all devices.',
    };
  }

  //DEACTIVATE
  async deactivate(
    id: string,
    type: DeactivationType,
    by?: string,
    reason?: string,
  ): Promise<{ message: string }> {
    const user = await this.findById(id);

    if (!user.isActive) {
      throw new ConflictException('Account is already deactivated');
    }

    user.deactivate(type, by, reason);

    await this.userRepository.save(user);

    this.logger.log(
      `User deactivated: ${id} | type: ${type} | by: ${by ?? 'system'} | reason: ${reason ?? 'N/A'}`,
    );

    return { message: 'Account deactivated successfully' };
  }
  // ADMIN — super admin operations
  // ══════════════════════════════════════════
  async adminCreateUser(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const normalizedPhone = dto.phoneNumber
      ? this.normalizePhone(dto.phoneNumber)
      : null;

    await this.assertUniqueEmail(normalizedEmail);

    if (normalizedPhone) {
      await this.assertUniquePhone(normalizedPhone);
    }

    const wasGenerated = !dto.password;
    const rawPassword = dto.password ?? this.generateTempPassword();
    const passwordHash = await this.hashProvider.hashPassword(rawPassword);

    let saved: User;
    try {
      saved = await this.dataSource.transaction(async (manager) => {
        const user = manager.create(User, {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          middleName: dto.middleName?.trim() ?? null,
          email: normalizedEmail,
          phoneNumber: normalizedPhone,
          avatarUrl: dto.avatar ?? null,
          dateOfBirth: dto.dateOfBirth ?? null,
          gender: dto.gender ?? null,
          stateOfResidence: dto.stateOfResidence ?? null,
          lga: dto.lga?.trim() ?? null,
          passwordHash,
          role: dto.role ?? UserRole.STUDENT,
          authProvider: AuthProvider.EMAIL,
          isEmailVerified: dto.skipEmailVerification === true,
          isActive: true,
        });

        const savedUser = await manager.save(User, user);

        await manager.save(
          UserSettings,
          manager.create(UserSettings, { user: savedUser }),
        );
        await manager.save(
          UserNotificationPreferences,
          manager.create(UserNotificationPreferences, { user: savedUser }),
        );
        await manager.save(
          Subscription,
          manager.create(Subscription, {
            user: savedUser,
            tier: SubscriptionTier.FREE,
            status: SubscriptionStatus.ACTIVE,
            startedAt: new Date(),
            expiresAt: null,
            autoRenew: false,
          }),
        );

        if (
          savedUser.role === UserRole.STUDENT ||
          savedUser.role === UserRole.PROFESSIONAL_STUDENT
        ) {
          await manager.save(
            StudentProfile,
            manager.create(StudentProfile, {
              user: savedUser,
              totalXp: 0,
              level: 1,
              levelTitle: 'Beginner',
              currentStreak: 0,
              longestStreak: 0,
            }),
          );
        }

        return savedUser;
      });
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(
          'User could not be created because email or phone already exists',
        );
      }
      throw error;
    }

    this.logger.warn(`ADMIN ACTION: User created ${saved.id} (${saved.email})`);

    // Admin-created accounts used to have no way out of this: unless
    // skipEmailVerification was explicitly passed, isEmailVerified stayed
    // false and no OTP/email was ever sent, so the user could never verify
    // and login() rejects unverified accounts. Close that dead end here,
    // the same way self-registration does — send a real OTP unless the
    // admin explicitly vouched for the email (skipEmailVerification) or
    // opted out of emailing this user at all (sendWelcomeEmail: false,
    // e.g. a silent import where the admin will hand over credentials
    // another way).
    let message: string | undefined;
    if (dto.sendWelcomeEmail !== false) {
      if (!saved.isEmailVerified) {
        await this.emailVerificationProvider.sendVerificationOtp(saved);
        message =
          'User created. A verification code has been emailed to them — they must verify before they can log in.';
      } else {
        this.mailService
          .sendWelcomeEmail(saved.email, {
            firstName: saved.firstName,
            dashboardUrl: `${this.configService.get('FRONTEND_URL')}/login`,
          })
          .catch((err) =>
            this.logger.error(
              `Welcome email failed for ${saved.email}: ${err.message}`,
            ),
          );
        message =
          'User created and marked as verified. A welcome email was sent.';
      }
    } else if (!saved.isEmailVerified) {
      message =
        'User created but not verified, and no email was sent (sendWelcomeEmail: false). ' +
        'They cannot log in until verified — resend a verification code or recreate with skipEmailVerification: true.';
    }

    return {
      user: this.toUserDto(saved),
      ...(wasGenerated && { temporaryPassword: rawPassword }),
      ...(message && { message }),
    };
  }
  // create bulk by admin
  async bulkCreateUsers(
    dto: BulkCreateUsersDto,
  ): Promise<BulkCreateUsersResponseDto> {
    return this.bulkCreateUserProvider.execute(dto);
  }

  async adminUpdateUser(
    id: string,
    dto: AdminUpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.findById(id);

    if (dto.email !== undefined) {
      const normalizedEmail = this.normalizeEmail(dto.email);
      await this.assertUniqueEmail(normalizedEmail, id);
      user.email = normalizedEmail;
    }

    if (dto.phoneNumber !== undefined && dto.phoneNumber !== null) {
      const normalizedPhone = this.normalizePhone(dto.phoneNumber);
      await this.assertUniquePhone(normalizedPhone, id);
      user.phoneNumber = normalizedPhone;
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) user.lastName = dto.lastName.trim();
    if (dto.middleName !== undefined)
      user.middleName = dto.middleName?.trim() ?? null;
    if (dto.avatar !== undefined) user.avatarUrl = dto.avatar ?? null;
    if (dto.dateOfBirth !== undefined)
      user.dateOfBirth = dto.dateOfBirth ?? null;
    if (dto.gender !== undefined) user.gender = dto.gender ?? null;
    if (dto.stateOfResidence !== undefined)
      user.stateOfResidence = dto.stateOfResidence ?? null;
    if (dto.lga !== undefined) user.lga = dto.lga ?? null;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.isEmailVerified !== undefined)
      user.isEmailVerified = dto.isEmailVerified;
    if (dto.isPhoneVerified !== undefined)
      user.isPhoneVerified = dto.isPhoneVerified;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    try {
      const saved = await this.userRepository.save(user);

      this.logger.warn(`ADMIN ACTION: User ${id} updated`);

      return this.toUserDto(saved);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Update violates unique user constraints');
      }
      throw error;
    }
  }

  //admin change passwod
  async adminResetPassword(
    id: string,
    dto: AdminResetPasswordDto,
  ): Promise<{ message: string; tempPassword?: string }> {
    const user = await this.findById(id);

    const rawPassword = dto.newPassword ?? this.generateTempPassword();
    const newPasswordHash = await this.hashProvider.hashPassword(rawPassword);

    // Force user to change on next login
    user.changePassword(newPasswordHash);

    await this.userRepository.save(user);
    this.logger.log(`Admin reset password for user ${id}`);

    if (dto.notifyUser !== false) {
      // NotificationsService handles the email — injected via event or direct call at controller level
      return {
        message: `Password reset. Notification queued for ${user.email}.`,
      };
    }

    // Return temp password only when notifyUser is false (admin sees it)
    return {
      message: 'Password reset successfully.',
      tempPassword: rawPassword,
    };
  }

  async findAll(query: UserFilterDto): Promise<PaginatedResult<User>> {
    const {
      role,
      state,
      gender,
      isActive,
      emailVerified,
      search,
      createdFrom,
      createdTo,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.deletedAt IS NULL');

    // ── Filters ────────────────────────────────────────────────────────────
    if (role) qb.andWhere('user.role = :role', { role });

    // NOTE: subscriptionTier filtering was removed here — the DTO/query
    // used to reference `user.subscriptionTier`, but that column doesn't
    // exist on the users table (subscription tier lives on the
    // Subscription entity, one-to-many per user). Passing this filter
    // previously threw a raw 500 from Postgres. A correct fix needs a
    // join plus a decision on what "current tier" means for a user with
    // subscription history (latest active? most recent regardless of
    // status?) — deferred rather than guessing at that business rule.

    if (state) qb.andWhere('user.stateOfResidence = :state', { state });

    if (gender) qb.andWhere('user.gender = :gender', { gender });

    if (isActive !== undefined)
      qb.andWhere('user.isActive = :isActive', { isActive });

    if (emailVerified !== undefined)
      qb.andWhere('user.isEmailVerified = :emailVerified', { emailVerified });
    if (search) {
      qb.andWhere(
        `(
          user.firstName ILIKE :s OR
          user.lastName  ILIKE :s OR
          user.email     ILIKE :s OR
          user.phoneNumber ILIKE :s  
        )`,
        { s: `%${search}%` },
      );
    }

    if (createdFrom)
      qb.andWhere('user.createdAt >= :createdFrom', {
        createdFrom: new Date(createdFrom),
      });

    if (createdTo)
      qb.andWhere('user.createdAt <= :createdTo', {
        createdTo: new Date(createdTo),
      });

    // ── Sort ───────────────────────────────────────────────────────────────
    const sortableFields: Record<string, string> = {
      createdAt: 'user.createdAt',
      firstName: 'user.firstName',
      lastName: 'user.lastName',
      email: 'user.email',
    };

    const orderField = sortableFields[sortBy] ?? 'user.createdAt';
    qb.orderBy(orderField, sortOrder);

    // ── Paginate ───────────────────────────────────────────────────────────
    return this.paginationProvider.paginateQueryBuilder(qb, {
      page: query.page,
      limit: query.limit,
    });
  }
  private generateTempPassword(): string {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    const random = Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');
    return `Gravitest@${year}${random}`;
  }
  private normalizePhone(phone: string): string {
    if (!phone) return '';
    // Example: Standardizing Nigerian numbers to 234 format
    let cleaned = phone.replace(/\D/g, ''); // Remove all non-digits
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = '234' + cleaned.substring(1);
    }
    return cleaned;
  }
  private async assertUniqueEmail(
    email: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.userRepository
      .createQueryBuilder('u')
      .where('LOWER(u.email) = LOWER(:email)', { email });

    if (excludeId) qb.andWhere('u.id != :id', { id: excludeId });

    const existing = await qb.getOne();

    if (existing) {
      throw new ConflictException(`Email ${email} is already in use`);
    }
  }

  private async assertUniquePhone(
    phone: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.userRepository
      .createQueryBuilder('u')
      .where('u.phoneNumber = :phone', { phone });

    if (excludeId) qb.andWhere('u.id != :id', { id: excludeId });

    const existing = await qb.getOne();

    if (existing) {
      throw new ConflictException(`Phone number ${phone} is already in use`);
    }
  }

  private toUserDto(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }
  private securityUserQuery() {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect([
        'user.passwordHash',
        'user.twoFactorSecret',
        'user.twoFactorEnabled',
        'user.failedLoginAttempts',
        'user.lockedUntil',
        'user.newEmailPending',
      ]);
  }

  //for save to user repository
  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
