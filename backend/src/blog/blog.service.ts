import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import {
  AdminPostFilterDto,
  CreatePostDto,
  PostFilterDto,
  UpdatePostDto,
} from './dto/post.dto';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  // ─── PUBLIC ────────────────────────────────────────────────────────────

  async findPublished(filters: PostFilterDto) {
    const { page = 1, limit = 12, category, search } = filters;
    const qb = this.postRepo
      .createQueryBuilder('p')
      .where('p.isPublished = true');

    if (category) qb.andWhere('p.category = :category', { category });
    if (search) {
      qb.andWhere('(p.title ILIKE :s OR p.excerpt ILIKE :s)', {
        s: `%${search}%`,
      });
    }

    qb.orderBy('p.publishedAt', 'DESC');
    return this.paginationProvider.paginateQueryBuilder(qb, { page, limit });
  }

  async findFeatured(): Promise<Post | null> {
    return this.postRepo.findOne({
      where: { isPublished: true, isFeatured: true },
      order: { publishedAt: 'DESC' },
    });
  }

  // Increments the view counter on every real read — best-effort, not
  // meant to be a precise unique-visitor count (no dedup by IP/session),
  // just a simple popularity signal for the admin dashboard.
  async findBySlugAndIncrementViews(slug: string): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { slug, isPublished: true },
    });
    if (!post) {
      throw new NotFoundException(`Post "${slug}" not found.`);
    }
    post.viewCount += 1;
    await this.postRepo.save(post);
    return post;
  }

  async findRelated(post: Post, limit = 3): Promise<Post[]> {
    return this.postRepo.find({
      where: { category: post.category, isPublished: true },
      order: { publishedAt: 'DESC' },
      take: limit + 1,
    }).then((posts) => posts.filter((p) => p.id !== post.id).slice(0, limit));
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────────

  async findAllForAdmin(filters: AdminPostFilterDto) {
    const { page = 1, limit = 20, category, search, isPublished } = filters;
    const qb = this.postRepo.createQueryBuilder('p');

    if (category) qb.andWhere('p.category = :category', { category });
    if (isPublished !== undefined) {
      qb.andWhere('p.isPublished = :isPublished', { isPublished });
    }
    if (search) {
      qb.andWhere('(p.title ILIKE :s OR p.excerpt ILIKE :s)', {
        s: `%${search}%`,
      });
    }

    qb.orderBy('p.createdAt', 'DESC');
    return this.paginationProvider.paginateQueryBuilder(qb, { page, limit });
  }

  async findOneForAdmin(id: string): Promise<Post> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException(`Post "${id}" not found.`);
    return post;
  }

  async create(dto: CreatePostDto): Promise<Post> {
    const slug = dto.slug ?? this.slugify(dto.title);
    await this.ensureSlugAvailable(slug);

    const post = this.postRepo.create({
      ...dto,
      slug,
      authorRole: dto.authorRole ?? null,
      authorInitials: dto.authorInitials ?? this.initialsFrom(dto.authorName),
      coverImageUrl: dto.coverImageUrl ?? null,
      readTimeMinutes: dto.readTimeMinutes ?? this.estimateReadTime(dto.content),
      isPublished: dto.isPublished ?? false,
      isFeatured: dto.isFeatured ?? false,
      publishedAt: dto.isPublished ? new Date() : null,
    });

    return this.postRepo.save(post);
  }

  async update(id: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.findOneForAdmin(id);

    if (dto.slug && dto.slug !== post.slug) {
      await this.ensureSlugAvailable(dto.slug);
      post.slug = dto.slug;
    }

    if (dto.title !== undefined) post.title = dto.title;
    if (dto.excerpt !== undefined) post.excerpt = dto.excerpt;
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.category !== undefined) post.category = dto.category;
    if (dto.tag !== undefined) post.tag = dto.tag;
    if (dto.authorName !== undefined) post.authorName = dto.authorName;
    if (dto.authorRole !== undefined) post.authorRole = dto.authorRole;
    if (dto.authorInitials !== undefined) post.authorInitials = dto.authorInitials;
    if (dto.coverImageUrl !== undefined) post.coverImageUrl = dto.coverImageUrl;
    if (dto.readTimeMinutes !== undefined) post.readTimeMinutes = dto.readTimeMinutes;
    if (dto.isFeatured !== undefined) post.isFeatured = dto.isFeatured;

    // Publishing here (via a direct isPublished patch) also stamps
    // publishedAt the first time it flips true — same effect as the
    // dedicated /publish action below, for admins who just PATCH the
    // field directly instead.
    if (dto.isPublished !== undefined && dto.isPublished !== post.isPublished) {
      post.isPublished = dto.isPublished;
      if (dto.isPublished && !post.publishedAt) post.publishedAt = new Date();
    }

    return this.postRepo.save(post);
  }

  async publish(id: string): Promise<Post> {
    const post = await this.findOneForAdmin(id);
    post.isPublished = true;
    post.publishedAt = post.publishedAt ?? new Date();
    return this.postRepo.save(post);
  }

  async unpublish(id: string): Promise<Post> {
    const post = await this.findOneForAdmin(id);
    post.isPublished = false;
    return this.postRepo.save(post);
  }

  async remove(id: string): Promise<{ message: string }> {
    const post = await this.findOneForAdmin(id);
    await this.postRepo.remove(post);
    return { message: 'Post deleted.' };
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────

  private async ensureSlugAvailable(slug: string): Promise<void> {
    const existing = await this.postRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`Slug "${slug}" is already in use.`);
    }
  }

  private slugify(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private initialsFrom(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  }

  // ~200 words/minute, floor of 1 — only used when the admin doesn't
  // supply an explicit readTimeMinutes.
  private estimateReadTime(content: string): number {
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
  }
}
