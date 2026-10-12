import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';

import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { Otp } from './entities/otp.entity';
import { OtpProvider } from './providers/otp.provider';
import { TokenProvider } from './providers/token.provider';
import { SessionRevokeReason } from './entities/user-session.entity';
import { MailService } from 'src/mail/mail.service';

import {
  AuthResponseDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterResponseDto,
  RegisterUserDto,
  ResendVerificationDto,
  ResetPasswordDto,
  TokensDto,
  VerifyEmailOtpDto,
} from './dto/auth.dto';
import { UserResponseDto } from 'src/user/dto/user-response.dto';

import {
  OtpPurpose,
  AdminAlertPriority,
  AdminAlertType,
  AuthProvider,
} from 'src/common/enums/enums';
import { SessionService } from './session.service';
import { HashProvider } from 'src/common/hash/providers/Hash.provider';
import { UserRegistrationProvider } from 'src/user/providers/create-user.provider';
import { AdminAlertsService } from 'src/admin-alerts/admin-alerts.service';
import { SocialProfile } from './interfaces/social profile.interface';

// ─── Helpers to extract request metadata ────────────────────────────────────

function extractIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (typeof forwarded === 'string' ? forwarded : forwarded[0])
      .split(',')[0]
      .trim();
  }
  return req.ip ?? null;
}

function extractUserAgent(req: Request): string | null {
  return req.headers['user-agent'] ?? null;
}

// ─── Refresh token body shape (from JwtRefreshStrategy.validate) ─────────────

export class RefreshTokenContext {
  userId: string;
  jti: string;
  rawToken: string;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly isDev: boolean;

  /**
   * Constant-time dummy hash prevents timing attacks on the login endpoint
   * when a user does not exist (avoids "user not found" being faster than
   * "wrong password").
   */
  private static readonly DUMMY_PASSWORD_HASH =
    '$2b$12$C6UzMDM.H6dfI/f/IKxGhuJ8eWQ4P1Q0N9l8o0L8pQx5V6m7n8y9K';

  constructor(
    private readonly userService: UserService,
    private readonly userRegistrationProvider: UserRegistrationProvider,
    private readonly otpProvider: OtpProvider,
    private readonly hashProvider: HashProvider,
    private readonly tokenProvider: TokenProvider,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly adminAlertsService: AdminAlertsService,

    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
  ) {
    this.isDev = this.configService.get('NODE_ENV') === 'development';
  }

  // ===================================================
  // REGISTER
  // ===================================================

  async register(dto: RegisterUserDto): Promise<RegisterResponseDto> {
    const user = await this.userRegistrationProvider.registerUser(dto);

    const plainOtp = await this.issueOtpAndDispatch(
      user,
      OtpPurpose.EMAIL_VERIFICATION,
    );

    this.adminAlertsService
      .raise({
        type: AdminAlertType.USER_SIGNUP,
        title: 'New user signed up',
        body: `${user.email} just created an account (${user.role}).`,
        priority: AdminAlertPriority.LOW,
        actionUrl: `/admin/users/${user.id}`,
        metadata: { userId: user.id, email: user.email, role: user.role },
      })
      .catch((err) =>
        this.logger.error(`user_signup admin alert failed: ${err.message}`),
      );

    return {
      message:
        'Account created successfully. A verification code has been sent to your email.',
      ...(this.isDev && { devOtp: plainOtp }),
    };
  }

  // ===================================================
  // LOGIN
  // ===================================================

  async login(dto: LoginDto, req: Request): Promise<AuthResponseDto> {
    const user = await this.userService.findSensitiveUserByEmail(dto.email);
    const passwordHash = user?.passwordHash ?? AuthService.DUMMY_PASSWORD_HASH;

    const isPasswordValid = await this.hashProvider.comparePassword(
      dto.password,
      passwordHash,
    );

    if (!user || !isPasswordValid) {
      if (user && !user.isAccountLocked()) {
        user.incrementFailedLoginAttempts();
        await this.userService.save(user);

        if (user.isAccountLocked()) {
          this.adminAlertsService
            .raise({
              type: AdminAlertType.FRAUD_ALERT,
              title: 'Account locked after repeated failed logins',
              body: `${user.email} was locked out until ${user.lockedUntil?.toLocaleString()} after too many failed login attempts. Could be the account owner or a credential-stuffing attempt.`,
              priority: AdminAlertPriority.HIGH,
              actionUrl: `/admin/users/${user.id}`,
              metadata: { userId: user.id, email: user.email },
            })
            .catch((err) =>
              this.logger.error(
                `fraud_alert admin alert failed: ${err.message}`,
              ),
            );
        }
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isAccountLocked()) {
      await this.safeSendAccountLockedEmail(user);
      throw new ForbiddenException(
        `Account locked until ${user.lockedUntil?.toLocaleTimeString()}`,
      );
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Email not verified. Please verify your email first.',
      );
    }

    user.recordSuccessfulLogin();
    await this.userService.save(user);

    // Issue real tokens and persist the session
    const tokenBundle = await this.tokenProvider.generateTokenBundle(
      user.id,
      user.role,
    );

    await this.sessionService.create({
      userId: user.id,
      jti: tokenBundle.jti,
      refreshTokenHash: tokenBundle.refreshTokenHash,
      refreshExpiresAt: tokenBundle.refreshExpiresAt,
      ipAddress: extractIp(req),
      userAgent: extractUserAgent(req),
      deviceId: dto.deviceId ?? null,
      deviceName: dto.deviceName ?? null,
    });

    this.logger.log(`User ${user.id} logged in from ${extractIp(req)}`);

    return this.buildAuthResponse(user, {
      accessToken: tokenBundle.accessToken,
      refreshToken: tokenBundle.refreshToken,
      expiresIn: tokenBundle.expiresIn,
    });
  }

