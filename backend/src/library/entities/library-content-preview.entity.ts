import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContentPreviewStatus } from 'src/common/enums/enums';

// Cache of the server-generated free-preview asset for one library content
// item — a short re-encoded video/audio clip, or a PDF containing only the
// first few pages. One row per content item (contentId is unique).
//
// Kept as its own table, same pattern as LibraryRating/ContentAuditLog/
// LibraryAccess, rather than columns on LibraryContent: generation status/
// error churns independently of the content metadata, and every other
// read of LibraryContent (findAll, findOne, search indexing…) shouldn't
// have to carry it.
@Entity('library_content_previews')
@Index(['contentId'], { unique: true })
export class LibraryContentPreview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  contentId!: string; // References LibraryContent (separate module, no FK — see LibraryAccess for the same convention)

  @Column({ type: 'enum', enum: ContentPreviewStatus, default: ContentPreviewStatus.NONE })
  status!: ContentPreviewStatus;

  // R2 object key of the generated preview file (never a public URL — the
  // preview is still gated content, just a short excerpt of it, so it is
  // always served through a short-lived signed GET like the full file).
  @Column({ type: 'varchar', nullable: true })
  previewKey: string | null;

  @Column({ type: 'int', nullable: true })
  fileSizeBytes: number | null;

  // What was actually generated — may be clamped shorter than the content's
  // previewSeconds/previewPages (see resolvePreviewSpec), so this is the
  // number the player should treat as authoritative, not the request input.
  @Column({ type: 'int', nullable: true })
  durationSeconds: number | null; // video/audio previews

  @Column({ type: 'int', nullable: true })
  pages: number | null; // document previews

  // Which source file this preview was generated from. Compared against
  // the content's current fileUrl on every request so a replaced file
  // invalidates the cached preview instead of silently serving a stale one.
  @Column({ type: 'varchar' })
  sourceFileUrl!: string;

  // The admin override in effect (LibraryContent.previewSeconds/previewPages)
  // when this row was generated, exactly as stored (including null = "use
  // the platform default"). Compared against the content's CURRENT override
  // on every request so changing it invalidates the cache, same as a
  // replaced file does via sourceFileUrl.
  @Column({ type: 'int', nullable: true })
  requestedSeconds: number | null;

  @Column({ type: 'int', nullable: true })
  requestedPages: number | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
