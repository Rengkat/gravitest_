import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContentType } from '../../common/enums/enums';
import { LibraryContent } from './library-contnent.entity';

@Entity('library_accesses')
@Index(['userId', 'contentId'], { unique: true })
@Index(['userId', 'contentType'])
export class LibraryAccess {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid' })
  contentId!: string; // References LibraryContent (separate module)

  @Column({ type: 'enum', enum: ContentType })
  contentType!: ContentType;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null; // Null = permanent access

  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'int', default: 0 })
  downloadCount!: number;

  @Column({ type: 'float', default: 0 })
  progressPercent!: number; // For videos/ebooks

  @Column({ type: 'timestamptz', nullable: true })
  lastAccessedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  bookmarks:
    | {
        position: number; // Page number or video timestamp in seconds
        note?: string;
        createdAt: string;
      }[]
    | null;

  @Column({ type: 'jsonb', nullable: true })
  highlights:
    | {
        startOffset: number;
        endOffset: number;
        text: string;
        color: string;
        note?: string;
      }[]
    | null;

  /** Reference to the payment that unlocked this content */
  @Column({ type: 'uuid', nullable: true })
  paymentId: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
  // ── relationship ───────────────────────────────────────────
  @ManyToOne(() => LibraryContent, (c) => c.accesses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content!: LibraryContent;

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  recordAccess(): void {
    this.viewCount += 1;
    this.lastAccessedAt = new Date();
  }

  updateProgress(percent: number): void {
    this.progressPercent = Math.min(100, Math.max(0, percent));
  }
}
