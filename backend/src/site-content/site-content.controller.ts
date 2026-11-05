import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserId } from 'src/auth/decorators/current-user.decorator';
import { UserRole } from 'src/common/enums/enums';
import { SiteContentService } from './site-content.service';
import {
  BlockKeysQueryDto,
  CreateContentItemDto,
  ReorderContentDto,
  SaveContentDto,
} from './dto/site-content.dto';

// Short public cache: an admin edit shows up on the site within seconds, while
// a traffic spike on the marketing pages still barely touches the database.
const PUBLIC_CACHE = 'public, max-age=15, stale-while-revalidate=30';

@ApiTags('Site content')
@Controller()
export class SiteContentController {
  constructor(private readonly content: SiteContentService) {}

  // ─── PUBLIC ────────────────────────────────────────────────────────────

  @Public()
  @Get('site-content/blocks')
  @Header('Cache-Control', PUBLIC_CACHE)
  @ApiOperation({ summary: 'Page-section content, keyed by block key (?keys=a,b to filter)' })
  publicBlocks(@Query() q: BlockKeysQueryDto) {
    const keys = q.keys?.split(',').map((k) => k.trim()).filter(Boolean);
    return this.content.getPublicBlocks(keys);
  }

  @Public()
  @Get('site-content/collections/:collection')
  @Header('Cache-Control', PUBLIC_CACHE)
  @ApiOperation({ summary: 'Published items of a content collection, in display order' })
  publicCollection(@Param('collection') collection: string) {
    return this.content.listPublic(collection);
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────────

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/site-content/schema')
  @ApiOperation({ summary: '[Admin] Definitions the dashboard renders its editing forms from' })
  schema() {
    return this.content.getSchema();
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/site-content/blocks')
  @ApiOperation({ summary: '[Admin] Every section with its current content' })
  adminBlocks() {
    return this.content.getAdminBlocks();
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Put('admin/site-content/blocks/:key')
  @ApiOperation({ summary: '[Admin] Save a page section (live immediately)' })
  saveBlock(@Param('key') key: string, @Body() dto: SaveContentDto, @UserId() adminId: string) {
    return this.content.saveBlock(key, dto.data, adminId ?? null);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/site-content/collections/:collection')
  @ApiOperation({ summary: '[Admin] All items of a collection, drafts included' })
  adminList(@Param('collection') collection: string) {
    return this.content.listAdmin(collection);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('admin/site-content/collections/:collection')
  @ApiOperation({ summary: '[Admin] Create an item (draft unless isPublished)' })
  create(
    @Param('collection') collection: string,
    @Body() dto: CreateContentItemDto,
    @UserId() adminId: string,
  ) {
    return this.content.create(collection, dto.data, dto.isPublished ?? false, adminId ?? null);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('admin/site-content/collections/:collection/reorder')
  @ApiOperation({ summary: '[Admin] Set the display order' })
  reorder(@Param('collection') collection: string, @Body() dto: ReorderContentDto) {
    return this.content.reorder(collection, dto.ids);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('admin/site-content/collections/:collection/:id')
  @ApiOperation({ summary: '[Admin] Edit an item' })
  update(
    @Param('collection') collection: string,
    @Param('id') id: string,
    @Body() dto: SaveContentDto,
    @UserId() adminId: string,
  ) {
    return this.content.update(collection, id, dto.data, adminId ?? null);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('admin/site-content/collections/:collection/:id/publish')
  @ApiOperation({ summary: '[Admin] Publish an item' })
  publish(@Param('collection') collection: string, @Param('id') id: string, @UserId() adminId: string) {
    return this.content.setPublished(collection, id, true, adminId ?? null);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('admin/site-content/collections/:collection/:id/unpublish')
  @ApiOperation({ summary: '[Admin] Take an item off the public site (keeps it as a draft)' })
  unpublish(@Param('collection') collection: string, @Param('id') id: string, @UserId() adminId: string) {
    return this.content.setPublished(collection, id, false, adminId ?? null);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete('admin/site-content/collections/:collection/:id')
  @ApiOperation({ summary: '[Admin] Delete an item' })
  remove(@Param('collection') collection: string, @Param('id') id: string) {
    return this.content.remove(collection, id);
  }
}
