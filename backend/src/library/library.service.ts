import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, FindOptionsWhere } from 'typeorm';
import { LibraryContent } from './entities/library-contnent.entity';
import { LibraryAccess } from './entities/library-content-access.entity';
import { LibraryRating } from './entities/library-rating.entity';
import { CreateLibraryDto } from './dto/create-library.dto';
import { UpdateLibraryDto } from './dto/update-library.dto';
import { QueryLibraryDto } from './dto/query-library.dto';
import { RecordAccessDto } from './dto/record-access.dto';
import { AddBookmarkDto } from './dto/add-bookmark.dto';
import { RateContentDto } from './dto/rate-content.dto';
import { FeatureKey, PaymentGatewayCode, SubscriptionTier, UserRole } from 'src/common/enums/enums';
import { tierAtLeast } from 'src/common/subscription-tier.util';
import { EntitlementsService } from 'src/entitlements/entitlements.service';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginatedResult } from 'src/common/pagination/pagination.interface';
import { StorageService } from 'src/storage/storage.service';
import { QueueService } from 'src/queue/queue.service';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationChannel, NotificationType } from 'src/common/enums/enums';
import { resolveTemplate } from 'src/notifications/providers/notification-templates';
import { MailService } from 'src/mail/mail.service';
import { ContentAuditLogService } from './providers/content-audit-log.service';
import { LibraryPreviewService, PreviewView } from './providers/library-preview.service';
import { ContentPreviewStatus } from 'src/common/enums/enums';
import { ContentAuditAction, TransactionType } from 'src/common/enums/enums';
import { TransactionsService } from 'src/transactions/transactions.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { OnEvent } from '@nestjs/event-emitter';
import {
  TRANSACTION_SUCCESSFUL_EVENT,
  TransactionSuccessfulEvent,
} from 'src/transactions/events/transaction.events';

// ─── Types ────────────────────────────────────────────────────
interface AccessCheckResult {
  hasAccess: boolean;
  reason?: 'free' | 'owned' | 'subscription' | 'no_access' | 'expired' | 'admin';
  accessRecord?: LibraryAccess;
}

/**
 * How a library item is unlocked. Exactly one applies per item (the admin sets
 * one access model when creating it):
 *  - free          open to everyone
 *  - subscription  unlocked by having a plan at/above `requiredTier`
 *  - purchase      sold one by one for `priceKobo`, whatever plan the student is on
 */
export type LibraryAccessModel = 'free' | 'subscription' | 'purchase';

type AccessReason = NonNullable<AccessCheckResult['reason']>;

export type LibraryListItem = LibraryContent & {
  /** Can THIS student open it in full right now? */
  hasAccess: boolean;
  accessReason: AccessReason;
  accessModel: LibraryAccessModel;
};

@Injectable()
export class LibraryService {
  private readonly logger = new Logger(LibraryService.name);

  constructor(
    @InjectRepository(LibraryContent)
    private readonly contentRepo: Repository<LibraryContent>,

    @InjectRepository(LibraryAccess)
    private readonly accessRepo: Repository<LibraryAccess>,

    @InjectRepository(LibraryRating)
    private readonly ratingRepo: Repository<LibraryRating>,

    private readonly paginationProvider: PaginationProvider,
    private readonly storageService: StorageService,
    private readonly queueService: QueueService,
    private readonly userService: UserService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    private readonly auditLogService: ContentAuditLogService,
    private readonly transactionsService: TransactionsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly previewService: LibraryPreviewService,
    private readonly entitlements: EntitlementsService,
  ) {}

  // Resolves a user's actual current tier — there is no subscriptionTier claim
  // on the JWT (req.user is only ever { id, role, jti }, see
  // jwt-access.strategy.ts), so every access-check here must look it up.
  // Uses the shared resolver so expiry and the card-retry grace window are
  // judged identically to AI/exam gating (a payment-failed subscriber keeps
  // access for the grace period, then drops to FREE). Users with no paid plan
  // resolve to FREE, so `requiredTier: FREE` content is open to everyone.
  async resolveUserTier(userId: string): Promise<SubscriptionTier> {
    return this.entitlements.resolveTier(userId);
  }