  // ===================================================
  // SOCIAL LOGIN (Google / Facebook)
  // ===================================================

  /**
   * Called from the OAuth callback routes after Passport has already
   * verified the provider's identity — this just needs to find-or-create
   * the local User and issue the same kind of token bundle as password
   * login. No password check, no OTP/email-verification gate (the
   * provider already verified the email).
   */
  async handleSocialLogin(
    profile: SocialProfile,
    req: Request,
  ): Promise<AuthResponseDto> {
    if (!profile.email) {
      throw new BadRequestException(
        `Your ${profile.provider} account didn't share an email address, so we can't sign you in. Please allow email access and try again.`,
      );
    }

    const user = await this.userService.findOrCreateFromOAuth({
      provider:
        profile.provider === 'google'
          ? AuthProvider.GOOGLE
          : AuthProvider.FACEBOOK,
      providerId: profile.providerId,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
    });

    if (user.isAccountLocked()) {
      throw new ForbiddenException(
        `Account locked until ${user.lockedUntil?.toLocaleTimeString()}`,
      );
    }
    if (!user.isActive) {
      throw new ForbiddenException('This account has been deactivated.');
    }

    user.recordSuccessfulLogin();
    await this.userService.save(user);

    const tokenBundle = await this.tokenProvider.generateTokenBundle(
      user.id,
      user.role,
    );

    await this.sessionService.create({
      userId: user.id,
      jti: tokenBundle.jti,
      refreshTokenHash: tokenBundle.refreshTokenHash,
      refreshExpiresAt: tokenBundle.refreshExpiresAt,
      ipAddress: extractIp(req),
      userAgent: extractUserAgent(req),
      deviceId: null,
      deviceName: `${profile.provider} sign-in`,
    });

    this.logger.log(
      `User ${user.id} logged in via ${profile.provider} from ${extractIp(req)}`,
    );

    return this.buildAuthResponse(user, {
      accessToken: tokenBundle.accessToken,
      refreshToken: tokenBundle.refreshToken,
      expiresIn: tokenBundle.expiresIn,
    });
  }

  // ===================================================
  // REFRESH TOKEN  (rotate — old token is consumed)
  // ===================================================

  /**
   * Called by the refresh endpoint, guarded by JwtRefreshGuard.
   * `ctx` comes from JwtRefreshStrategy.validate().
   */
  async refreshTokens(
    ctx: RefreshTokenContext,
    req: Request,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    // Validate hash, detect reuse attacks, revoke old session
    const oldSession = await this.sessionService.validateAndConsume(
      ctx.jti,
      ctx.rawToken,
    );

    const user = await this.userService.findActiveById(oldSession.userId);

    // Generate a new token pair with a fresh JTI (full rotation)
    const tokenBundle = await this.tokenProvider.generateTokenBundle(
      user.id,
      user.role,
    );

    // Persist the new session, inheriting device metadata from the old one
    await this.sessionService.create({
      userId: user.id,
      jti: tokenBundle.jti,
      refreshTokenHash: tokenBundle.refreshTokenHash,
      refreshExpiresAt: tokenBundle.refreshExpiresAt,
      ipAddress: extractIp(req),
      userAgent: extractUserAgent(req),
      deviceId: oldSession.deviceId,
      deviceName: oldSession.deviceName,
    });

    return {
      accessToken: tokenBundle.accessToken,
      refreshToken: tokenBundle.refreshToken,
      expiresIn: tokenBundle.expiresIn,
    };
  }

  // ===================================================
  // LOGOUT  (single session)
  // ===================================================

