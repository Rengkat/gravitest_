import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, MoreThan, Repository } from 'typeorm';

import { User } from 'src/user/entities/user.entity';
import { UserRole } from 'src/common/enums/enums';
import { StorageService } from 'src/storage/storage.service';
import { ContributionStatus, QuestionContribution } from './entities/question-contribution.entity';
import { ContributionReaction } from './entities/contribution-reaction.entity';
import { ContributionReport, ReportReason, ReportStatus } from './entities/contribution-report.entity';
import { DiscussionAccessService } from './discussion-access.service';
import { checkContent, fingerprint, normalizeContent } from './utils/content-guard.util';
import {
  CreateContributionDto,
  PageQueryDto,
  ReportDto,
  ReportsQueryDto,
  ThreadQueryDto,
  UpdateContributionDto,
} from './dto/discussions.dto';

type Actor = { id: string; role: UserRole };

/** Distinct reporters after which a contribution is hidden pending review. */
export const AUTO_HIDE_REPORT_THRESHOLD = 3;
export const MAX_PER_MINUTE = 5;
export const MAX_PER_HOUR = 40;
const DUPLICATE_WINDOW_MS = 2 * 60_000;

export interface ContributionView {
  id: string;
  questionId: string;
  partId: string | null;
  parentId: string | null;
  replyToId: string | null;
  replyToName: string | null;
  author: { displayName: string; avatarUrl: string | null } | null;
  /** Null for deleted/hidden contributions — the placeholder keeps replies in context. */
  content: string | null;
  imageUrls: string[];
  likeCount: number;
  dislikeCount: number;
  replyCount: number;
  myReaction: 1 | -1 | 0;
  state: 'visible' | 'hidden' | 'deleted';
  isMine: boolean;
  edited: boolean;
  createdAt: Date;
}

const isUniqueViolation = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { code?: string }).code === '23505';

/** Public display name: first name + last initial. Never an email, phone number or full surname. */
export function publicName(u: Pick<User, 'firstName' | 'lastName'> | undefined | null): string {
  if (!u) return 'Former student';
  const last = (u.lastName ?? '').trim().charAt(0);
  return `${(u.firstName ?? '').trim() || 'Student'}${last ? ` ${last.toUpperCase()}.` : ''}`;
}

@Injectable()
export class DiscussionsService {
  private readonly logger = new Logger(DiscussionsService.name);

  constructor(
    @InjectRepository(QuestionContribution) private readonly contribs: Repository<QuestionContribution>,
    @InjectRepository(ContributionReaction) private readonly reactions: Repository<ContributionReaction>,
    @InjectRepository(ContributionReport) private readonly reports: Repository<ContributionReport>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly access: DiscussionAccessService,
    private readonly storage: StorageService,
  ) {}

  // ─── Reading ─────────────────────────────────────────────────────────

