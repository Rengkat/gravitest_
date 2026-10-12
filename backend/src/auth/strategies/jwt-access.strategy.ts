import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import { Request } from 'express';
import { JwtAccessPayload } from '../interfaces/jwt-payload.interface';
import jwtConfig from '../config/jwtConfig';

const extractJwtFromHeaderOrQuery = (req: Request): string | null => {
  const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (fromHeader) return fromHeader;

  if (req.query?.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  return null;
};

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConf: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: extractJwtFromHeaderOrQuery,
      secretOrKey: jwtConf.accessSecret,
      issuer: jwtConf.issuer,
      audience: jwtConf.audience,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtAccessPayload) {
    if (!payload.sub || !payload.jti) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub,
      role: payload.role,
      jti: payload.jti,
    };
  }
}
