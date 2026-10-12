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
import { LibraryContent } from './library-contnent.entity';

@Entity('library_ratings')
@Index(['libraryContentId', 'userId'], { unique: true }) // one rating per user per item — POST upserts
export class LibraryRating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  libraryContentId!: string;

  @ManyToOne(() => LibraryContent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'libraryContentId' })
  content!: LibraryContent;

  @Column({ type: 'uuid' })
  userId!: string;

  // Denormalized so the UI can show "— Jane D." without an extra join/call.
  @Column({ type: 'varchar', length: 120 })
  userDisplayName!: string;

  @Column({ type: 'int' })
  rating!: number; // 1–5

  @Column({ type: 'text', nullable: true })
  review: string | null;

  @Column({ type: 'int', default: 0 })
  helpfulCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
