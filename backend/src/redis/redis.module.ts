import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import redisConfig from 'src/config/redisConfig';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const logger = new Logger('Redis');

// Redis emits an 'error' event on every failed retry. Log the first one,
// then at most one repeat every 30s so an outage doesn't flood the console.
const ERROR_LOG_INTERVAL_MS = 30_000;

function attachListeners(client: Redis): Redis {
  let lastErrorLoggedAt = 0;

  client.on('error', (err: Error) => {
    const now = Date.now();
    if (now - lastErrorLoggedAt >= ERROR_LOG_INTERVAL_MS) {
      lastErrorLoggedAt = now;
      logger.warn(
        `Connection error: ${err.message || err.name}. Retrying in background (further errors suppressed for 30s).`,
      );
    }
  });

  client.on('ready', () => {
    lastErrorLoggedAt = 0;
    logger.log('Connected and ready');
  });

  client.on('end', () => logger.warn('Connection closed'));

  return client;
}

// Global so every feature module (rate limiting, exam timer sync, BullMQ,
// caching) can inject the same client without re-declaring imports.
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [redisConfig.KEY],
      useFactory: (conf: ConfigType<typeof redisConfig>) => {
        const baseOptions: RedisOptions = {
          // Required by BullMQ for blocking connections.
          maxRetriesPerRequest: null,
          tls: conf.tls ? {} : undefined,
          // Back off up to 5s between reconnect attempts.
          retryStrategy: (times: number) => Math.min(times * 200, 5000),
        };

        const client = conf.url
          ? new Redis(conf.url, baseOptions)
          : new Redis({
              ...baseOptions,
              host: conf.host,
              port: conf.port,
              password: conf.password,
            });

        return attachListeners(client);
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
