import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { QUEUE_NAMES } from '../queue.constants';
import { LibraryPreviewJob } from '../queue.service';
import { StorageService } from 'src/storage/storage.service';
import { LibraryContent } from 'src/library/entities/library-contnent.entity';
import { LibraryContentPreview } from 'src/library/entities/library-content-preview.entity';
import { ContentPreviewStatus, ContentType } from 'src/common/enums/enums';
import {
  MAX_PREVIEW_FRACTION,
  MIN_PREVIEW_PAGES,
  MIN_PREVIEW_SECONDS,
  PREVIEW_DEFAULTS,
  PREVIEW_SAFETY_MARGIN_PAGES,
  PREVIEW_SAFETY_MARGIN_SECONDS,
} from 'src/library/providers/library-preview.constants';

ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);
ffmpeg.setFfprobePath((ffprobeStatic as unknown as { path: string }).path);

/**
 * Generates the actual free-preview asset for one library content item:
 * a short re-encoded clip for VIDEO/AUDIO, or a page-truncated copy for a
 * PDF-backed document. Runs off the request thread (see
 * LibraryPreviewService for what triggers a job).
 *
 * Every duration/page-count decision here is made from the REAL source
 * file (via ffprobe / pdf-lib), never from admin-entered metadata like
 * LibraryContent.durationSeconds or .totalPages — that metadata can be
 * wrong or stale, and trusting it would risk generating a "preview" that
 * is actually the entire paid file. See clampSeconds()/clampPages().
 *
 * Deploy note: this bundles its own ffmpeg/ffprobe binaries via
 * ffmpeg-static/ffprobe-static — no system package needed, same approach
 * PdfGenerationProcessor already takes with Puppeteer's bundled Chromium.
 * If FFMPEG_PATH/FFPROBE_PATH are set (e.g. to a system install), those
 * win instead — useful on a host where the static binary doesn't match
 * the platform/arch.
 */
@Processor(QUEUE_NAMES.LIBRARY_PREVIEW)
export class LibraryPreviewProcessor extends WorkerHost {
  private readonly logger = new Logger(LibraryPreviewProcessor.name);

  constructor(
    @InjectRepository(LibraryContent)
    private readonly contentRepo: Repository<LibraryContent>,

    @InjectRepository(LibraryContentPreview)
    private readonly previewRepo: Repository<LibraryContentPreview>,

    private readonly storageService: StorageService,
  ) {
    super();
    if (process.env.FFMPEG_PATH) ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
    if (process.env.FFPROBE_PATH) ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
  }

