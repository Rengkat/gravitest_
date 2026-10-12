import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import {
  AdminPostFilterDto,
  CreatePostDto,
  PostFilterDto,
  UpdatePostDto,
} from './dto/post.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/enums';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ─── PUBLIC ────────────────────────────────────────────────────────────
  // No auth on any of these — the blog is public marketing content.

  @Public()
  @Get('posts')
  @ApiOperation({ summary: 'List published posts' })
  findPublished(@Query() filters: PostFilterDto) {
    return this.blogService.findPublished(filters);
  }

  @Public()
  @Get('posts/featured')
  @ApiOperation({ summary: 'Get the current featured post, if any' })
  findFeatured() {
    return this.blogService.findFeatured();
  }

  @Public()
  @Get('posts/:slug')
  @ApiOperation({ summary: 'Get a single published post by slug' })
  async findBySlug(@Param('slug') slug: string) {
    const post = await this.blogService.findBySlugAndIncrementViews(slug);
    const related = await this.blogService.findRelated(post);
    return { post, related };
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/posts')
  @ApiOperation({ summary: '[Admin] List all posts, including drafts' })
  findAllForAdmin(@Query() filters: AdminPostFilterDto) {
    return this.blogService.findAllForAdmin(filters);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/posts/:id')
  @ApiOperation({ summary: '[Admin] Get a post by ID (draft or published)' })
  findOneForAdmin(@Param('id') id: string) {
    return this.blogService.findOneForAdmin(id);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('admin/posts')
  @ApiOperation({ summary: '[Admin] Create a post (draft by default)' })
  create(@Body() dto: CreatePostDto) {
    return this.blogService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('admin/posts/:id')
  @ApiOperation({ summary: '[Admin] Update a post' })
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.blogService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('admin/posts/:id/publish')
  @ApiOperation({ summary: '[Admin] Publish a draft post' })
  publish(@Param('id') id: string) {
    return this.blogService.publish(id);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('admin/posts/:id/unpublish')
  @ApiOperation({ summary: '[Admin] Unpublish a post back to draft' })
  unpublish(@Param('id') id: string) {
    return this.blogService.unpublish(id);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete('admin/posts/:id')
  @ApiOperation({ summary: '[Admin] Delete a post' })
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}
