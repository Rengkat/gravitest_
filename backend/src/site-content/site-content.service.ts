import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Post } from 'src/blog/entities/post.entity';
import { SiteBlock } from './entities/site-block.entity';
import { ContentItem } from './entities/content-item.entity';
import {
  BLOCK_BY_KEY,
  BLOCK_DEFINITIONS,
  COLLECTION_BY_KEY,
  COLLECTION_DEFINITIONS,
  validateContent,
  type CollectionDefinition,
} from './site-content.schema';
import { SEED_AS_DRAFT, SEED_BLOCKS, SEED_ITEMS } from './site-content.seed';

const SEED_MARKER_KEY = '__seed.v1';
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Collections whose items are addressed by an immutable `slug`. */
const SLUGGED = new Set(['blog-categories', 'video-categories']);

export interface PublicItem {
  id: string;
  sortOrder: number;
  publishedAt: Date | null;
  [field: string]: unknown;
}

export interface AdminItem extends PublicItem {
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SiteContentService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SiteContentService.name);

  constructor(
    @InjectRepository(SiteBlock) private readonly blocks: Repository<SiteBlock>,
    @InjectRepository(ContentItem) private readonly items: Repository<ContentItem>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
  ) {}

  // ─── Schema ────────────────────────────────────────────────────────────

  getSchema() {
    return { blocks: BLOCK_DEFINITIONS, collections: COLLECTION_DEFINITIONS };
  }

  // ─── Blocks ────────────────────────────────────────────────────────────

  /** Public: every saved block, keyed. Blocks never saved are simply absent. */
  async getPublicBlocks(keys?: string[]): Promise<Record<string, Record<string, unknown>>> {
    const wanted = keys?.length ? keys.filter((k) => BLOCK_BY_KEY.has(k)) : [...BLOCK_BY_KEY.keys()];
    if (!wanted.length) return {};
    const rows = await this.blocks.find({ where: { key: In(wanted) } });
    return Object.fromEntries(rows.map((r) => [r.key, r.data]));
  }

  async getAdminBlocks() {
    const rows = await this.blocks.find({ where: { key: In([...BLOCK_BY_KEY.keys()]) } });
    const byKey = new Map(rows.map((r) => [r.key, r]));
    return BLOCK_DEFINITIONS.map((def) => ({
      key: def.key,
      data: byKey.get(def.key)?.data ?? {},
      updatedAt: byKey.get(def.key)?.updatedAt ?? null,
    }));
  }

  async saveBlock(key: string, raw: unknown, adminId: string | null) {
    const def = BLOCK_BY_KEY.get(key);
    if (!def) throw new NotFoundException(`Unknown content block "${key}".`);
    const data = validateContent(def.fields, raw);
    const saved = await this.blocks.save(
      this.blocks.create({ key, data, updatedById: adminId }),
    );
    this.logger.log(`Block "${key}" saved by ${adminId ?? 'unknown'}`);
    return { key: saved.key, data: saved.data, updatedAt: saved.updatedAt };
  }

  // ─── Collections ───────────────────────────────────────────────────────

  async listPublic(collection: string): Promise<PublicItem[]> {
    this.definition(collection);
    const rows = await this.items.find({
      where: { collection, isPublished: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return rows.map((r) => this.toPublic(r));
  }

  async listAdmin(collection: string): Promise<AdminItem[]> {
    this.definition(collection);
    const rows = await this.items.find({
      where: { collection },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return rows.map((r) => this.toAdmin(r));
  }

  async create(
    collection: string,
    raw: unknown,
    isPublished: boolean,
    adminId: string | null,
  ): Promise<AdminItem> {
    const def = this.definition(collection);
    const data = validateContent(def.fields, raw);
    await this.assertSlugOk(collection, data, null);

    const last = await this.items
      .createQueryBuilder('i')
      .select('MAX(i.sortOrder)', 'max')
      .where('i.collection = :collection', { collection })
      .getRawOne<{ max: number | null }>();

    const row = await this.items.save(
      this.items.create({
        collection,
        data,
        sortOrder: (last?.max ?? -1) + 1,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        updatedById: adminId,
      }),
    );
    return this.toAdmin(row);
  }

  async update(
    collection: string,
    id: string,
    raw: unknown,
    adminId: string | null,
  ): Promise<AdminItem> {
    const def = this.definition(collection);
    const row = await this.find(collection, id);
    const data = validateContent(def.fields, raw);

    if (SLUGGED.has(collection) && data.slug !== row.data.slug) {
      throw new BadRequestException(
        'The slug cannot be changed once created — posts and videos refer to it. Create a new one instead.',
      );
    }
    row.data = data;
    row.updatedById = adminId;
    return this.toAdmin(await this.items.save(row));
  }

  async setPublished(
    collection: string,
    id: string,
    isPublished: boolean,
    adminId: string | null,
  ): Promise<AdminItem> {
    this.definition(collection);
    const row = await this.find(collection, id);
    row.isPublished = isPublished;
    if (isPublished && !row.publishedAt) row.publishedAt = new Date();
    row.updatedById = adminId;
    return this.toAdmin(await this.items.save(row));
  }

  async reorder(collection: string, ids: string[]): Promise<AdminItem[]> {
    this.definition(collection);
    const rows = await this.items.find({ where: { collection } });
    const known = new Set(rows.map((r) => r.id));
    if (ids.some((id) => !known.has(id)) || new Set(ids).size !== ids.length) {
      throw new BadRequestException('The order contains an unknown or duplicated item.');
    }
    const position = new Map(ids.map((id, i) => [id, i]));
    // Items not mentioned keep their relative order after the listed ones.
    let tail = ids.length;
    const updated = rows
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((r) => {
        r.sortOrder = position.get(r.id) ?? tail++;
        return r;
      });
    await this.items.save(updated);
    return this.listAdmin(collection);
  }

  async remove(collection: string, id: string): Promise<{ message: string }> {
    this.definition(collection);
    const row = await this.find(collection, id);
    await this.assertNotInUse(collection, row);
    await this.items.remove(row);
    return { message: 'Deleted.' };
  }

  // ─── Cross-module helpers ──────────────────────────────────────────────

  /** Slugs of blog categories currently defined (published or not). */
  async blogCategorySlugs(): Promise<string[]> {
    const rows = await this.items.find({ where: { collection: 'blog-categories' } });
    return rows.map((r) => String(r.data.slug));
  }

  async assertBlogCategoryExists(slug: string): Promise<void> {
    const all = await this.blogCategorySlugs();
    if (!all.includes(slug)) {
      throw new BadRequestException(
        `Unknown blog category "${slug}". Create it under Website → Blog categories first.`,
      );
    }
  }

  // ─── Internals ─────────────────────────────────────────────────────────

  private definition(collection: string): CollectionDefinition {
    const def = COLLECTION_BY_KEY.get(collection);
    if (!def) throw new NotFoundException(`Unknown content collection "${collection}".`);
    return def;
  }

  private async find(collection: string, id: string): Promise<ContentItem> {
    // A malformed uuid would make Postgres throw; treat it as "not found".
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new NotFoundException('Item not found.');
    const row = await this.items.findOne({ where: { id, collection } });
    if (!row) throw new NotFoundException('Item not found.');
    return row;
  }

  private async assertSlugOk(
    collection: string,
    data: Record<string, unknown>,
    selfId: string | null,
  ): Promise<void> {
    if (!SLUGGED.has(collection)) return;
    const slug = String(data.slug ?? '');
    if (!SLUG_RE.test(slug) || slug === 'all') {
      throw new BadRequestException(
        'Slug must be lowercase letters, numbers and hyphens, and cannot be "all".',
      );
    }
    const clash = (await this.items.find({ where: { collection } })).find(
      (r) => r.data.slug === slug && r.id !== selfId,
    );
    if (clash) throw new ConflictException(`Slug "${slug}" is already in use.`);
  }

  private async assertNotInUse(collection: string, row: ContentItem): Promise<void> {
    if (collection === 'blog-categories') {
      const used = await this.posts.count({ where: { category: String(row.data.slug) } });
      if (used > 0) {
        throw new ConflictException(
          `${used} blog post${used === 1 ? '' : 's'} still use this category. Move them to another category first.`,
        );
      }
    }
    if (collection === 'video-categories') {
      const used = (await this.items.find({ where: { collection: 'videos' } })).filter(
        (v) => v.data.category === row.data.slug,
      ).length;
      if (used > 0) {
        throw new ConflictException(
          `${used} video${used === 1 ? '' : 's'} still use this category. Move them to another category first.`,
        );
      }
    }
  }

  private toPublic(r: ContentItem): PublicItem {
    return { ...r.data, id: r.id, sortOrder: r.sortOrder, publishedAt: r.publishedAt };
  }

  private toAdmin(r: ContentItem): AdminItem {
    return {
      ...this.toPublic(r),
      isPublished: r.isPublished,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  // ─── First-boot seeding ────────────────────────────────────────────────
  // The public site used to ship this content in the frontend bundle. It is
  // copied into the database ONCE so the site doesn't go blank on deploy;
  // from then on the database is the only source. A marker row guarantees we
  // never re-seed — so anything an admin deletes stays deleted.

  async onApplicationBootstrap(): Promise<void> {
    try {
      if (await this.blocks.findOne({ where: { key: SEED_MARKER_KEY } })) return;

      for (const [key, data] of Object.entries(SEED_BLOCKS)) {
        const def = BLOCK_BY_KEY.get(key);
        if (!def || (await this.blocks.findOne({ where: { key } }))) continue;
        await this.blocks.save(
          this.blocks.create({ key, data: validateContent(def.fields, data), updatedById: null }),
        );
      }

      for (const [collection, rows] of Object.entries(SEED_ITEMS)) {
        const def = COLLECTION_BY_KEY.get(collection);
        if (!def || (await this.items.count({ where: { collection } })) > 0) continue;
        let order = 0;
        for (const raw of rows) {
          await this.items.save(
            this.items.create({
              collection,
              data: validateContent(def.fields, raw),
              sortOrder: order++,
              isPublished: !SEED_AS_DRAFT.has(collection),
              publishedAt: SEED_AS_DRAFT.has(collection) ? null : new Date(),
              updatedById: null,
            }),
          );
        }
      }

      await this.blocks.save(
        this.blocks.create({ key: SEED_MARKER_KEY, data: { at: new Date().toISOString() }, updatedById: null }),
      );
      this.logger.log('Seeded initial public website content');
    } catch (err) {
      // Never block API boot on content seeding — the admin can fill it in by hand.
      this.logger.error(`Site content seeding failed: ${(err as Error).message}`);
    }
  }
}
