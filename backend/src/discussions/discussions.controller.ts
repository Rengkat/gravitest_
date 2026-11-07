import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/enums';
import { User } from 'src/user/entities/user.entity';
import { DiscussionsService } from './discussions.service';
import {
  CreateContributionDto,
  ModerateDto,
  PageQueryDto,
  ReactDto,
  ReportDto,
  ReportsQueryDto,
  ThreadQueryDto,
  UpdateContributionDto,
} from './dto/discussions.dto';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/**
 * Question-level discussions. Every route below authenticates the caller and
 * then re-checks, server-side, that the discussion is currently open to THIS
 * student (correction released, no exam in progress). There is no client
 * flag that can bypass that.
 */
@ApiTags('Discussions')
@ApiBearerAuth()
@Controller()
export class DiscussionsController {
  constructor(private readonly discussions: DiscussionsService) {}

  @Get('discussions/questions/:questionId')
  @ApiOperation({ summary: "A question's (or sub-question's) top-level contributions, paginated" })
  list(@CurrentUser() user: User, @Param('questionId') questionId: string, @Query() q: ThreadQueryDto) {
    return this.discussions.list(user, questionId, q);
  }

  @Get('discussions/contributions/:id/replies')
  @ApiOperation({ summary: 'Replies of one contribution (loaded on demand), oldest first' })
  replies(@CurrentUser() user: User, @Param('id') id: string, @Query() q: PageQueryDto) {
    return this.discussions.listReplies(user, id, q);
  }

  @Post('discussions/contributions')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Post a contribution or a reply (idempotent with clientToken)' })
  create(@CurrentUser() user: User, @Body() dto: CreateContributionDto) {
    return this.discussions.create(user, dto);
  }

  @Patch('discussions/contributions/:id')
  @ApiOperation({ summary: 'Edit my own contribution' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateContributionDto) {
    return this.discussions.update(user, id, dto);
  }

  @Delete('discussions/contributions/:id')
  @ApiOperation({ summary: 'Delete my own contribution (moderators: anyone’s)' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.discussions.remove(user, id);
  }

  @Put('discussions/contributions/:id/reaction')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Like (1), dislike (-1) or clear (0) my reaction' })
  react(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: ReactDto) {
    return this.discussions.react(user, id, dto.value);
  }

  @Post('discussions/contributions/:id/report')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Report a contribution for moderator review' })
  report(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: ReportDto) {
    return this.discussions.report(user, id, dto);
  }

  @Post('discussions/uploads')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image (JPEG/PNG/WebP, ≤3MB) to attach to a contribution' })
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided.');
    return this.discussions.uploadImage(file);
  }

  // ─── Moderation (existing admin roles) ─────────────────────────────

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/discussions/reports')
  @ApiOperation({ summary: '[Admin] Reported contributions, grouped, newest report first' })
  reports(@Query() q: ReportsQueryDto) {
    return this.discussions.listReports(q);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('admin/discussions/contributions/:id/hide')
  @ApiOperation({ summary: '[Admin] Hide a contribution (resolves its reports)' })
  hide(@CurrentUser() admin: User, @Param('id') id: string, @Body() dto: ModerateDto) {
    return this.discussions.moderate(admin.id, id, 'hide', dto.note);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('admin/discussions/contributions/:id/restore')
  @ApiOperation({ summary: '[Admin] Restore a hidden contribution (dismisses its reports)' })
  restore(@CurrentUser() admin: User, @Param('id') id: string, @Body() dto: ModerateDto) {
    return this.discussions.moderate(admin.id, id, 'restore', dto.note);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('admin/discussions/contributions/:id/delete')
  @ApiOperation({ summary: '[Admin] Delete a contribution (resolves its reports)' })
  delete(@CurrentUser() admin: User, @Param('id') id: string, @Body() dto: ModerateDto) {
    return this.discussions.moderate(admin.id, id, 'delete', dto.note);
  }
}
