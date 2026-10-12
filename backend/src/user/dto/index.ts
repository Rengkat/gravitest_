/**
 * Gravitest — Users DTO Barrel Export
 *
 * Import from here instead of individual files:
 *   import { CreateStudentDto } from './dto';
 */

// ── Base ─────────────────────────────────────
export { BaseUserDto } from './base-user.dto';

// ── Create ───────────────────────────────────
export {
  CreateUserDto,
  BulkCreateUserRowDto,
  BulkCreateUsersDto,
  BulkCreateUsersResponseDto,
} from './create-user.dto';

// ── Update ───────────────────────────────────
export {
  UpdateUserDto,
  AdminUpdateUserDto,
  AdminResetPasswordDto,
  ChangePasswordDto,
} from './update-user.dto';

// ── Response shapes ──────────────────────────
export { UserResponseDto, UserSummaryDto } from './user-response.dto';

// ── Student ──────────────────────────────────
export {
  CreateStudentDto,
  UpdateStudentDto,
  StudentResponseDto,
} from './student.dto';

// ── Admins ───────────────────────────────────
export { CreateSuperAdminDto, SuperAdminResponseDto } from './admin.dto';

// ── Filters (query params) ───────────────────
export { UserFilterDto } from './user-filter.dto';
