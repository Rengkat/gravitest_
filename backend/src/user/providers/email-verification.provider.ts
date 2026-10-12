import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Otp } from 'src/auth/entities/otp.entity';
import { OtpProvider } from 'src/auth/providers/otp.provider';
import { OtpPurpose } from 'src/common/enums/enums';
import { MailService } from 'src/mail/mail.service';
import { User } from '../entities/user.entity';

/**
 * Issues + emails an EMAIL_VERIFICATION OTP for a user.
 *
 * This intentionally mirrors AuthService's private `issueOtpAndDispatch`
 * (see src/auth/auth.service.ts) rather than calling it directly: AuthModule
 * already imports UserModule, so UserModule importing AuthModule back would
 * create a circular module dependency. If that ever gets untangled (e.g. by
 * pulling OTP issuance into its own module), this duplication can go away.
 */
@Injectable()
export class EmailVerificationProvider {
  private readonly logger = new Logger(EmailVerificationProvider.name);
  private readonly isDev: boolean;

  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly otpProvider: OtpProvider,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.isDev = this.configService.get('NODE_ENV') === 'development';
  }

  /**
   * Revokes any live EMAIL_VERIFICATION OTPs for the user, issues a fresh
   * one, and emails it. Returns the plain code only in development (same
   * convention as AuthService.register), so it can be surfaced for testing
   * without ever logging/returning it in production.
   */
  async sendVerificationOtp(user: User): Promise<string | undefined> {
    await this.otpRepository
      .createQueryBuilder()
      .update(Otp)
      .set({ revokedAt: new Date() })
      .where('"userId" = :userId', { userId: user.id })
      .andWhere('purpose = :purpose', { purpose: OtpPurpose.EMAIL_VERIFICATION })
      .andWhere('"usedAt" IS NULL')
      .andWhere('"revokedAt" IS NULL')
      .execute();

    const otpBundle = this.otpProvider.generate();

    const otp = this.otpRepository.create({
      userId: user.id,
      purpose: OtpPurpose.EMAIL_VERIFICATION,
      codeHash: otpBundle.codeHash,
      expiresAt: otpBundle.expiresAt,
      createdAt: new Date(),
      sentAt: new Date(),
      channel: 'email',
      target: user.email,
    });
    await this.otpRepository.save(otp);

    const expiryMinutes = Math.round(
      (otpBundle.expiresAt.getTime() - Date.now()) / 1000 / 60,
    );

    try {
      await this.mailService.sendEmailVerificationOtp(user.email, {
        firstName: user.firstName,
        otpCode: otpBundle.plainCode,
        expiryMinutes,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to send verification OTP to ${user.email}: ${error?.message}`,
      );
    }

    if (this.isDev) {
      this.logger.warn(
        `[DEV OTP] EMAIL_VERIFICATION for ${user.email}: ${otpBundle.plainCode}`,
      );
      return otpBundle.plainCode;
    }

    return undefined;
  }
}
