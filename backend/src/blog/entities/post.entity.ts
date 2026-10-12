import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BlogCategory } from 'src/common/enums/enums';

@Entity('blog_posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 220 })
  slug!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 400 })
  excerpt!: string;

  // Markdown — rendered client-side. No rich WYSIWYG storage format here;
  // keeping it plain markdown avoids coupling the API to one editor's
  // internal HTML/JSON shape.
  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'enum', enum: BlogCategory })
  category!: BlogCategory;

  // Short display label shown as a chip on the card (e.g. "JAMB Guide") —
  // deliberately separate from `category`, which drives filtering/routing.
  @Column({ type: 'varchar', length: 60 })
  tag!: string;

  @Column({ type: 'varchar', length: 120 })
  authorName!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  authorRole!: string | null;

  // Denormalized rather than a full Author/User relation — the blog has
  // no concept of "authors log in and write their own posts" yet; admins
  // author posts on their behalf and type the byline directly.
  @Column({ type: 'varchar', length: 4, nullable: true })
  authorInitials!: string | null;

  @Column({ type: 'varchar', nullable: true })
  coverImageUrl!: string | null;

  @Column({ type: 'int', default: 5 })
  readTimeMinutes!: number;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
