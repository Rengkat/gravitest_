import { UserRole } from 'src/common/enums/enums';

export interface JwtAccessPayload {
  sub: string; // userId
  role: UserRole;
  jti: string;
  iss?: string;
  aud?: string | string[];
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string;
  jti: string;
  iss?: string;
  aud?: string | string[];
  iat?: number;
  exp?: number;
}
