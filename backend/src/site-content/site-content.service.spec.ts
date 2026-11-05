import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SiteContentService } from './site-content.service';
import type { ContentItem } from './entities/content-item.entity';

const UUID = '11111111-1111-1111-1111-111111111111';

function setup(rows: Partial<ContentItem>[] = [], postsUsingCategory = 0) {
  const store = rows.map((r, i) => ({ id: UUID.replace(/1/g, String(i + 1)), sortOrder: i, isPublished: false, publishedAt: null, ...r })) as ContentItem[];
  const items = {
    find: jest.fn(async ({ where }: { where: Partial<ContentItem> }) => store.filter((r) => !where.collection || r.collection === where.collection)),
    findOne: jest.fn(async ({ where }: { where: Partial<ContentItem> }) => store.find((r) => r.id === where.id && r.collection === where.collection) ?? null),
    save: jest.fn(async (r: ContentItem) => r),
    create: jest.fn((r: Partial<ContentItem>) => ({ id: 'new', createdAt: new Date(), updatedAt: new Date(), ...r }) as ContentItem),
    remove: jest.fn(async (r: ContentItem) => r),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({ select: () => ({ where: () => ({ getRawOne: async () => ({ max: store.length - 1 }) }) }) })),
  };
  const blocks = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn() };
  const posts = { count: jest.fn().mockResolvedValue(postsUsingCategory) };
  const svc = new SiteContentService(blocks as never, items as never, posts as never);
  return { svc, items, store };
}

describe('SiteContentService', () => {
  it('creates items as DRAFTS unless explicitly published', async () => {
    const { svc } = setup();
    const draft = await svc.create('testimonials', { name: 'A', quote: 'q' }, false, null);
    expect(draft.isPublished).toBe(false);
    expect(draft.publishedAt).toBeNull();
    const live = await svc.create('testimonials', { name: 'B', quote: 'q' }, true, null);
    expect(live.isPublished).toBe(true);
    expect(live.publishedAt).toBeInstanceOf(Date);
  });

  it('serves only published items publicly', async () => {
    const { svc, items } = setup([{ collection: 'faqs', isPublished: true, data: { question: 'q' } }]);
    await svc.listPublic('faqs');
    expect(items.find).toHaveBeenCalledWith(expect.objectContaining({ where: { collection: 'faqs', isPublished: true } }));
  });

  it('rejects unknown collections and blocks', async () => {
    const { svc } = setup();
    await expect(svc.listPublic('nope')).rejects.toBeInstanceOf(NotFoundException);
    await expect(svc.saveBlock('nope', {}, null)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invalid content with a 400 listing the problems', async () => {
    const { svc } = setup();
    await expect(svc.create('videos', { title: 'x', videoUrl: 'javascript:1' }, false, null)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses duplicate or malformed category slugs', async () => {
    const { svc } = setup([{ collection: 'blog-categories', data: { slug: 'jamb', label: 'J' } }]);
    await expect(svc.create('blog-categories', { slug: 'jamb', label: 'Again' }, true, null)).rejects.toBeInstanceOf(ConflictException);
    await expect(svc.create('blog-categories', { slug: 'Bad Slug', label: 'x' }, true, null)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.create('blog-categories', { slug: 'all', label: 'x' }, true, null)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('never lets a category slug change after creation', async () => {
    const { svc, store } = setup([{ collection: 'blog-categories', data: { slug: 'jamb', label: 'J' } }]);
    await expect(svc.update('blog-categories', store[0].id, { slug: 'renamed', label: 'J' }, null)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.update('blog-categories', store[0].id, { slug: 'jamb', label: 'Renamed' }, null)).resolves.toBeDefined();
  });

  it('blocks deleting a blog category that still has posts, but allows an empty one', async () => {
    const used = setup([{ collection: 'blog-categories', data: { slug: 'jamb', label: 'J' } }], 3);
    await expect(used.svc.remove('blog-categories', used.store[0].id)).rejects.toBeInstanceOf(ConflictException);
    expect(used.items.remove).not.toHaveBeenCalled();

    const empty = setup([{ collection: 'blog-categories', data: { slug: 'jamb', label: 'J' } }], 0);
    await empty.svc.remove('blog-categories', empty.store[0].id);
    expect(empty.items.remove).toHaveBeenCalled();
  });

  it('blocks deleting a video category that still has videos', async () => {
    const { svc, store } = setup([
      { collection: 'video-categories', data: { slug: 'tips', label: 'Tips' } },
      { collection: 'videos', data: { category: 'tips', title: 'v' } },
    ]);
    await expect(svc.remove('video-categories', store[0].id)).rejects.toBeInstanceOf(ConflictException);
  });

  it('treats a malformed id as not found instead of letting the DB throw', async () => {
    const { svc } = setup();
    await expect(svc.setPublished('faqs', 'not-a-uuid', true, null)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('publish stamps publishedAt once and unpublish keeps the original date', async () => {
    const { svc, store } = setup([{ collection: 'faqs', data: { question: 'q' } }]);
    const pub = await svc.setPublished('faqs', store[0].id, true, null);
    const firstDate = pub.publishedAt;
    expect(firstDate).toBeInstanceOf(Date);
    const off = await svc.setPublished('faqs', store[0].id, false, null);
    expect(off.isPublished).toBe(false);
    expect(off.publishedAt).toBe(firstDate);
  });

  it('rejects a reorder that mentions unknown or duplicate ids', async () => {
    const { svc, store } = setup([{ collection: 'faqs', data: {} }, { collection: 'faqs', data: {} }]);
    await expect(svc.reorder('faqs', [store[0].id, 'x'])).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.reorder('faqs', [store[0].id, store[0].id])).rejects.toBeInstanceOf(BadRequestException);
  });

  it('assertBlogCategoryExists points the admin at where to create a missing category', async () => {
    const { svc } = setup([{ collection: 'blog-categories', data: { slug: 'jamb' } }]);
    await expect(svc.assertBlogCategoryExists('jamb')).resolves.toBeUndefined();
    await expect(svc.assertBlogCategoryExists('ghost')).rejects.toThrow(/Create it under Website/);
  });
});