  /**
   * Revokes the session that matches the JTI embedded in the current
   * access token.  The JTI is injected by JwtAccessStrategy.validate().
   */
  async logout(userId: string, jti: string): Promise<{ message: string }> {
    await this.sessionService.revokeByJti(jti, SessionRevokeReason.LOGOUT);
    this.logger.log(`User ${userId} logged out (JTI: ${jti})`);
    return { message: 'Logged out successfully' };
  }

  // ===================================================
  // LOGOUT ALL  (all sessions — e.g. "sign out everywhere")
  // ===================================================

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.sessionService.revokeAll(userId, SessionRevokeReason.LOGOUT_ALL);
    this.logger.log(`User ${userId} signed out of all sessions`);
    return { message: 'Signed out of all devices successfully' };
  }

  // ===================================================
  // VERIFY EMAIL
  // ===================================================

  async verifyEmail(dto: VerifyEmailOtpDto): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user || user.isEmailVerified) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.validateOtpOrThrow(
      user.id,
      OtpPurpose.EMAIL_VERIFICATION,
      dto.code,
    );

    user.markEmailVerified();
    await this.userService.save(user);

    await this.mailService.sendWelcomeEmail(user.email, {
      firstName: user.firstName,
      dashboardUrl: `${this.configService.get('FRONTEND_URL')}/dashboard`,
    });

    return { message: 'Email verified successfully' };
  }

  // ===================================================
  // RESEND EMAIL VERIFICATION OTP
  // ===================================================

  async sendEmailVerificationOtp(
    dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(dto.email);
    // console.log(user);
    if (!user || !user.isActive) {
      return {
        message:
          'If the email exists in our system, a verification code has been sent.',
      };
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified.' };
    }

    await this.enforceOtpResendCooldown(user.id, OtpPurpose.EMAIL_VERIFICATION);
    await this.issueOtpAndDispatch(user, OtpPurpose.EMAIL_VERIFICATION);

    return { message: 'Verification code sent successfully.' };
  }

  // ===================================================
  // FORGOT PASSWORD
  // ===================================================

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userService.findSensitiveUserByEmail(dto.email);

    const response = {
      message:
        'If the email exists in our system, a verification code has been sent.',
    };

    if (!user || !user.isActive || user.isAccountLocked()) {
      return response;
    }

    await this.enforceOtpResendCooldown(user.id, OtpPurpose.PASSWORD_RESET);
    await this.issueOtpAndDispatch(user, OtpPurpose.PASSWORD_RESET);

    return response;
  }

  // ===================================================
  // RESET PASSWORD
  // ===================================================

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.userService.findSensitiveUserByEmail(dto.email);

    if (!user || !user.isActive) {
      throw new BadRequestException('Invalid email or OTP');
    }

    await this.validateOtpOrThrow(user.id, OtpPurpose.PASSWORD_RESET, dto.code);

    const passwordHash = await this.hashProvider.hashPassword(dto.newPassword);
    user.changePassword(passwordHash);
    await this.userService.save(user);

    // Revoke ALL sessions — password change is a security event
    await this.sessionService.revokeAll(
      user.id,
      SessionRevokeReason.SECURITY_REVOKED,
    );

    await this.safeSendPasswordChangedEmail(user);

    return { message: 'Password reset successful. Please log in again.' };
  }

  // ===================================================
  // GET PROFILE
  // ===================================================

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(userId);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  // ===================================================
  // OTP — CORE (private)
  // ===================================================

  private async issueOtpAndDispatch(
    user: User,
    purpose: OtpPurpose,
  ): Promise<string> {
    await this.revokeActiveOtps(user.id, purpose);

    const otpBundle = this.otpProvider.generate();

    const otp = this.otpRepository.create({
      userId: user.id,
      purpose,
      codeHash: otpBundle.codeHash,
      expiresAt: otpBundle.expiresAt,
      createdAt: new Date(),
      sentAt: new Date(),
      channel: 'email',
      target: user.email,
    });

    await this.otpRepository.save(otp);

    try {
      await this.dispatchOtpMail(
        user,
        purpose,
        otpBundle.plainCode,
        otp.expiresAt,
      );
    } catch (err) {
      this.logger.error('OTP email dispatch failed', err);
    }

    if (this.isDev) {
      this.logger.warn(
        `[DEV OTP] ${purpose} for ${user.email}: ${otpBundle.plainCode}`,
      );
    }

    return otpBundle.plainCode;
  }

  private async dispatchOtpMail(
    user: User,
    purpose: OtpPurpose,
    plainCode: string,
    expiresAt: Date,
  ): Promise<void> {
    const expiryMinutes = Math.round(
      (expiresAt.getTime() - Date.now()) / 1000 / 60,
    );

    switch (purpose) {
      case OtpPurpose.EMAIL_VERIFICATION:
        await this.mailService.sendEmailVerificationOtp(user.email, {
          firstName: user.firstName,
          otpCode: plainCode,
          expiryMinutes,
        });
        break;

      case OtpPurpose.PASSWORD_RESET:
        await this.mailService.sendPasswordResetOtp(user.email, {
          firstName: user.firstName,
          otpCode: plainCode,
          expiryMinutes,
        });
        break;

      case OtpPurpose.TWO_FACTOR_AUTH:
        await this.mailService.sendTwoFactorCode(user.email, {
          firstName: user.firstName,
          otpCode: plainCode,
          expiryMinutes,
        });
        break;
    }
  }

  // ===================================================
  // SAFE EMAILS (fire-and-forget, never throw)
  // ===================================================

  private async safeSendPasswordChangedEmail(user: User): Promise<void> {
    try {
      await this.mailService.sendPasswordChangedAlert(user.email, {
        firstName: user.firstName,
        changedAt: new Date().toISOString(),
        securityUrl: `${this.configService.get('FRONTEND_URL')}/security`,
      });
    } catch {}
  }

  private async safeSendAccountLockedEmail(user: User): Promise<void> {
    try {
      await this.mailService.sendAccountLockedEmail(user.email, {
        firstName: user.firstName,
        reason: 'Multiple failed login attempts',
        resetUrl: `${this.configService.get('FRONTEND_URL')}/forgot-password`,
      });
    } catch {}
  }

  // ===================================================
  // OTP VALIDATION (private)
  // ===================================================

  private async validateOtpOrThrow(
    userId: string,
    purpose: OtpPurpose,
    plainCode: string,
  ): Promise<void> {
    const otp = await this.getLatestActiveOtp(userId, purpose);
    if (!otp || !otp.canBeValidated()) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const isValid = this.otpProvider.matches(plainCode, otp.codeHash);

    if (!isValid) {
      otp.incrementAttempts();
      await this.otpRepository.save(otp);
      throw new BadRequestException('Invalid or expired verification code');
    }

    otp.markUsed();
    await this.otpRepository.save(otp);
  }

  private async enforceOtpResendCooldown(
    userId: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    const latestOtp = await this.getLatestActiveOtp(userId, purpose);

    if (latestOtp && !this.otpProvider.canResend(latestOtp.createdAt)) {
      throw new BadRequestException(
        'Please wait a minute before requesting another code.',
      );
    }
  }

  private async revokeActiveOtps(
    userId: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    await this.otpRepository
      .createQueryBuilder()
      .update(Otp)
      .set({ revokedAt: new Date() })
      .where('"userId" = :userId', { userId })
      .andWhere('purpose = :purpose', { purpose })
      .andWhere('"usedAt" IS NULL')
      .andWhere('"revokedAt" IS NULL')
      .execute();
  }

  private async getLatestActiveOtp(
    userId: string,
    purpose: OtpPurpose,
  ): Promise<Otp | null> {
    return this.otpRepository
      .createQueryBuilder('otp')
      .addSelect('otp.codeHash')
      .where('otp.userId = :userId', { userId })
      .andWhere('otp.purpose = :purpose', { purpose })
      .andWhere('otp.usedAt IS NULL')
      .andWhere('otp.revokedAt IS NULL')
      .orderBy('otp.createdAt', 'DESC')
      .getOne();
  }

  // ===================================================
  // RESPONSE BUILDER
  // ===================================================

  /**
   * Issue a fresh token bundle + persisted session for a user we've
   * already authenticated some other way than password login — e.g.
   * right after an admin invite is accepted. Mirrors the tail end of
   * login()/handleSocialLogin() so all three issue sessions identically.
   */
  async issueSession(user: User, req: Request): Promise<AuthResponseDto> {
    const tokenBundle = await this.tokenProvider.generateTokenBundle(
      user.id,
      user.role,
    );

    await this.sessionService.create({
      userId: user.id,
      jti: tokenBundle.jti,
      refreshTokenHash: tokenBundle.refreshTokenHash,
      refreshExpiresAt: tokenBundle.refreshExpiresAt,
      ipAddress: extractIp(req),
      userAgent: extractUserAgent(req),
      deviceId: null,
      deviceName: null,
    });

    return this.buildAuthResponse(user, {
      accessToken: tokenBundle.accessToken,
      refreshToken: tokenBundle.refreshToken,
      expiresIn: tokenBundle.expiresIn,
    });
  }

  private buildAuthResponse(user: User, tokens: TokensDto): AuthResponseDto {
    return {
      user: plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true,
      }),
      tokens,
    };
  }
}
