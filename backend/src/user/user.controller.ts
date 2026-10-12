import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateUserDto,
  BulkCreateUsersDto,
  BulkCreateUsersResponseDto,
} from './dto/create-user.dto';
import {
  UpdateUserDto,
  AdminUpdateUserDto,
  ChangePasswordDto,
  AdminResetPasswordDto,
} from './dto/update-user.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import {
  UserResponseDto,
  CreateUserResponseDto,
} from './dto/user-response.dto';
import { UserService } from './user.service';
import { UserSettingsProvider } from './providers/user-settings.provider';
import { DeactivateUserDto } from './dto/admin.dto';
import { DeactivationType, UserRole } from 'src/common/enums/enums';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserId } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { StorageService, InvalidUploadError } from 'src/storage/storage.service';

@ApiTags('Users')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly usersService: UserService,
    private readonly userSettingsProvider: UserSettingsProvider,
    private readonly storageService: StorageService,
  ) {}

  // ══════════════════════════════════════════
  // SELF — authenticated user's own profile
  // ══════════════════════════════════════════

  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  @ApiOkResponse({ type: UserResponseDto })
  getMe(@UserId() userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update my profile — name, phone, avatar, state, DOB, gender',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  updateMe(@UserId() userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/complete-onboarding')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark the post-verification onboarding wizard as complete',
    description:
      'Called by the frontend once /complete-registration has successfully ' +
      'saved personal, academic, and exam-goal details. Idempotent.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  completeOnboarding(@UserId() userId: string) {
    return this.usersService.completeOnboarding(userId);
  }

  @Post('me/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({
    summary: 'Upload my avatar',
    description:
      'Any authenticated user can upload their own profile photo (JPEG/PNG/WebP, max 5MB). ' +
      'Unlike /storage/upload (admin-only, for library content), this is scoped to a dedicated ' +
      "'avatars' folder with its own tight size limit — see StorageService.",
  })
  @ApiOkResponse({ type: UserResponseDto })
  async uploadAvatar(@UserId() userId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    try {
      const result = await this.storageService.uploadBuffer({
        folder: 'avatars',
        originalName: file.originalname,
        buffer: file.buffer,
        contentType: file.mimetype,
      });
      return this.usersService.updateProfile(userId, { avatar: result.url });
    } catch (err) {
      if (err instanceof InvalidUploadError) throw new BadRequestException(err.message);
      throw err;
    }
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change my password — requires current password' })
  @ApiOkResponse({
    schema: { example: { message: 'Password changed successfully' } },
  })
  @ApiBadRequestResponse({ description: 'Current password is incorrect' })
  changePassword(@UserId() userId: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(userId, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate my account' })
  @ApiOkResponse({
    schema: { example: { message: 'Account deactivated successfully' } },
  })
  deactivateMe(@UserId() userId: string) {
    return this.usersService.deactivate(
      userId,
      DeactivationType.USER_REQUEST,
      userId,
      'User requested account deactivation',
    );
  }

  // ── Settings ───────────────────────────────────────────────

  @Get('me/settings')
  @ApiOperation({ summary: 'Get my settings' })
  getSettings(@UserId() userId: string) {
    return this.userSettingsProvider.getSettings(userId);
  }

  @Patch('me/settings')
  @ApiOperation({ summary: 'Update my settings' })
  updateSettings(@UserId() userId: string, @Body() dto: UpdateUserSettingsDto) {
    return this.userSettingsProvider.updateSettings(userId, dto);
  }

  // ══════════════════════════════════════════
  // SUPER ADMIN ONLY
  // ══════════════════════════════════════════

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '[Admin] Create a user directly',
    description:
      'Super admin creates any user type. Unless skipEmailVerification is ' +
      'set, the user is created unverified and is immediately emailed an ' +
      'OTP to verify their email before they can log in. ' +
      'If password is omitted, a secure temporary password is generated.',
  })
  @ApiCreatedResponse({ type: CreateUserResponseDto })
  @ApiConflictResponse({ description: 'Email already exists' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.adminCreateUser(dto);
  }

  @Post('bulk')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[Admin] Bulk create up to 500 users in one request',
  })
  @ApiOkResponse({ type: BulkCreateUsersResponseDto })
  bulkCreate(@Body() dto: BulkCreateUsersDto) {
    return this.usersService.bulkCreateUsers(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '[Admin] List all users with filters and pagination',
  })
  findAll(@Query() query: UserFilterDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Get a user by ID' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getProfile(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Update any user field including role' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  adminUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdateUser(id, dto);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "[Admin] Reset a user's password" })
  adminResetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.usersService.adminResetPassword(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  adminDeactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeactivateUserDto,
    @UserId() adminId: string,
  ) {
    return this.usersService.deactivate(
      id,
      dto.type ?? DeactivationType.ADMIN_SUSPENSION,
      adminId,
      dto.reason,
    );
  }

  @Patch(':id/reactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Reactivate a previously deactivated user' })
  adminReactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.adminUpdateUser(id, { isActive: true });
  }
}