  // ─── SECURE PLAYBACK / DOWNLOAD URL ────────────────────────
  /**
   * Resolves the actual file URL a client should use to stream/download
   * content, respecting access control:
   *  - Free content: `fileUrl` is already a public R2/CDN URL, returned as-is.
   *  - Gated content (tier/purchase-locked): `fileUrl` stores the R2 object
   *    *key*, never a public URL, so this mints a short-lived signed GET URL.
   * Throws ForbiddenException if the caller doesn't currently have access.
   */
  async getPlaybackUrl(
    contentId: string,
    userId: string,
    userTier?: SubscriptionTier,
    userRole?: UserRole,
  ): Promise<{ url: string; expiresInSeconds: number | null }> {
    const content = await this.findOne(contentId);

    // Same isActive gate as findOneForUser — a soft-deleted item must not
    // be directly playable/streamable via a stale link either.
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    if (!content.isActive && !isAdmin) {
      throw new NotFoundException(`Library content ${contentId} not found`);
    }

    const access = await this.checkAccess(contentId, userId, userTier, userRole);

    if (!access.hasAccess) {
      throw new ForbiddenException(
        access.reason === 'expired'
          ? 'Your access to this content has expired'
          : 'You do not have access to this content',
      );
    }

    // Free content (or any legacy row storing a full external URL) is
    // served as-is; everything else is treated as an R2 object key and
    // signed on demand.
    const isFullUrl = /^https?:\/\//i.test(content.fileUrl);
    if (content.isFree || isFullUrl) {
      return { url: content.fileUrl, expiresInSeconds: null };
    }

    const url = await this.storageService.getPresignedDownloadUrl(content.fileUrl);
    return { url, expiresInSeconds: 3600 };
  }

  // ─── FREE PREVIEW ────────────────────────────────────────
  /**
   * Server-generated, genuinely gated free preview for content the caller
   * doesn't (yet) have access to — a short re-encoded video/audio clip or a
   * page-truncated PDF, produced and cached by LibraryPreviewService /
   * LibraryPreviewProcessor. Unlike getPlaybackUrl(), this never throws for
   * lack of access; a preview is exactly for people who don't have it.
   *
   * Returns `not_applicable` (rather than an error) when there's nothing to
   * preview: the caller already has full access, the content is free (and
   * so already fully playable via /play), or the source is too short/not a
   * supported format to safely excerpt.
   */
  async getPreview(
    contentId: string,
    userId: string,
    userTier?: SubscriptionTier,
    userRole?: UserRole,
  ): Promise<PreviewView> {
    const content = await this.findOne(contentId);

    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    if (!content.isActive && !isAdmin) {
      throw new NotFoundException(`Library content ${contentId} not found`);
    }

    const access = await this.checkAccess(contentId, userId, userTier, userRole);
    if (access.hasAccess) {
      return { status: ContentPreviewStatus.NOT_APPLICABLE, message: 'You already have full access — use /play.' };
    }

    return this.previewService.getOrCreate(content);
  }

  /**
   * Metadata for the public detail view — strips `fileUrl`/`thumbnailUrl`
   * for content the caller can't yet access, so a locked item's real R2
   * key/URL is never leaked before purchase/upgrade.
   */
  async findOneForUser(
    contentId: string,
    userId: string,
    userTier?: SubscriptionTier,
    userRole?: UserRole,
  ): Promise<LibraryContent & { hasAccess: boolean; accessReason?: string }> {
    const content = await this.findOne(contentId);

    // A soft-deleted (isActive=false) item is hidden from every listing,
    // but findOne() has no isActive filter (admins need to be able to
    // find and republish archived items) — so without this check, a
    // student with an old link or a stale notification could still open
    // "deleted" content directly. Admins/super-admins are exempt so they
    // can still preview an archived item before deciding to republish it.
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    if (!content.isActive && !isAdmin) {
      throw new NotFoundException(`Library content ${contentId} not found`);
    }

    const access = await this.checkAccess(contentId, userId, userTier, userRole);

    const safe = { ...content, hasAccess: access.hasAccess, accessReason: access.reason };
    if (!access.hasAccess) {
      safe.fileUrl = '';
    }
    return safe;
  }

  // ─── ADMIN: CREATE ────────────────────────────────────────
  async create(
    dto: CreateLibraryDto,
    uploaderId?: string,
  ): Promise<LibraryContent> {
    // Exactly one access model must be set
    const accessOptions = [
      dto.isFree,
      dto.requiredTier,
      dto.priceKobo != null,
    ].filter(Boolean);

    if (accessOptions.length > 1) {
      throw new BadRequestException(
        'Specify only one of: isFree, requiredTier, or priceKobo',
      );
    }

    const content = this.contentRepo.create({
      ...dto,
      isFree: dto.isFree ?? false,
      examTypes: dto.examTypes ?? [],
      classLevels: dto.classLevels ?? [],
      tags: dto.tags ?? [],
      isDownloadable: dto.isDownloadable ?? true,
      drmProtected: dto.drmProtected ?? false,
      uploaderId: uploaderId ?? null,
      isActive: true,
      isPublished: false, // requires explicit publish step
    });

    const saved = await this.contentRepo.save(content);

    // req.user only ever carries { id, role, jti } (see
    // jwt-access.strategy.ts) — email/firstName for the confirmation
    // email below have to be looked up, not trusted from the request.
    const uploader = uploaderId ? await this.userService.findById(uploaderId).catch(() => null) : null;

    this.auditLogService
      .log({
        contentId: saved.id,
        action: ContentAuditAction.UPLOADED,
        description: `Uploaded "${saved.title}" (${saved.contentType})`,
        performedBy: uploader?.id ?? null,
      })
      .catch((err) => this.logger.error(`Audit log failed for ${saved.id}: ${err.message}`));

    // Confirmation email to the admin who uploaded it — best-effort,
    // never blocks the create response.
    if (uploader?.email) {
      this.mailService
        .sendAnnouncementEmail(uploader.email, {
          firstName: uploader.firstName ?? 'there',
          subject: `"${saved.title}" was created as a draft — Gravitest`,
          body: `Your library content "${saved.title}" was uploaded successfully and saved as an unpublished draft. Publish it from the admin library dashboard when it's ready to go live.`,
          buttonUrl: `/admin/library/${saved.id}`,
          buttonText: 'Review draft',
        })
        .catch((err) =>
          this.logger.error(`Upload confirmation email failed for ${saved.id}: ${err.message}`),
        );
    }

    return saved;
  }

