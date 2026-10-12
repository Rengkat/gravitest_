import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibraryContent } from '../entities/library-contnent.entity';
import { LibraryContentPreview } from '../entities/library-content-preview.entity';
import { ContentPreviewStatus } from 'src/common/enums/enums';
import { StorageService } from 'src/storage/storage.service';
import { QueueService } from 'src/queue/queue.service';

// A PENDING row older than this is treated as abandoned (the worker that
// owned it crashed/restarted without BullMQ's retry ever landing) and is
// safe to re-trigger, rather than leaving a student staring at "generating…"
// forever. Generation should take single-digit seconds to at most a couple
// of minutes for a very large video; this is a generous ceiling above that.
const STALE_PENDING_MS = 10 * 60 * 1000;

export interface PreviewView {
  status: ContentPreviewStatus;
  url?: string;
  expiresInSeconds?: number;
  durationSeconds?: number | null;
  pages?: number | null;
  message?: string;
}

@Injectable()
export class LibraryPreviewService {
  private readonly logger = new Logger(LibraryPreviewService.name);

  constructor(
    @InjectRepository(LibraryContent)
    private readonly contentRepo: Repository<LibraryContent>,

    @InjectRepository(LibraryContentPreview)
    private readonly previewRepo: Repository<LibraryContentPreview>,

    private readonly storageService: StorageService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Ensures a preview exists (or is being generated) for `content` and
   * returns a client-ready view of it. Never touches the caller's access —
   * LibraryService.getPreview() is responsible for deciding whether the
   * caller should even be offered a preview at all.
   */
  async getOrCreate(content: LibraryContent): Promise<PreviewView> {
    let row = await this.previewRepo.findOne({ where: { contentId: content.id } });

    // The underlying file changed since this row was generated (admin
    // replaced the upload) — the cached clip no longer matches, and its R2
    // object is orphaned rather than deleted here (best-effort cleanup only;
    // losing a few hundred KB/MB of stale preview data in R2 is a
    // non-issue, whereas deleting it inline would turn a read into a
    // best-effort write with failure modes to handle).
    if (row && row.sourceFileUrl !== content.fileUrl) {
      row = null;
    }

    // An admin changed the per-item preview override since this row was
    // generated (e.g. tightened previewSeconds from 90 to 30) — regenerate
    // rather than keep serving the old length.
    if (
      row &&
      (row.requestedSeconds !== content.previewSeconds || row.requestedPages !== content.previewPages)
    ) {
      row = null;
    }

    if (row?.status === ContentPreviewStatus.PENDING) {
      const age = Date.now() - row.updatedAt.getTime();
      if (age < STALE_PENDING_MS) {
        return { status: ContentPreviewStatus.PENDING };
      }
      this.logger.warn(`Preview for ${content.id} stuck PENDING for ${Math.round(age / 1000)}s — retrying`);
      row = null;
    }

    if (row?.status === ContentPreviewStatus.READY) {
      return this.toView(row);
    }

    if (row?.status === ContentPreviewStatus.NOT_APPLICABLE) {
      return { status: ContentPreviewStatus.NOT_APPLICABLE, message: row.error ?? undefined };
    }

    // NONE, FAILED (retry), or the row was just invalidated above — (re)start.
    await this.trigger(content);
    return { status: ContentPreviewStatus.PENDING };
  }

  private async trigger(content: LibraryContent): Promise<void> {
    try {
      await this.previewRepo.save(
        this.previewRepo.create({
          contentId: content.id,
          status: ContentPreviewStatus.PENDING,
          sourceFileUrl: content.fileUrl,
          previewKey: null,
          fileSizeBytes: null,
          durationSeconds: null,
          pages: null,
          error: null,
          // Recorded now (not just by the processor on completion) so the
          // staleness check above doesn't mistake "still generating" for
          // "override changed" and re-trigger on every request in between.
          requestedSeconds: content.previewSeconds,
          requestedPages: content.previewPages,
        }),
      );
    } catch {
      // Unique(contentId) conflict — another request just created the row
      // (or the stale one from above is still there under a fresh save).
      // Either way, fall through: the queue add below is deduplicated by
      // jobId=contentId, so this doesn't produce a duplicate job.
    }

    await this.queueService.queueLibraryPreview({ contentId: content.id });
  }

  private async toView(row: LibraryContentPreview): Promise<PreviewView> {
    if (!row.previewKey) {
      // Shouldn't happen (READY is only ever set alongside a key), but
      // don't hand back a broken URL if it somehow does.
      return { status: ContentPreviewStatus.FAILED, message: 'Preview record is incomplete' };
    }
    const url = await this.storageService.getPresignedDownloadUrl(row.previewKey);
    return {
      status: ContentPreviewStatus.READY,
      url,
      expiresInSeconds: 3600,
      durationSeconds: row.durationSeconds,
      pages: row.pages,
    };
  }
}
