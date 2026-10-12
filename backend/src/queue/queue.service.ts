import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './queue.constants';

export interface PdfGenerationJob {
  type: 'report-card' | 'exam-summary';
  userId: string;
  entityId: string; // e.g. examSessionId — used as the idempotency key
  html: string; // fully-rendered HTML (e.g. via Handlebars) ready to print
  fileName: string; // e.g. 'report-card-ss3-waec-2026.pdf'
}

export interface ContentIndexingJob {
  action: 'index' | 'remove';
  contentId: string;
}

export interface LibraryPreviewJob {
  contentId: string;
}

// Every other module talks to the queue system through this service —
// nothing outside src/queue should import BullMQ's Queue type directly.
@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.PDF_GENERATION) private readonly pdfQueue: Queue,
    @InjectQueue(QUEUE_NAMES.CONTENT_INDEXING) private readonly indexingQueue: Queue,
    @InjectQueue(QUEUE_NAMES.LIBRARY_PREVIEW) private readonly previewQueue: Queue,
    @InjectQueue(QUEUE_NAMES.AI_BACKGROUND) private readonly aiQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
  ) {}

  queuePdfGeneration(job: PdfGenerationJob) {
    // BullMQ rejects custom job IDs containing ":" (throws "Custom Id
    // cannot contain :") — use "-" as the separator instead.
    return this.pdfQueue.add(job.type, job, { jobId: `${job.type}-${job.entityId}` });
  }

  queueContentIndexing(job: ContentIndexingJob) {
    return this.indexingQueue.add(job.action, job, {
      jobId: `${job.action}-${job.contentId}`,
    });
  }

  // jobId = contentId means a second request for the same content while one
  // is already queued/running is deduplicated by BullMQ itself (adding a job
  // with an existing, not-yet-completed id is a no-op) — on top of the
  // PENDING check LibraryPreviewService already does before calling this.
  queueLibraryPreview(job: LibraryPreviewJob) {
    return this.previewQueue.add('generate', job, { jobId: job.contentId });
  }

  queueAiBackgroundTask<T extends Record<string, unknown>>(name: string, payload: T) {
    return this.aiQueue.add(name, payload);
  }

  queueEmailRetry<T extends Record<string, unknown>>(name: string, payload: T) {
    return this.emailQueue.add(name, payload, { attempts: 5 });
  }
}
