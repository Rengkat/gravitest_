import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import type { ConnectionOptions } from 'bullmq';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import redisConfig from 'src/config/redisConfig';
import { QUEUE_NAMES } from './queue.constants';
import { QueueService } from './queue.service';
import { PdfGenerationProcessor } from './processors/pdf-generation.processor';
import { ContentIndexingProcessor } from './processors/content-indexing.processor';
import { LibraryPreviewProcessor } from './processors/library-preview.processor';
import { StorageModule } from 'src/storage/storage.module';
import { SearchModule } from 'src/search/search.module';
import { LibraryContent } from 'src/library/entities/library-contnent.entity';
import { LibraryContentPreview } from 'src/library/entities/library-content-preview.entity';

// BullMQ needs plain connection options (not a url key), so a REDIS_URL is
// parsed into host/port/credentials here. The return type comes from
// bullmq itself because it bundles its own ioredis version, and the
// project's ioredis types are not assignable to it.
function buildConnection(
  conf: ConfigType<typeof redisConfig>,
): ConnectionOptions {
  const base = {
    // Required by BullMQ for blocking connections.
    maxRetriesPerRequest: null,
    // Back off up to 5s between reconnect attempts.
    retryStrategy: (times: number) => Math.min(times * 200, 5000),
  };

  if (conf.url) {
    const u = new URL(conf.url);
    return {
      ...base,
      host: u.hostname,
      port: u.port ? parseInt(u.port, 10) : 6379,
      username: u.username ? decodeURIComponent(u.username) : undefined,
      password: u.password ? decodeURIComponent(u.password) : undefined,
      tls: conf.tls ? {} : undefined,
    };
  }

  return {
    ...base,
    host: conf.host,
    port: conf.port,
    password: conf.password,
    tls: conf.tls ? {} : undefined,
  };
}

// Global so any feature module (library, students, transactions) can
// inject QueueService and enqueue a job without importing BullMQ itself.
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [redisConfig.KEY],
      useFactory: (conf: ConfigType<typeof redisConfig>) => ({
        connection: buildConnection(conf),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { age: 60 * 60 * 24, count: 500 },
          removeOnFail: { age: 60 * 60 * 24 * 7 },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.EMAIL },
      { name: QUEUE_NAMES.PDF_GENERATION },
      { name: QUEUE_NAMES.AI_BACKGROUND },
      { name: QUEUE_NAMES.CONTENT_INDEXING },
      { name: QUEUE_NAMES.LIBRARY_PREVIEW },
    ),
    StorageModule,
    SearchModule,
    TypeOrmModule.forFeature([LibraryContent, LibraryContentPreview]),
  ],
  providers: [
    QueueService,
    PdfGenerationProcessor,
    ContentIndexingProcessor,
    LibraryPreviewProcessor,
  ],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