  async list(actor: Actor, questionId: string, q: ThreadQueryDto) {
    const partId = q.partId ?? null;
    await this.access.assertCanAccess(actor, { questionId, partId });

    const page = q.page ?? 1;
    const limit = q.limit ?? 10;
    const qb = this.threadQuery(questionId, partId)
      .andWhere('c.parentId IS NULL')
      // A deleted/hidden parent stays listed (as a placeholder) only while it still has replies.
      .andWhere('(c.status = :visible OR c.replyCount > 0)', { visible: ContributionStatus.VISIBLE });

    if (q.sort === 'top') {
      qb.orderBy('(c.likeCount - c.dislikeCount)', 'DESC').addOrderBy('c.createdAt', 'DESC');
    } else {
      qb.orderBy('c.createdAt', 'DESC').addOrderBy('c.id', 'DESC');
    }
    const [rows, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    // "Discussions (N)": every visible contribution in this thread, replies included.
    const discussionCount = await this.threadQuery(questionId, partId)
      .andWhere('c.status = :visible', { visible: ContributionStatus.VISIBLE })
      .getCount();

    return {
      data: await this.present(actor, rows),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), discussionCount },
    };
  }

  async listReplies(actor: Actor, parentId: string, q: PageQueryDto) {
    const parent = await this.mustFind(parentId);
    await this.access.assertCanAccess(actor, { questionId: parent.questionId, partId: parent.partId });

    const page = q.page ?? 1;
    const limit = q.limit ?? 10;
    const [rows, total] = await this.contribs.findAndCount({
      where: { parentId, status: ContributionStatus.VISIBLE },
      order: { createdAt: 'ASC', id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: await this.present(actor, rows),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  // ─── Writing ─────────────────────────────────────────────────────────

  async create(actor: Actor, dto: CreateContributionDto): Promise<ContributionView> {
    const partId = dto.partId ?? null;
    await this.access.assertCanAccess(actor, { questionId: dto.questionId, partId });

    // A retried / double-clicked submit carries the same token → return the first result, create nothing.
    if (dto.clientToken) {
      const prior = await this.contribs.findOne({ where: { userId: actor.id, clientToken: dto.clientToken } });
      if (prior) return (await this.present(actor, [prior]))[0];
    }

    const content = normalizeContent(dto.content ?? '');
    const imageUrls = this.validatedImages(dto.imageUrls);
    if (!content && !imageUrls.length) throw new BadRequestException('Write something or attach an image first.');
    this.assertContentOk(content);

    const { parentId, replyToId } = await this.resolveParent(dto, partId);

    await this.enforceRateLimit(actor.id);
    const duplicate = await this.findRecentDuplicate(actor.id, dto.questionId, partId, parentId, content);
    if (duplicate) return (await this.present(actor, [duplicate]))[0];

    try {
      const saved = await this.dataSource.transaction(async (m) => {
        const row = await m.save(
          m.create(QuestionContribution, {
            questionId: dto.questionId,
            partId,
            userId: actor.id,
            parentId,
            replyToId,
            content,
            imageUrls,
            clientToken: dto.clientToken ?? null,
          }),
        );
        if (parentId) await this.bumpReplyCount(m, parentId, +1);
        return row;
      });
      return (await this.present(actor, [saved]))[0];
    } catch (e) {
      if (isUniqueViolation(e) && dto.clientToken) {
        const prior = await this.contribs.findOne({ where: { userId: actor.id, clientToken: dto.clientToken } });
        if (prior) return (await this.present(actor, [prior]))[0];
      }
      throw e;
    }
  }

  async update(actor: Actor, id: string, dto: UpdateContributionDto): Promise<ContributionView> {
    const row = await this.mustFind(id);
    await this.access.assertCanAccess(actor, { questionId: row.questionId, partId: row.partId });
    if (row.userId !== actor.id) throw new ForbiddenException("You can only edit your own contributions.");
    if (row.status !== ContributionStatus.VISIBLE) throw new BadRequestException('This contribution can no longer be edited.');

    const content = normalizeContent(dto.content ?? '');
    const imageUrls = this.validatedImages(dto.imageUrls ?? row.imageUrls);
    if (!content && !imageUrls.length) throw new BadRequestException('A contribution needs some text or an image.');
    this.assertContentOk(content);

    row.content = content;
    row.imageUrls = imageUrls;
    row.editedAt = new Date();
    return (await this.present(actor, [await this.contribs.save(row)]))[0];
  }

  async remove(actor: Actor, id: string): Promise<{ deleted: true }> {
    const row = await this.mustFind(id);
    await this.access.assertCanAccess(actor, { questionId: row.questionId, partId: row.partId });
    const moderator = DiscussionAccessService.isModerator(actor.role);
    if (row.userId !== actor.id && !moderator) throw new ForbiddenException("You can only delete your own contributions.");

    await this.dataSource.transaction((m) =>
      this.setStatus(m, row, ContributionStatus.DELETED, moderator && row.userId !== actor.id ? actor.id : null),
    );
    return { deleted: true };
  }

  // ─── Reactions ───────────────────────────────────────────────────────

  /**
   * Set my reaction to a contribution: 1 = like, -1 = dislike, 0 = remove.
   * Safe under concurrency: the (contribution, user) pair is unique in the
   * database, the user's own row is locked while it changes, and the public
   * counters are moved with atomic increments — never read-modify-write.
   */
  async react(actor: Actor, id: string, value: 1 | -1 | 0) {
    const row = await this.mustFind(id);
    await this.access.assertCanAccess(actor, { questionId: row.questionId, partId: row.partId });
    if (row.status !== ContributionStatus.VISIBLE) throw new BadRequestException('You can no longer react to this contribution.');
    if (row.userId === actor.id) throw new BadRequestException("You can't react to your own contribution.");

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.dataSource.transaction(async (m) => {
          const existing = await m.findOne(ContributionReaction, {
            where: { contributionId: id, userId: actor.id },
            lock: { mode: 'pessimistic_write' },
          });
          const old = existing?.value ?? 0;
          if (old !== value) {
            if (value === 0) {
              await m.delete(ContributionReaction, { id: existing!.id });
            } else if (existing) {
              existing.value = value;
              await m.save(existing);
            } else {
              await m.insert(ContributionReaction, { contributionId: id, userId: actor.id, value });
            }
            const dLike = (value === 1 ? 1 : 0) - (old === 1 ? 1 : 0);
            const dDislike = (value === -1 ? 1 : 0) - (old === -1 ? 1 : 0);
            await m
              .createQueryBuilder()
              .update(QuestionContribution)
              .set({
                likeCount: () => `GREATEST("likeCount" + ${dLike}, 0)`,
                dislikeCount: () => `GREATEST("dislikeCount" + ${dDislike}, 0)`,
              })
              .where('id = :id', { id })
              .execute();
          }
          const fresh = await m.findOneOrFail(QuestionContribution, { where: { id } });
          return { id, likeCount: fresh.likeCount, dislikeCount: fresh.dislikeCount, myReaction: value };
        });
      } catch (e) {
        // Two simultaneous first-reactions from the same user: the loser retries and updates instead.
        if (isUniqueViolation(e) && attempt < 2) continue;
        throw e;
      }
    }
    throw new ConflictException('Could not save your reaction. Please try again.');
  }

  // ─── Reporting & moderation ──────────────────────────────────────────

  async report(actor: Actor, id: string, dto: ReportDto) {
    const row = await this.mustFind(id);
    await this.access.assertCanAccess(actor, { questionId: row.questionId, partId: row.partId });
    if (row.userId === actor.id) throw new BadRequestException("You can't report your own contribution.");
    if (row.status === ContributionStatus.DELETED) throw new BadRequestException('This contribution has been removed.');

    try {
      await this.dataSource.transaction(async (m) => {
        await m.insert(ContributionReport, {
          contributionId: id,
          reporterId: actor.id,
          reason: dto.reason,
          details: dto.details?.trim() || null,
        });
        await m
          .createQueryBuilder()
          .update(QuestionContribution)
          .set({ reportCount: () => '"reportCount" + 1' })
          .where('id = :id', { id })
          .execute();
        const fresh = await m.findOneOrFail(QuestionContribution, { where: { id } });
        if (fresh.status === ContributionStatus.VISIBLE && fresh.reportCount >= AUTO_HIDE_REPORT_THRESHOLD) {
          fresh.moderationNote = 'Hidden pending review after several reports.';
          await this.setStatus(m, fresh, ContributionStatus.HIDDEN, null);
        }
      });
    } catch (e) {
      if (isUniqueViolation(e)) return { reported: true, alreadyReported: true };
      throw e;
    }
    return { reported: true, alreadyReported: false };
  }

  async listReports(q: ReportsQueryDto) {
    const status = q.status ?? ReportStatus.OPEN;
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;

    const grouped = await this.reports
      .createQueryBuilder('r')
      .select('r.contributionId', 'contributionId')
      .addSelect('COUNT(*)::int', 'reportCount')
      .addSelect('MAX(r.createdAt)', 'lastReportedAt')
      .where('r.status = :status', { status })
      .groupBy('r.contributionId')
      .orderBy('MAX(r.createdAt)', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{ contributionId: string; reportCount: number; lastReportedAt: Date }>();

    const total = Number(
      (
        await this.reports
          .createQueryBuilder('r')
          .select('COUNT(DISTINCT r.contributionId)', 'n')
          .where('r.status = :status', { status })
          .getRawOne<{ n: string }>()
      )?.n ?? 0,
    );

    const ids = grouped.map((g) => g.contributionId);
    const rows = ids.length ? await this.contribs.find({ where: { id: In(ids) } }) : [];
    const reasons = ids.length
      ? await this.reports.find({ where: { contributionId: In(ids), status }, order: { createdAt: 'DESC' } })
      : [];
    const authors = await this.authorsFor(rows);
    const byId = new Map(rows.map((r) => [r.id, r]));

    return {
      data: grouped.flatMap((g) => {
        const c = byId.get(g.contributionId);
        if (!c) return [];
        return [
          {
            contributionId: c.id,
            questionId: c.questionId,
            partId: c.partId,
            isReply: !!c.parentId,
            content: c.content,
            imageUrls: c.imageUrls,
            status: c.status,
            moderationNote: c.moderationNote,
            author: c.userId ? { userId: c.userId, displayName: publicName(authors.get(c.userId)) } : null,
            createdAt: c.createdAt,
            reportCount: g.reportCount,
            lastReportedAt: g.lastReportedAt,
            reports: reasons
              .filter((r) => r.contributionId === c.id)
              .map((r) => ({ reason: r.reason, details: r.details, createdAt: r.createdAt })),
          },
        ];
      }),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  /** Moderator action on a contribution. Always resolves its open reports. */
  async moderate(adminId: string, id: string, action: 'hide' | 'restore' | 'delete', note?: string) {
    const row = await this.mustFind(id);
    await this.dataSource.transaction(async (m) => {
      row.moderationNote = note?.trim() || null;
      const target =
        action === 'hide'
          ? ContributionStatus.HIDDEN
          : action === 'delete'
            ? ContributionStatus.DELETED
            : ContributionStatus.VISIBLE;
      if (action === 'restore') row.reportCount = 0;
      await this.setStatus(m, row, target, adminId);
      await m.update(
        ContributionReport,
        { contributionId: id, status: ReportStatus.OPEN },
        {
          status: action === 'restore' ? ReportStatus.DISMISSED : ReportStatus.ACTIONED,
          resolvedById: adminId,
          resolvedAt: new Date(),
        },
      );
    });
    return { id, status: row.status };
  }

  // ─── Images ──────────────────────────────────────────────────────────

  async uploadImage(file: { originalname: string; buffer: Buffer; mimetype: string }) {
    const sniffed = sniffImageType(file.buffer);
    if (!sniffed) throw new BadRequestException('Only JPEG, PNG or WebP images can be attached.');
    const res = await this.storage.uploadBuffer({
      folder: 'discussion-images',
      originalName: file.originalname,
      buffer: file.buffer,
      contentType: sniffed, // trust the bytes, never the client-declared type
    });
    return { url: res.url };
  }

  // ─── Internals ───────────────────────────────────────────────────────

  private threadQuery(questionId: string, partId: string | null) {
    const qb = this.contribs.createQueryBuilder('c').where('c.questionId = :questionId', { questionId });
    return partId ? qb.andWhere('c.partId = :partId', { partId }) : qb.andWhere('c.partId IS NULL');
  }

  private async mustFind(id: string): Promise<QuestionContribution> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new NotFoundException('Contribution not found.');
    const row = await this.contribs.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Contribution not found.');
    return row;
  }

  private assertContentOk(content: string) {
    const verdict = checkContent(content);
    if (!verdict.ok) throw new BadRequestException(verdict.reason);
  }

  private validatedImages(urls?: string[]): string[] {
    const list = [...new Set((urls ?? []).filter(Boolean))];
    if (list.length > 3) throw new BadRequestException('You can attach at most 3 images.');
    for (const u of list) {
      if (!this.storage.isOwnedUrl(u, 'discussion-images')) {
        throw new BadRequestException('Images must be uploaded through the discussion uploader.');
      }
    }
    return list;
  }

  /** A reply must target a visible contribution of the SAME thread; replies to replies stay flat under the same parent. */
  private async resolveParent(
    dto: CreateContributionDto,
    partId: string | null,
  ): Promise<{ parentId: string | null; replyToId: string | null }> {
    if (!dto.parentId) return { parentId: null, replyToId: null };
    const target = await this.mustFind(dto.parentId);
    if (target.questionId !== dto.questionId || (target.partId ?? null) !== partId) {
      throw new BadRequestException('You can only reply within the same question discussion.');
    }
    if (target.status !== ContributionStatus.VISIBLE) {
      throw new BadRequestException('That contribution is no longer available to reply to.');
    }
    return target.parentId
      ? { parentId: target.parentId, replyToId: target.id }
      : { parentId: target.id, replyToId: null };
  }

  private async enforceRateLimit(userId: string) {
    const now = Date.now();
    const lastMinute = await this.contribs.count({ where: { userId, createdAt: MoreThan(new Date(now - 60_000)) } });
    if (lastMinute >= MAX_PER_MINUTE) {
      throw new HttpException('You are posting too quickly. Please wait a moment.', HttpStatus.TOO_MANY_REQUESTS);
    }
    const lastHour = await this.contribs.count({ where: { userId, createdAt: MoreThan(new Date(now - 3600_000)) } });
    if (lastHour >= MAX_PER_HOUR) {
      throw new HttpException('You have reached the hourly limit for contributions. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async findRecentDuplicate(
    userId: string,
    questionId: string,
    partId: string | null,
    parentId: string | null,
    content: string,
  ) {
    if (!content) return null;
    const recent = await this.contribs.find({
      where: { userId, questionId, createdAt: MoreThan(new Date(Date.now() - DUPLICATE_WINDOW_MS)) },
      order: { createdAt: 'DESC' },
      take: 5,
    });
    const fp = fingerprint(content);
    return (
      recent.find((r) => (r.partId ?? null) === partId && (r.parentId ?? null) === parentId && fingerprint(r.content) === fp) ??
      null
    );
  }

  /** Atomic reply-counter move; never goes below zero. */
  private async bumpReplyCount(m: EntityManager, parentId: string, delta: 1 | -1) {
    await m
      .createQueryBuilder()
      .update(QuestionContribution)
      .set({ replyCount: () => `GREATEST("replyCount" + ${delta}, 0)` })
      .where('id = :parentId', { parentId })
      .execute();
  }

  /**
   * Single place a contribution changes status, so the parent's visible-reply
   * counter always follows: a reply leaving "visible" decrements it, one
   * coming back increments it.
   */
  private async setStatus(
    m: EntityManager,
    row: QuestionContribution,
    next: ContributionStatus,
    moderatorId: string | null,
  ) {
    const was = row.status;
    if (was === next) {
      await m.save(row);
      return;
    }
    row.status = next;
    row.moderatedById = moderatorId;
    await m.save(row);
    if (row.parentId) {
      if (was === ContributionStatus.VISIBLE) await this.bumpReplyCount(m, row.parentId, -1);
      else if (next === ContributionStatus.VISIBLE) await this.bumpReplyCount(m, row.parentId, +1);
    }
  }

  private async authorsFor(rows: QuestionContribution[]): Promise<Map<string, User>> {
    const ids = [...new Set(rows.map((r) => r.userId).filter((x): x is string => !!x))];
    if (!ids.length) return new Map();
    const users = await this.users.find({
      where: { id: In(ids) },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });
    return new Map(users.map((u) => [u.id, u]));
  }

  /** Turns rows into API views using 3 batched queries regardless of page size. */
  private async present(actor: Actor, rows: QuestionContribution[]): Promise<ContributionView[]> {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const [authors, mine] = await Promise.all([
      this.authorsFor(rows),
      this.reactions.find({ where: { userId: actor.id, contributionId: In(ids) } }),
    ]);
    const myReaction = new Map(mine.map((r) => [r.contributionId, r.value]));

    const replyToIds = [...new Set(rows.map((r) => r.replyToId).filter((x): x is string => !!x))];
    const replyTargets = replyToIds.length
      ? await this.contribs.find({ where: { id: In(replyToIds) }, select: { id: true, userId: true, status: true } })
      : [];
    const targetAuthors = await this.authorsFor(replyTargets);
    const replyToName = new Map(
      replyTargets.map((t) => [
        t.id,
        t.status === ContributionStatus.VISIBLE && t.userId ? publicName(targetAuthors.get(t.userId)) : null,
      ]),
    );

    return rows.map((r) => {
      const visible = r.status === ContributionStatus.VISIBLE;
      const author = r.userId ? authors.get(r.userId) : undefined;
      return {
        id: r.id,
        questionId: r.questionId,
        partId: r.partId,
        parentId: r.parentId,
        replyToId: r.replyToId,
        replyToName: r.replyToId ? (replyToName.get(r.replyToId) ?? null) : null,
        author: visible ? { displayName: publicName(author), avatarUrl: author?.avatarUrl ?? null } : null,
        content: visible ? r.content : null,
        imageUrls: visible ? r.imageUrls : [],
        likeCount: r.likeCount,
        dislikeCount: r.dislikeCount,
        replyCount: r.replyCount,
        myReaction: (myReaction.get(r.id) ?? 0) as 1 | -1 | 0,
        state: r.status,
        isMine: r.userId === actor.id,
        edited: !!r.editedAt,
        createdAt: r.createdAt,
      };
    });
  }
}

/** Identify an image by its leading bytes (the client-declared MIME type is not trustworthy). */
export function sniffImageType(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}
