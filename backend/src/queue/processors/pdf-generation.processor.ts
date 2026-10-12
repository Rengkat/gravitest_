import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import puppeteer from 'puppeteer';
import { QUEUE_NAMES } from '../queue.constants';
import { PdfGenerationJob } from '../queue.service';
import { StorageService } from 'src/storage/storage.service';

/**
 * Renders report cards / exam summaries to PDF off the request thread.
 * Callers (e.g. StudentsService after a completed exam session,
 * TransactionsService for a receipt) pre-render HTML with Handlebars and
 * enqueue it here — this processor only owns the HTML→PDF→R2 pipeline.
 *
 * Production note: Puppeteer needs a Chromium binary available at runtime.
 * In Docker, install chromium and set PUPPETEER_EXECUTABLE_PATH, or use
 * `puppeteer-core` with a shared browser service — this file works with
 * either, it just needs `executablePath` wired from env if you go that route.
 */
@Processor(QUEUE_NAMES.PDF_GENERATION)
export class PdfGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfGenerationProcessor.name);

  constructor(private readonly storageService: StorageService) {
    super();
  }

  async process(job: Job<PdfGenerationJob>): Promise<{ key: string; url: string }> {
    const { html, fileName, type, entityId } = job.data;
    this.logger.log(`Generating PDF (${type}) for entity ${entityId}`);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' as any });
      const buffer = await page.pdf({ format: 'A4', printBackground: true });

      const result = await this.storageService.uploadBuffer({
        folder: 'reports',
        originalName: fileName,
        buffer: Buffer.from(buffer),
        contentType: 'application/pdf',
      });

      this.logger.log(`PDF ready: ${result.key}`);
      return { key: result.key, url: result.url };
    } finally {
      await browser.close();
    }
  }
}