  async process(job: Job<LibraryPreviewJob>): Promise<void> {
    const { contentId } = job.data;
    const content = await this.contentRepo.findOne({ where: { id: contentId } });

    if (!content) {
      await this.saveRow(contentId, '', { status: ContentPreviewStatus.NOT_APPLICABLE, error: 'Content no longer exists' });
      return;
    }

    // Free content, and any legacy row storing a full external URL, is
    // already fully playable with no gate — nothing to generate.
    const isFullUrl = /^https?:\/\//i.test(content.fileUrl);
    if (content.isFree || isFullUrl) {
      await this.saveRow(content.id, content.fileUrl, { status: ContentPreviewStatus.NOT_APPLICABLE });
      return;
    }

    this.logger.log(`Generating preview for ${content.id} (${content.contentType})`);
    const sourceUrl = await this.storageService.getPresignedDownloadUrl(content.fileUrl);

    try {
      if (content.contentType === ContentType.VIDEO) {
        await this.generateMediaPreview(content, sourceUrl, 'video');
      } else if (content.contentType === ContentType.AUDIO) {
        await this.generateMediaPreview(content, sourceUrl, 'audio');
      } else {
        await this.generateDocPreview(content, sourceUrl);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Preview generation failed for ${content.id}: ${message}`);
      await this.saveRow(content.id, content.fileUrl, { status: ContentPreviewStatus.FAILED, error: message });
      throw err; // let BullMQ retry (3 attempts, exponential backoff — see queue.module.ts)
    }
  }

  // ─── VIDEO / AUDIO ──────────────────────────────────────────────
  private async generateMediaPreview(
    content: LibraryContent,
    sourceUrl: string,
    kind: 'video' | 'audio',
  ): Promise<void> {
    const probed = await this.probeDuration(sourceUrl);
    if (probed == null) {
      throw new Error('Could not read duration from source media (ffprobe failed)');
    }

    const requested =
      content.previewSeconds ??
      (kind === 'video' ? PREVIEW_DEFAULTS.VIDEO_SECONDS : PREVIEW_DEFAULTS.AUDIO_SECONDS);
    const seconds = clampSeconds(requested, probed);

    if (seconds == null) {
      // The source is too short to safely withhold anything — the whole
      // file IS the preview length or shorter. Don't generate a clip that
      // would just be the entire paid asset.
      await this.saveRow(content.id, content.fileUrl, {
        status: ContentPreviewStatus.NOT_APPLICABLE,
        error: 'Source is too short to generate a safe preview',
        requestedSeconds: content.previewSeconds,
      });
      return;
    }

    const tmpOut = path.join(os.tmpdir(), `gt-preview-${randomUUID()}.${kind === 'video' ? 'mp4' : 'm4a'}`);
    try {
      await this.runFfmpegTrim(sourceUrl, tmpOut, seconds, kind);
      const buffer = await fs.readFile(tmpOut);

      const result = await this.storageService.uploadBuffer({
        folder: 'previews',
        originalName: `${content.id}-preview.${kind === 'video' ? 'mp4' : 'm4a'}`,
        buffer,
        contentType: kind === 'video' ? 'video/mp4' : 'audio/mp4',
      });

      await this.saveRow(content.id, content.fileUrl, {
        status: ContentPreviewStatus.READY,
        previewKey: result.key,
        fileSizeBytes: result.sizeBytes,
        durationSeconds: seconds,
        requestedSeconds: content.previewSeconds,
      });
      this.logger.log(`Preview ready for ${content.id}: ${result.key} (${seconds}s, ${result.sizeBytes}B)`);
    } finally {
      await fs.unlink(tmpOut).catch(() => {});
    }
  }

  private probeDuration(url: string): Promise<number | null> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(url, (err, data) => {
        if (err || !data?.format?.duration) return resolve(null);
        resolve(data.format.duration);
      });
    });
  }

  private runFfmpegTrim(
    sourceUrl: string,
    outPath: string,
    seconds: number,
    kind: 'video' | 'audio',
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let cmd = ffmpeg(sourceUrl)
        .audioCodec('aac')
        .audioBitrate('128k')
        .outputOptions(['-t', String(seconds), '-movflags', '+faststart'])
        .format('mp4')
        // A hung/very slow remote read shouldn't tie up a worker forever —
        // 2 minutes is generous for reading & re-encoding a ~90s clip.
        .on('start', (cmdLine) => this.logger.debug(`ffmpeg: ${cmdLine}`))
        .on('error', reject)
        .on('end', () => resolve());

      cmd = kind === 'video'
        ? cmd.videoCodec('libx264').outputOptions(['-preset', 'veryfast', '-crf', '28'])
        : cmd.noVideo();

      const timer = setTimeout(() => {
        reject(new Error('ffmpeg trim timed out after 120s'));
      }, 120_000);
      cmd.on('end', () => clearTimeout(timer)).on('error', () => clearTimeout(timer));

      cmd.save(outPath);
    });
  }

  // ─── DOCUMENTS (PDF-backed content only) ───────────────────────
  private async generateDocPreview(content: LibraryContent, sourceUrl: string): Promise<void> {
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`Failed to download source file (HTTP ${res.status})`);
    const bytes = new Uint8Array(await res.arrayBuffer());

    let src: PDFDocument;
    try {
      src = await PDFDocument.load(bytes);
    } catch {
      // Not a PDF (e.g. .docx/.epub) — not a transient failure, don't retry.
      await this.saveRow(content.id, content.fileUrl, {
        status: ContentPreviewStatus.NOT_APPLICABLE,
        error: 'Preview generation only supports PDF-backed documents',
      });
      return;
    }

    const totalPages = src.getPageCount();
    const requested =
      content.previewPages ??
      (content.contentType === ContentType.EBOOK ? PREVIEW_DEFAULTS.EBOOK_PAGES : PREVIEW_DEFAULTS.DOC_PAGES);
    const pages = clampPages(requested, totalPages);

    if (pages == null) {
      await this.saveRow(content.id, content.fileUrl, {
        status: ContentPreviewStatus.NOT_APPLICABLE,
        error: 'Document is too short to generate a safe preview',
        requestedPages: content.previewPages,
      });
      return;
    }

    const out = await PDFDocument.create();
    const indices = Array.from({ length: pages }, (_, i) => i);
    const copied = await out.copyPages(src, indices);
    copied.forEach((p) => out.addPage(p));
    const outBytes = await out.save();

    const result = await this.storageService.uploadBuffer({
      folder: 'previews',
      originalName: `${content.id}-preview.pdf`,
      buffer: Buffer.from(outBytes),
      contentType: 'application/pdf',
    });

    await this.saveRow(content.id, content.fileUrl, {
      status: ContentPreviewStatus.READY,
      previewKey: result.key,
      fileSizeBytes: result.sizeBytes,
      pages,
      requestedPages: content.previewPages,
    });
    this.logger.log(`Preview ready for ${content.id}: ${result.key} (${pages}/${totalPages} pages, ${result.sizeBytes}B)`);
  }

  // ─── shared ─────────────────────────────────────────────────────
  private async saveRow(
    contentId: string,
    sourceFileUrl: string,
    patch: Partial<
      Pick<
        LibraryContentPreview,
        | 'status'
        | 'previewKey'
        | 'fileSizeBytes'
        | 'durationSeconds'
        | 'pages'
        | 'error'
        | 'requestedSeconds'
        | 'requestedPages'
      >
    >,
  ): Promise<void> {
    let row = await this.previewRepo.findOne({ where: { contentId } });
    if (!row) row = this.previewRepo.create({ contentId, sourceFileUrl });
    Object.assign(row, { sourceFileUrl, previewKey: null, error: null, ...patch });
    await this.previewRepo.save(row);
  }
}

// Leaves at least MIN_PREVIEW_SECONDS + PREVIEW_SAFETY_MARGIN_SECONDS of the
// source un-previewed. Returns null when the source is too short for that
// to be possible — i.e. there's no length at which a preview wouldn't just
// be (essentially) the whole file.
export function clampSeconds(requested: number, actualDurationSeconds: number): number | null {
  const marginCeiling = Math.floor(actualDurationSeconds) - PREVIEW_SAFETY_MARGIN_SECONDS;
  const fractionCeiling = Math.floor(actualDurationSeconds * MAX_PREVIEW_FRACTION);
  const seconds = Math.min(requested, marginCeiling, fractionCeiling);
  return seconds >= MIN_PREVIEW_SECONDS ? seconds : null;
}

export function clampPages(requested: number, actualPageCount: number): number | null {
  const marginCeiling = actualPageCount - PREVIEW_SAFETY_MARGIN_PAGES;
  const fractionCeiling = Math.floor(actualPageCount * MAX_PREVIEW_FRACTION);
  const pages = Math.min(requested, marginCeiling, fractionCeiling);
  return pages >= MIN_PREVIEW_PAGES ? pages : null;
}
