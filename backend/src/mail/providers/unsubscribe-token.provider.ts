import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as crypto from 'crypto';
import jwtConfig from 'src/auth/config/jwtConfig';

// Stateless, one-click unsubscribe tokens — no new DB column or table
// needed. The token is just the userId plus an HMAC over it, so
// verifying only requires recomputing the HMAC and comparing; there's
// nothing to look up or expire. Reuses the refresh-token secret (a
// long-lived secret already configured) since these links should stay
// valid indefinitely, unlike short-lived access tokens.
@Injectable()
export class UnsubscribeTokenProvider {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConf: ConfigType<typeof jwtConfig>,
  ) {}

  generate(userId: string): string {
    const sig = this.sign(userId);
    return `${Buffer.from(userId).toString('base64url')}.${sig}`;
  }

  // Returns the userId if the token is valid, otherwise null.
  verify(token: string): string | null {
    const [encodedUserId, sig] = token.split('.');
    if (!encodedUserId || !sig) return null;

    let userId: string;
    try {
      userId = Buffer.from(encodedUserId, 'base64url').toString('utf8');
    } catch {
      return null;
    }

    const expected = this.sign(userId);
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    return userId;
  }

  private sign(userId: string): string {
    return crypto
      .createHmac('sha256', this.jwtConf.refreshSecret)
      .update(userId)
      .digest('base64url');
  }
}
