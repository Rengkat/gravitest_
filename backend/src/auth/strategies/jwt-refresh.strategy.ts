import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import { Request } from 'express';

import { JwtRefreshPayload } from '../interfaces/jwt-payload.interface';
import jwtConfig from '../config/jwtConfig';

// Refresh tokens arrive in the request BODY, not the Authorization header.
// This keeps them out of server logs and is safe even on mobile clients.
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConf: ConfigType<typeof jwtConfig>,
  ) {
    super({
      // Extract the raw token from body.refreshToken
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: jwtConf.refreshSecret,
      issuer: jwtConf.issuer,
      audience: jwtConf.audience,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtRefreshPayload) {
    const rawToken: string | undefined = req.body?.refreshToken;
    if (!rawToken) throw new UnauthorizedException('Refresh token missing');

    // Pass the raw token alongside the payload so AuthService can
    // bcrypt-compare it against the stored hash.
    return { userId: payload.sub, jti: payload.jti, rawToken };
  }
}
