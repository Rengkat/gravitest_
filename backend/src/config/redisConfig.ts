import { registerAs } from '@nestjs/config';

// Works with Upstash (rediss:// TLS URL) or any standard Redis instance.
// If REDIS_URL is set it takes priority; otherwise host/port/password are used.
export default registerAs('redis', () => ({
  url: process.env.REDIS_URL || undefined,
  // 127.0.0.1 instead of 'localhost' avoids the ::1 / 127.0.0.1 double
  // attempt you saw in the logs on Windows.
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  tls:
    process.env.REDIS_TLS === 'true' ||
    (process.env.REDIS_URL ?? '').startsWith('rediss://'),
}));
