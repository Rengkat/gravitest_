import { Global, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import redisConfig from 'src/config/redisConfig';

export const REDIS_CLIENT = 'REDIS_CLIENT';

// Global so every feature module (rate limiting, exam timer sync, BullMQ,
// caching) can inject the same client without re-declaring imports.
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [redisConfig.KEY],
      useFactory: (conf: ConfigType<typeof redisConfig>) => {
        if (conf.url) {
          return new Redis(conf.url, {
            maxRetriesPerRequest: null,
            tls: conf.tls ? {} : undefined,
          });
        }
        return new Redis({
          host: conf.host,
          port: conf.port,
          password: conf.password,
          maxRetriesPerRequest: null,
          tls: conf.tls ? {} : undefined,
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
