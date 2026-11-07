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
import { Question } from 'src/questions/entities/question.entity';
import { User } from 'src/user/entities/user.entity';

export enum ContributionStatus {
  VISIBLE = 'visible',
  /** Hidden by a moderator or by the report threshold; shown only as a placeholder. */
  HIDDEN = 'hidden',
  /** Deleted by its author or a moderator; kept as a tombstone so replies keep their context. */
  DELETED = 'deleted',
}

/**
 * One comment (or reply) in the discussion of ONE question — or of ONE
 * independently-answerable part of a structured theory/practical question.
 *
 * Discussions belong to the underlying question, not to an exam session: the
 * same question reached through different sessions, shuffles or years of
 * practice shows the same thread. The thread is identified by
 * (questionId, partId) where partId is the part's permanent id
 * (see assignPartIds) and NULL means the question itself. Position in a
 * session, display numbers and labels are never used.
 */
@Entity('question_contributions')
// Thread listing: top-level contributions of one question/part, newest first.
@Index('IDX_contrib_thread', ['questionId', 'partId', 'parentId', 'createdAt'])
// Replies of one parent, oldest first.
@Index('IDX_contrib_replies', ['parentId', 'createdAt'])
@Index('IDX_contrib_user_recent', ['userId', 'createdAt'])
// A retried/double-clicked submit carries the same token → one row.
@Index('UQ_contrib_user_token', ['userId', 'clientToken'], {
  unique: true,
  where: '"clientToken" IS NOT NULL',
})
export class QuestionContribution {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  questionId!: string;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question?: Question;

  /** Permanent id of the sub-question this thread belongs to; null = the question itself. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  partId!: string | null;

  /** Null only if the account was deleted (the contribution is kept, anonymised). */
  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User | null;

  /** Top-level contribution this reply hangs under. Null for top-level contributions. Replies are one level deep; deeper conversation stays flat under the same parent. */
  @Column({ type: 'uuid', nullable: true })
  parentId!: string | null;

  /** The specific contribution being answered (for "replying to Ada" in a flat reply chain). */
  @Column({ type: 'uuid', nullable: true })
  replyToId!: string | null;

  @Column({ type: 'text' })
  content!: string;

  /** Public URLs of images uploaded through the discussion upload endpoint. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  imageUrls!: string[];

  // Denormalised counters, only ever changed with atomic `col = col ± n`
  // updates so concurrent reactions/replies can't lose updates.
  @Column({ type: 'int', default: 0 })
  likeCount!: number;

  @Column({ type: 'int', default: 0 })
  dislikeCount!: number;

  /** Visible replies (top-level rows only). */
  @Column({ type: 'int', default: 0 })
  replyCount!: number;

  @Column({ type: 'int', default: 0 })
  reportCount!: number;

  @Column({ type: 'enum', enum: ContributionStatus, default: ContributionStatus.VISIBLE })
  status!: ContributionStatus;

  @Column({ type: 'varchar', length: 200, nullable: true })
  moderationNote!: string | null;

  @Column({ type: 'uuid', nullable: true })
  moderatedById!: string | null;

  /** Client-generated idempotency token for the submit. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  clientToken!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  editedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
