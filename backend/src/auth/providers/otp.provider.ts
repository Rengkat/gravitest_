import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const RESEND_INTERVAL_SECONDS = 60;

export interface OtpBundle {
  plainCode: string;
  codeHash: string;
  expiresAt: Date;
}

@Injectable()
export class OtpProvider {
  /**
   * Generate numeric OTP + hashed storage value.
   */
  generate(): OtpBundle {
    const plainCode = crypto
      .randomInt(0, 10 ** OTP_LENGTH)
      .toString()
      .padStart(OTP_LENGTH, '0');

    const codeHash = this.hashCode(plainCode);

    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    return {
      plainCode,
      codeHash,
      expiresAt,
    };
  }

  /**
   * One-way hash for DB storage.
   */
  hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Compare plain incoming code with stored hash.
   */
  matches(plainCode: string, storedHash: string): boolean {
    return this.hashCode(plainCode) === storedHash;
  }

  /**
   * Expiration check.
   */
  isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Max attempt check.
   */
  isMaxAttemptsReached(attempts: number): boolean {
    return attempts >= MAX_OTP_ATTEMPTS;
  }

  /**
   * Resend throttle check.
   */
  canResend(lastCreatedAt: Date | null): boolean {
    if (!lastCreatedAt) return true;

    const secondsPassed = (Date.now() - lastCreatedAt.getTime()) / 1000;

    return secondsPassed >= RESEND_INTERVAL_SECONDS;
  }
}
