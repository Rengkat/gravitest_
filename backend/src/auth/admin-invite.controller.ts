import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AdminInviteService } from './admin-invite.service';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { UserId } from './decorators/current-user.decorator';
import { UserRole } from 'src/common/enums/enums';
import {
  AcceptAdminInviteDto,
  AdminInviteResponseDto,
  CreateAdminInviteDto,
  ValidateAdminInviteResponseDto,
} from './dto/admin-invite.dto';
import { AuthResponseDto } from './dto/auth.dto';

@ApiTags('Admin Invites')
@Controller('admin/invites')
export class AdminInviteController {
  constructor(private readonly adminInviteService: AdminInviteService) {}

  // ─────────────────────────────────────────────
  // SUPER ADMIN ONLY
  // ─────────────────────────────────────────────

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '[Super Admin] Invite someone to join as an admin',
    description:
      'Emails a one-time, expiring link. The invitee sets their own password ' +
      'and completes their account via POST /admin/invites/accept.',
  })
  @ApiCreatedResponse({ type: AdminInviteResponseDto })
  @ApiConflictResponse({ description: 'An account with this email already exists' })
  create(@Body() dto: CreateAdminInviteDto, @UserId() invitedById: string) {
    return this.adminInviteService.createInvite(dto, invitedById);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Super Admin] List all admin invites' })
  @ApiOkResponse({ type: [AdminInviteResponseDto] })
  list() {
    return this.adminInviteService.listInvites();
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Super Admin] Revoke a pending admin invite' })
  @ApiNotFoundResponse({ description: 'Invite not found' })
  @ApiBadRequestResponse({ description: 'Only a pending invite can be revoked' })
  revoke(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminInviteService.revokeInvite(id);
  }

  // ─────────────────────────────────────────────
  // PUBLIC — the invitee doesn't have an account yet
  // ─────────────────────────────────────────────

  @Public()
  @Get('validate')
  @ApiOperation({
    summary: 'Validate an admin invite link before showing the onboarding form',
  })
  @ApiOkResponse({ type: ValidateAdminInviteResponseDto })
  @ApiNotFoundResponse({ description: 'Invalid or expired invite link' })
  validate(@Query('token') token: string) {
    return this.adminInviteService.validateInvite(token);
  }

  @Public()
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept an admin invite — creates the account and logs in',
  })
  @ApiOkResponse({ description: 'Account created and session issued' })
  @ApiBadRequestResponse({ description: 'Invite is expired, used, or revoked' })
  @ApiConflictResponse({ description: 'An account with this email already exists' })
  accept(
    @Body() dto: AcceptAdminInviteDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    return this.adminInviteService.acceptInvite(dto, req);
  }
}
