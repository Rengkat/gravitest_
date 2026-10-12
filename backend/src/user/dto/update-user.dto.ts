import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsUrl,
  IsDate,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  Gender,
  NigerianState,
  UserRole,
} from 'src/common/enums/enums';
import {
  normalizeEmail,
  toBoolean,
  trimString,
} from 'src/common/transforms/transforms';

// ─────────────────────────────────────────────
// UPDATE USER DTO
// Who calls it: Any authenticated user via PATCH /users/me
// What it does: User updates their own non-sensitive profile fields.
//   - Cannot change email, role, or subscriptionTier
//   - Password change uses a separate ChangePasswordDto
// ─────────────────────────────────────────────
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Adaeze' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trimString)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Okonkwo' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trimString)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Chiamaka' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  middleName?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @Matches(/^\+234[0-9]{10}$/, {
    message: 'Must be a valid Nigerian number: +234XXXXXXXXXX',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/gravitest/avatar.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  avatar?: string;

  @ApiPropertyOptional({ type: String, format: 'date', example: '2000-08-14' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateOfBirth?: Date;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ enum: NigerianState })
  @IsOptional()
  @IsEnum(NigerianState)
  stateOfOrigin?: NigerianState;

  @ApiPropertyOptional({ enum: NigerianState })
  @IsOptional()
  @IsEnum(NigerianState)
  stateOfResidence?: NigerianState;

  @ApiPropertyOptional({ example: 'Surulere' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lga?: string;

  @ApiPropertyOptional({ example: 'Aspiring Computer Scientist preparing for JAMB and WAEC.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trimString)
  bio?: string;
}

// ─────────────────────────────────────────────
// ADMIN UPDATE USER DTO
// Who calls it: Super Admin via PATCH /users/:id
// What it does: Admin can update ANY field, including
//   role, subscriptionTier, email, and verification status.
//   This is intentionally more powerful than UpdateUserDto.
// ─────────────────────────────────────────────
export class AdminUpdateUserDto extends UpdateUserDto {
  // Admin-only: can change email
  @ApiPropertyOptional({ example: 'new@example.com' })
  @IsOptional()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Must be a valid email' })
  @Transform(normalizeEmail)
  email?: string;

  // Admin-only: can change role
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  // NOTE: a subscriptionTier field used to live here, but subscription
  // tier belongs to the Subscription entity (one-to-many per user), not
  // User — the service method never actually read this field, so setting
  // it silently did nothing. Removed rather than leave a DTO field that
  // looks like it works but doesn't. To change a user's plan, use the
  // subscriptions endpoints instead.

  // Admin-only: force-verify email without OTP
  @ApiPropertyOptional({
    example: true,
    description: 'Force-verify email (bypass OTP)',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  isEmailVerified?: boolean;

  // Admin-only: force-verify phone without OTP
  @ApiPropertyOptional({
    example: true,
    description: 'Force-verify phone (bypass OTP)',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  isPhoneVerified?: boolean;

  // Admin-only: activate/deactivate
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  isActive?: boolean;

  // Admin-only: manually set XP (migration)
  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  xpPoints?: number;

  // Admin-only: manually set streak (migration)
  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsInt()
  @Min(0)
  streakCount?: number;
}

// ─────────────────────────────────────────────
// ADMIN RESET PASSWORD DTO
// Who calls it: Super Admin via POST /users/:id/reset-password
// ─────────────────────────────────────────────
export class AdminResetPasswordDto {
  /**
   * New password. If omitted, a secure random password is generated
   * and returned in the response (if notifyUser is false)
   * or emailed to the user (if notifyUser is true).
   */
  @ApiPropertyOptional({ example: 'NewTemp123!' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and a number',
  })
  newPassword?: string;

  /** Email the new password to the user. Default: true */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  notifyUser?: boolean = true;
}

// ─────────────────────────────────────────────
// CHANGE PASSWORD DTO
// Who calls it: Any authenticated user via PATCH /users/me/password
// ─────────────────────────────────────────────

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password too weak. Must contain uppercase, lowercase, number, and special character',
  })
  newPassword: string;

  @IsString()
  @ValidateIf((o) => o.newPassword !== undefined)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password too weak',
  })
  confirmPassword?: string;
}