  // ─── PUBLIC: LIST ─────────────────────────────────────────
  async findAll(
    query: QueryLibraryDto,
    userTier?: SubscriptionTier,
    userId?: string,
    userRole?: UserRole,
  ): Promise<PaginatedResult<LibraryListItem>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      contentType,
      subject,
      examType,
      classLevel,
      isFree,
      isPublished = true, // ← public default: only show published
      isActive = true, // ← public default: only show active
    } = query;

    const result = await this.buildQuery({
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      contentType,
      subject,
      examType,
      classLevel,
      isFree,
      isPublished,
      isActive,
    });

    // Tell the client, per item, whether THIS student already has access — so a
    // subscriber never sees "Unlock" on content their plan includes.
    return {
      ...result,
      data: await this.withAccess(result.data, userId, userTier, userRole),
    };
  }

  /**
   * Adds { hasAccess, accessReason, accessModel } to each item for one student.
   * Uses ONE query for the student's purchases on this page (no per-item
   * lookups) and the same rules as checkAccess().
   */
  private async withAccess(
    items: LibraryContent[],
    userId?: string,
    userTier?: SubscriptionTier,
    userRole?: UserRole,
  ): Promise<LibraryListItem[]> {
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    const records = new Map<string, LibraryAccess>();
    if (userId && items.length > 0) {
      const found = await this.accessRepo.find({
        where: { userId, contentId: In(items.map((i) => i.id)) },
      });
      for (const r of found) records.set(r.contentId, r);
    }
    // One lookup for the admin "subscription content is free" promo, not one per item.
    const promoOpen =
      !isAdmin && items.some((i) => !i.isFree && i.requiredTier)
        ? await this.entitlements.isOpenToEveryone(FeatureKey.LIBRARY_PREMIUM)
        : false;

    return items.map((c) => {
      const accessModel: LibraryAccessModel = c.isFree
        ? 'free'
        : c.requiredTier
          ? 'subscription'
          : 'purchase';

      let hasAccess = false;
      let accessReason: AccessReason = 'no_access';
      const record = records.get(c.id);

      if (isAdmin) {
        hasAccess = true;
        accessReason = 'admin';
      } else if (c.isFree) {
        hasAccess = true;
        accessReason = 'free';
      } else if (record) {
        const expired = record.isExpired();
        hasAccess = !expired;
        accessReason = expired ? 'expired' : 'owned';
      } else if (c.requiredTier) {
        if (promoOpen) {
          hasAccess = true;
          accessReason = 'free';
        } else if (userTier && tierAtLeast(userTier, c.requiredTier)) {
          hasAccess = true;
          accessReason = 'subscription';
        }
      }

      // Never leak the storage key of something the student can't open yet.
      return { ...c, fileUrl: hasAccess ? c.fileUrl : '', hasAccess, accessReason, accessModel };
    });
  }

  // ─── ADMIN: LIST ALL (incl. drafts & inactive) ────────────
  async findAllAdmin(
    query: QueryLibraryDto,
  ): Promise<PaginatedResult<LibraryContent>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      contentType,
      subject,
      examType,
      classLevel,
      isFree,
      isPublished,
      isActive,
    } = query;

    return this.buildQuery({
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      contentType,
      subject,
      examType,
      classLevel,
      isFree,
      isPublished,
      isActive,
    });
  }

  // ─── SINGLE CONTENT ───────────────────────────────────────
  async findOne(id: string): Promise<LibraryContent> {
    const content = await this.contentRepo.findOne({ where: { id } });
    if (!content)
      throw new NotFoundException(`Library content ${id} not found`);
    return content;
  }

  // ─── CHECK ACCESS ─────────────────────────────────────────
  /**
   * Priority chain:
   *  1. Content is free  → always allowed
   *  2. Active LibraryAccess record (purchased or gifted) → allowed / expired
   *  3. User's subscription tier meets requiredTier → allowed via subscription
   *  4. Everything else → no_access
   */
  async checkAccess(
    contentId: string,
    userId: string,
    userTier?: SubscriptionTier,
    userRole?: UserRole,
  ): Promise<AccessCheckResult> {
    // Admins/super-admins always have full access — needed so they can
    // preview any locked/paid content in full from the admin dashboard,
    // without the preview-length cap that applies to regular students.
    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
      return { hasAccess: true, reason: 'admin' };
    }

    const content = await this.findOne(contentId);

    if (content.isFree) return { hasAccess: true, reason: 'free' };

    const accessRecord = await this.accessRepo.findOne({
      where: { userId, contentId },
    });

    if (accessRecord) {
      if (accessRecord.isExpired())
        return { hasAccess: false, reason: 'expired' };
      return { hasAccess: true, reason: 'owned', accessRecord };
    }

    if (content.requiredTier) {
      // Admin promo switch: "subscription-locked library content is free"
      // (globally, or until a set time). Only affects tier-locked items.
      if (await this.entitlements.isOpenToEveryone(FeatureKey.LIBRARY_PREMIUM)) {
        return { hasAccess: true, reason: 'free' };
      }
      if (userTier && tierAtLeast(userTier, content.requiredTier)) {
        return { hasAccess: true, reason: 'subscription' };
      }
    }

    return { hasAccess: false, reason: 'no_access' };
  }

  /**
   * Items this student bought (or was granted through a payment), newest first.
   * Admin view. Rows without a payment are reading-progress records, not purchases.
   */
  async listPurchasesForUser(userId: string) {
    const rows = await this.accessRepo
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.content', 'c')
      .where('a.userId = :userId', { userId })
      .andWhere('a.paymentId IS NOT NULL')
      .orderBy('a.createdAt', 'DESC')
      .getMany();
    return rows.map((a) => ({
      contentId: a.contentId,
      title: a.content.title,
      contentType: a.contentType,
      purchasedAt: a.createdAt,
      expiresAt: a.expiresAt,
      expired: a.isExpired(),
      priceKobo: a.content.priceKobo,
    }));
  }

  // ─── GRANT ACCESS (called by Payments module) ─────────────
  async grantAccess(
    userId: string,
    contentId: string,
    paymentId?: string,
    expiresAt?: Date,
    grantedBy?: string,
  ): Promise<LibraryAccess> {
    const content = await this.findOne(contentId);

    const existing = await this.accessRepo.findOne({
      where: { userId, contentId },
    });

    let saved: LibraryAccess;
    if (existing) {
      // Re-purchase: refresh expiry and payment reference
      existing.expiresAt = expiresAt ?? null;
      existing.paymentId = paymentId ?? null;
      saved = await this.accessRepo.save(existing);
    } else {
      const access = this.accessRepo.create({
        userId,
        contentId,
        contentType: content.contentType,
        paymentId: paymentId ?? null,
        expiresAt: expiresAt ?? null,
      });

      await this.contentRepo.increment({ id: contentId }, 'totalDownloads', 1);

      saved = await this.accessRepo.save(access);
    }

    this.auditLogService
      .log({
        contentId,
        action: ContentAuditAction.ACCESS_GRANTED,
        description: paymentId
          ? `Access granted to user ${userId} via purchase (payment ${paymentId})`
          : `Access manually granted to user ${userId}`,
        performedBy: grantedBy ?? null,
        metadata: { userId, paymentId: paymentId ?? null },
      })
      .catch((err) => this.logger.error(`Audit log failed for ${contentId}: ${err.message}`));

    return saved;
  }

  /**
   * Admin view of everyone who has access to a piece of content — backs
   * the "Access" tab on the admin content detail page. Joins to User for
   * a display name/email since LibraryAccess only stores userId.
   */
  async listAccessForContent(contentId: string): Promise<
    {
      id: string;
      userId: string;
      userName: string;
      userEmail: string;
      grantedAt: string;
      expiresAt: string | null;
      isExpired: boolean;
      paymentId: string | null;
      viewCount: number;
      lastAccessedAt: string | null;
    }[]
  > {
    const rows = await this.accessRepo
      .createQueryBuilder('a')
      .innerJoin(User, 'u', 'u.id = a.user_id')
      .where('a.contentId = :contentId', { contentId })
      .select([
        'a.id AS id',
        'a.userId AS "userId"',
        'u.firstName AS "firstName"',
        'u.lastName AS "lastName"',
        'u.email AS "userEmail"',
        'a.createdAt AS "grantedAt"',
        'a.expiresAt AS "expiresAt"',
        'a.paymentId AS "paymentId"',
        'a.viewCount AS "viewCount"',
        'a.lastAccessedAt AS "lastAccessedAt"',
      ])
      .orderBy('a.createdAt', 'DESC')
      .getRawMany();

    const now = Date.now();
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: `${r.firstName} ${r.lastName}`.trim(),
      userEmail: r.userEmail,
      grantedAt: r.grantedAt,
      expiresAt: r.expiresAt,
      isExpired: r.expiresAt ? new Date(r.expiresAt).getTime() < now : false,
      paymentId: r.paymentId,
      viewCount: r.viewCount,
      lastAccessedAt: r.lastAccessedAt,
    }));
  }

  /**
   * Admin revoking a manually- or payment-granted access record. Deletes
   * the row outright rather than soft-expiring it — if you want an audit
   * trail of revocations, that needs a separate log table (see the note
   * on ActivityTab.tsx on the frontend, which has the same gap).
   */
  async revokeAccess(
    contentId: string,
    userId: string,
    revokedBy?: string,
  ): Promise<{ revoked: boolean }> {
    const result = await this.accessRepo.delete({ contentId, userId });
    const revoked = (result.affected ?? 0) > 0;

    if (revoked) {
      this.auditLogService
        .log({
          contentId,
          action: ContentAuditAction.ACCESS_REVOKED,
          description: `Access revoked for user ${userId}`,
          performedBy: revokedBy ?? null,
          metadata: { userId },
        })
        .catch((err) => this.logger.error(`Audit log failed for ${contentId}: ${err.message}`));
    }

    return { revoked };
  }

  // ─── PURCHASE ──────────────────────────────────────────────
  /**
   * Starts a Paystack checkout for a one-time content purchase. This is
   * the flow TransactionType.CONTENT_PURCHASE was reserved for but never
   * wired up — see the comment on that enum value.
   *
   * Actual access is granted asynchronously by handleContentPurchased()
   * below, once the payment actually succeeds (webhook or verify) — not
   * here. This method only starts checkout.
   */
  async initiatePurchase(
    contentId: string,
    userId: string,
    gateway?: PaymentGatewayCode,
  ): Promise<{ authorizationUrl: string; reference: string; gateway: string }> {
    const content = await this.findOne(contentId);

    if (content.isFree) {
      throw new BadRequestException('This content is free — no purchase needed. Call grant/record-access instead.');
    }
    if (!content.priceKobo || content.priceKobo <= 0) {
      throw new BadRequestException('This content has no purchase price configured.');
    }

    const userTier = await this.resolveUserTier(userId);
    const access = await this.checkAccess(contentId, userId, userTier);
    if (access.hasAccess) {
      throw new BadRequestException(
        access.reason === 'subscription'
          ? "You already have access to this via your subscription — no need to purchase it separately."
          : 'You already own this content.',
      );
    }

    // Paystack needs a real email to initialize checkout — req.user only
    // ever carries { id, role, jti } (see jwt-access.strategy.ts), so this
    // has to be looked up rather than trusted from the request.
    const user = await this.userService.findById(userId);

    const { transaction, authorizationUrl } = await this.transactionsService.initializeTransaction({
      userId,
      email: user.email,
      amountKobo: content.priceKobo,
      type: TransactionType.CONTENT_PURCHASE,
      purpose: `Purchase: ${content.title}`,
      relatedEntityType: 'library_content',
      relatedEntityId: content.id,
      gateway,
      metadata: { contentTitle: content.title, contentType: content.contentType },
    });

    return { authorizationUrl, reference: transaction.reference, gateway: transaction.gateway };
  }

  /**
   * Mirrors SubscriptionsService.handleTransactionSuccessful — same
   * TRANSACTION_SUCCESSFUL_EVENT, filtered to this module's transaction
   * type. Grants access the moment payment actually clears, whether that
   * happens via the user returning to /verify or via the Paystack webhook
   * landing first (whichever wins the race — grantAccess is idempotent on
   * repeat calls for the same user+content).
   */
  @OnEvent(TRANSACTION_SUCCESSFUL_EVENT)
  async handleContentPurchased(event: TransactionSuccessfulEvent) {
    if (event.type !== TransactionType.CONTENT_PURCHASE || event.relatedEntityType !== 'library_content') {
      return;
    }
    if (!event.relatedEntityId) {
      this.logger.warn(`CONTENT_PURCHASE transaction ${event.transactionId} has no relatedEntityId — can't grant access.`);
      return;
    }

    try {
      await this.grantAccess(event.userId, event.relatedEntityId, event.transactionId, undefined, undefined);
      this.logger.log(
        `Granted access to content ${event.relatedEntityId} for user ${event.userId} after purchase (txn ${event.transactionId})`,
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to grant access after content purchase (txn ${event.transactionId}): ${err.message}`,
      );
    }
  }

  // ─── RECORD VIEW / PROGRESS ───────────────────────────────
  async recordAccess(
    userId: string,
    dto: RecordAccessDto,
  ): Promise<LibraryAccess> {
    const { contentId, progressPercent } = dto;

    const access = await this.accessRepo.findOne({
      where: { userId, contentId },
    });
    if (!access)
      throw new ForbiddenException('Access not granted for this content');

    access.recordAccess();
    if (progressPercent != null) access.updateProgress(progressPercent);

    await this.contentRepo.increment({ id: contentId }, 'totalViews', 1);

    return this.accessRepo.save(access);
  }

  // ─── BOOKMARKS ────────────────────────────────────────────
  async addBookmark(
    userId: string,
    contentId: string,
    dto: AddBookmarkDto,
  ): Promise<LibraryAccess> {
    const access = await this.accessRepo.findOne({
      where: { userId, contentId },
    });
    if (!access)
      throw new ForbiddenException('Access not granted for this content');

    const bookmarks = access.bookmarks ?? [];
    bookmarks.push({ ...dto, createdAt: new Date().toISOString() });
    access.bookmarks = bookmarks;

    return this.accessRepo.save(access);
  }

  async removeBookmark(
    userId: string,
    contentId: string,
    position: number,
  ): Promise<LibraryAccess> {
    const access = await this.accessRepo.findOne({
      where: { userId, contentId },
    });
    if (!access)
      throw new ForbiddenException('Access not granted for this content');

    access.bookmarks = (access.bookmarks ?? []).filter(
      (b) => b.position !== position,
    );
    return this.accessRepo.save(access);
  }

  // ─── RATINGS ────────────────────────────────────────────────
  /**
   * Create or update the caller's rating for a piece of content (one per
   * user, enforced by the unique index on libraryContentId+userId).
   * Requires the user to currently have access — prevents drive-by
   * ratings on paid content nobody has actually engaged with, and
   * matches the same access check used to reveal the file itself.
   */
  async rateContent(userId: string, contentId: string, dto: RateContentDto): Promise<LibraryRating> {
    const content = await this.findOne(contentId);
    const access = await this.checkAccess(contentId, userId);
    if (!access.hasAccess) {
      throw new ForbiddenException('You need access to this content before you can rate it.');
    }

    const user = await this.userService.findById(userId);
    const existing = await this.ratingRepo.findOne({ where: { libraryContentId: contentId, userId } });

    const saved = await this.ratingRepo.save(
      this.ratingRepo.create({
        ...existing,
        libraryContentId: contentId,
        userId,
        userDisplayName: `${user.firstName} ${user.lastName?.charAt(0) ?? ''}.`.trim(),
        rating: dto.rating,
        review: dto.review ?? existing?.review ?? null,
      }),
    );

    await this.recalculateAverageRating(contentId);

    // Alert admins on low ratings (content quality signal) — in-app only,
    // to avoid flooding admin inboxes with an email per 5-star rating too.
    if (dto.rating <= 2) {
      this.notificationsService
        .notifyAdmins({
          type: NotificationType.SYSTEM,
          context: {
            title: 'Low rating received on library content',
            body: `"${content.title}" just received a ${dto.rating}/5 rating${dto.review ? `: "${dto.review.slice(0, 140)}"` : '.'}`,
            actionUrl: `/admin/library/${contentId}`,
          },
          actionUrl: `/admin/library/${contentId}`,
          channels: [NotificationChannel.IN_APP],
        })
        .catch((err) => this.logger.error(`Low-rating admin alert failed for ${contentId}: ${err.message}`));
    }

    return saved;
  }

  async listRatings(
    contentId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<LibraryRating>> {
    await this.findOne(contentId); // 404 guard
    return this.paginationProvider.paginate(
      this.ratingRepo,
      { page, limit },
      { where: { libraryContentId: contentId }, order: { createdAt: 'DESC' } },
    );
  }

  async getMyRating(userId: string, contentId: string): Promise<LibraryRating | null> {
    return this.ratingRepo.findOne({ where: { libraryContentId: contentId, userId } });
  }

  async deleteMyRating(userId: string, contentId: string): Promise<{ message: string }> {
    const existing = await this.ratingRepo.findOne({ where: { libraryContentId: contentId, userId } });
    if (!existing) throw new NotFoundException('You have not rated this content.');
    await this.ratingRepo.remove(existing);
    await this.recalculateAverageRating(contentId);
    return { message: 'Rating removed' };
  }

  async markRatingHelpful(ratingId: string): Promise<LibraryRating> {
    const rating = await this.ratingRepo.findOne({ where: { id: ratingId } });
    if (!rating) throw new NotFoundException('Rating not found');
    rating.helpfulCount += 1;
    return this.ratingRepo.save(rating);
  }

  private async recalculateAverageRating(contentId: string): Promise<void> {
    const { avg, count } = await this.ratingRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.libraryContentId = :contentId', { contentId })
      .getRawOne();

    await this.contentRepo.update(contentId, {
      averageRating: avg ? Math.round(Number(avg) * 10) / 10 : 0,
      totalRatings: Number(count) || 0,
    });
  }

  // ─── USER LIBRARY ─────────────────────────────────────────
  async getUserLibrary(userId: string): Promise<LibraryAccess[]> {
    return this.accessRepo.find({
      where: { userId },
      relations: ['content'],
      order: { lastAccessedAt: 'DESC' },
    });
  }

  async getUserAccessRecord(
    userId: string,
    contentId: string,
  ): Promise<LibraryAccess | null> {
    return this.accessRepo.findOne({
      where: { userId, contentId },
      relations: ['content'],
    });
  }

  // ─── ADMIN: UPDATE ────────────────────────────────────────
  async update(id: string, dto: UpdateLibraryDto, adminUserId?: string): Promise<LibraryContent> {
    const content = await this.findOne(id);
    const oldPriceKobo = content.priceKobo;
    Object.assign(content, dto);

    // Same "exactly one access model" rule as create() — checked on the
    // merged result so it also catches a caller that sets one field now
    // and forgets a stale value from an earlier update (e.g. switching
    // from a one-time-purchase price to a subscription tier must send
    // `priceKobo: null` to actually clear it, not just omit the key —
    // JSON drops omitted/undefined keys entirely, so Object.assign above
    // would otherwise leave the old value in place).
    const accessOptions = [content.isFree, content.requiredTier, content.priceKobo != null].filter(
      Boolean,
    );
    if (accessOptions.length > 1) {
      throw new BadRequestException(
        'Specify only one of: isFree, requiredTier, or priceKobo — send the other two as null to clear them',
      );
    }

    const saved = await this.contentRepo.save(content);

    const changedFields = Object.keys(dto);
    this.auditLogService
      .log({
        contentId: id,
        action: ContentAuditAction.EDITED,
        description: `Edited: ${changedFields.join(', ') || 'no fields changed'}`,
        performedBy: adminUserId ?? null,
        metadata: { changedFields },
      })
      .catch((err) => this.logger.error(`Audit log failed for ${id}: ${err.message}`));

    if (dto.priceKobo !== undefined && dto.priceKobo !== oldPriceKobo) {
      this.auditLogService
        .log({
          contentId: id,
          action: ContentAuditAction.PRICE_CHANGED,
          description: `Price changed from ${oldPriceKobo ?? 'free'} to ${dto.priceKobo ?? 'free'} kobo`,
          performedBy: adminUserId ?? null,
          metadata: { oldPriceKobo, newPriceKobo: dto.priceKobo },
        })
        .catch((err) => this.logger.error(`Audit log failed for ${id}: ${err.message}`));
    }

    return saved;
  }

  // ─── ADMIN: PUBLISH / UNPUBLISH ───────────────────────────
  async publish(id: string, adminUserId?: string): Promise<LibraryContent> {
    const content = await this.findOne(id);
    content.isPublished = true;
    // Publishing a previously-deleted (isActive=false) item should bring
    // it back — otherwise it ends up isPublished=true + isActive=false,
    // which the admin UI shows as "published" but findAll()'s public
    // query (which requires isActive=true too) will never return, so
    // students see nothing. "Publish" should mean "make this live."
    content.isActive = true;
    const saved = await this.contentRepo.save(content);
    this.queueService
      .queueContentIndexing({ action: 'index', contentId: id })
      .catch((err) => this.logger.error(`Content-indexing enqueue failed for ${id}: ${err.message}`));

    this.auditLogService
      .log({
        contentId: id,
        action: ContentAuditAction.PUBLISHED,
        description: `Published "${saved.title}"`,
        performedBy: adminUserId ?? null,
      })
      .catch((err) => this.logger.error(`Audit log failed for ${id}: ${err.message}`));

    // Broadcast NEW_CONTENT to all students, both in-app and email —
    // each channel/user still respects their own newContentAlerts +
    // emailEnabled preferences (see NotificationsService.shouldSkip).
    //
    // NOTE: this notifies ALL students rather than only "subscribers of
    // that subject/exam type" — there's no subject-subscription entity
    // in this schema yet. If you want subject-scoped targeting, add a
    // subscription table (userId, subject/examType) and swap the
    // `targetRole: 'student'` broadcast below for a userIds list built
    // from that table.
    const context = {
      contentTitle: saved.title,
      subject: saved.subject,
      contentId: saved.id,
    };
    const template = resolveTemplate(NotificationType.NEW_CONTENT, context);
    Promise.all([
      this.notificationsService.broadcast({
        type: NotificationType.NEW_CONTENT,
        channel: NotificationChannel.IN_APP,
        targetRole: 'student',
        title: template.title,
        body: template.body,
        actionUrl: template.actionUrl,
        metadata: context,
      }),
      this.notificationsService.broadcast({
        type: NotificationType.NEW_CONTENT,
        channel: NotificationChannel.EMAIL,
        targetRole: 'student',
        title: template.title,
        body: template.body,
        actionUrl: template.actionUrl,
        metadata: context,
      }),
    ]).catch((err) =>
      this.logger.error(`NEW_CONTENT broadcast failed for content ${id}: ${err.message}`),
    );

    return saved;
  }

  async unpublish(id: string, adminUserId?: string): Promise<LibraryContent> {
    const content = await this.findOne(id);
    content.isPublished = false;
    const saved = await this.contentRepo.save(content);
    this.queueService
      .queueContentIndexing({ action: 'remove', contentId: id })
      .catch((err) => this.logger.error(`Content-indexing enqueue failed for ${id}: ${err.message}`));

    this.auditLogService
      .log({
        contentId: id,
        action: ContentAuditAction.UNPUBLISHED,
        description: `Unpublished "${saved.title}"`,
        performedBy: adminUserId ?? null,
      })
      .catch((err) => this.logger.error(`Audit log failed for ${id}: ${err.message}`));

    return saved;
  }

  // ─── ADMIN: SOFT DELETE ───────────────────────────────────
  async remove(id: string, adminUserId?: string): Promise<{ message: string }> {
    const content = await this.findOne(id);
    content.isActive = false;
    await this.contentRepo.save(content);
    this.queueService
      .queueContentIndexing({ action: 'remove', contentId: id })
      .catch((err) => this.logger.error(`Content-indexing enqueue failed for ${id}: ${err.message}`));

    this.auditLogService
      .log({
        contentId: id,
        action: ContentAuditAction.DELETED,
        description: `Deactivated "${content.title}"`,
        performedBy: adminUserId ?? null,
      })
      .catch((err) => this.logger.error(`Audit log failed for ${id}: ${err.message}`));

    return { message: `Content ${id} deactivated` };
  }

  // ─── ADMIN: STATS ─────────────────────────────────────────
  async getStats() {
    const [total, published, free, paid] = await Promise.all([
      this.contentRepo.count(),
      this.contentRepo.count({ where: { isPublished: true } }),
      this.contentRepo.count({ where: { isFree: true } }),
      this.contentRepo.count({ where: { isFree: false } }),
    ]);

    const [topViewed, topDownloaded] = await Promise.all([
      this.contentRepo.find({
        where: { isPublished: true },
        order: { totalViews: 'DESC' },
        take: 5,
      }),
      this.contentRepo.find({
        where: { isPublished: true },
        order: { totalDownloads: 'DESC' },
        take: 5,
      }),
    ]);

    return { total, published, free, paid, topViewed, topDownloaded };
  }

  private async buildQuery(params: {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    search?: string;
    contentType?: string;
    subject?: string;
    examType?: string;
    classLevel?: string;
    isFree?: boolean;
    isPublished?: boolean; // undefined = no filter
    isActive?: boolean; // undefined = no filter
  }): Promise<PaginatedResult<LibraryContent>> {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      contentType,
      subject,
      examType,
      classLevel,
      isFree,
      isPublished,
      isActive,
    } = params;

    const qb = this.contentRepo.createQueryBuilder('c');

    // Only add WHERE clauses when the value is explicitly set
    if (isPublished !== undefined)
      qb.andWhere('c.isPublished = :isPublished', { isPublished });
    if (isActive !== undefined)
      qb.andWhere('c.isActive = :isActive', { isActive });
    if (contentType !== undefined)
      qb.andWhere('c.contentType = :contentType', { contentType });
    if (subject !== undefined) qb.andWhere('c.subject = :subject', { subject });
    if (isFree !== undefined) qb.andWhere('c.isFree = :isFree', { isFree });

    // Array column filters
    if (examType) qb.andWhere(':examType = ANY(c.examTypes)', { examType });
    if (classLevel)
      qb.andWhere(':classLevel = ANY(c.classLevels)', { classLevel });

    // Full-text search
    if (search) {
      qb.andWhere(
        '(c.title ILIKE :q OR c.description ILIKE :q OR c.topic ILIKE :q)',
        { q: `%${search}%` },
      );
    }

    qb.orderBy(`c.${sortBy}`, sortOrder);

    return this.paginationProvider.paginateQueryBuilder(qb, { page, limit });
  }
}
