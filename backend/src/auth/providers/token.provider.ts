import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import * as crypto from 'crypto';
import jwtConfig from '../config/jwtConfig';
import {
  JwtAccessPayload,
  JwtRefreshPayload,
} from '../interfaces/jwt-payload.interface';
import { UserRole } from 'src/common/enums/enums';
import { TokenBundle } from '../interfaces/token-bundle.interface';

@Injectable()
export class TokenProvider {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConf: ConfigType<typeof jwtConfig>,
  ) {}

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  /**
   * Issue a brand-new access + refresh pair for a user.
   * Call this on login or after successful refresh rotation.
   */
  async generateTokenBundle(
    userId: string,
    role: UserRole,
  ): Promise<TokenBundle> {
    const jti = this.generateJti();

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccess(userId, role, jti),
      this.signRefresh(userId, jti),
    ]);

    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const refreshExpiresAt = new Date(
      Date.now() + this.jwtConf.refreshTokenTtl * 1000,
    );

    return {
      accessToken,
      refreshToken,
      jti,
      refreshTokenHash,
      refreshExpiresAt,
      expiresIn: this.jwtConf.accessTokenTtl,
    };
  }

  /**
   * Hash a raw refresh token for storage / comparison.
   * Uses SHA-256 (the refresh token itself is a signed JWT, so
   */
  hashRefreshToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Compare a raw incoming refresh token against a stored hash.
   */
  refreshTokenMatches(rawToken: string, storedHash: string): boolean {
    return this.hashRefreshToken(rawToken) === storedHash;
  }

  /**
   * Generate a cryptographically random session JTI.
   */
  generateJti(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  private signAccess(
    userId: string,
    role: UserRole,
    jti: string,
  ): Promise<string> {
    const payload: Omit<JwtAccessPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
      sub: userId,
      role,
      jti,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.jwtConf.accessSecret,
      expiresIn: this.jwtConf.accessTokenTtl,
      issuer: this.jwtConf.issuer,
      audience: this.jwtConf.audience,
    });
  }

  private signRefresh(userId: string, jti: string): Promise<string> {
    const payload: Omit<JwtRefreshPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
      sub: userId,
      jti,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.jwtConf.refreshSecret,
      expiresIn: this.jwtConf.refreshTokenTtl,
      issuer: this.jwtConf.issuer,
      audience: this.jwtConf.audience,
    });
  }
}
