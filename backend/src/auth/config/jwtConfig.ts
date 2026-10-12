import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET!,
  refreshSecret: process.env.JWT_REFRESH_SECRET!,
  issuer: process.env.JWT_TOKEN_ISSUER!,
  audience: process.env.JWT_TOKEN_AUDIENCE!,
  accessTokenTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL || '900', 10),
  refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL || '2592000', 10),
}));
