import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
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

// Global so any feature module (library, students, transactions) can
// inject QueueService and enqueue a job without importing BullMQ itself.
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [redisConfig.KEY],
      useFactory: (conf: ConfigType<typeof redisConfig>) => ({
        connection: conf.url
          ? { url: conf.url, maxRetriesPerRequest: null, tls: conf.tls ? {} : undefined }
          : {
              host: conf.host,
              port: conf.port,
              password: conf.password,
              maxRetriesPerRequest: null,
              tls: conf.tls ? {} : undefined,
            },
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
  providers: [QueueService, PdfGenerationProcessor, ContentIndexingProcessor, LibraryPreviewProcessor],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
