import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { SubscriptionTier, UserRole } from 'src/common/enums/enums';
import { BaseUserDto } from './base-user.dto';

// ─────────────────────────────────────────────
// CREATE USER DTO
// Who calls it: Super Admin via POST /users
// What it does: Admin creates any user directly.
//   - Unless skipEmailVerification is true, the user is created unverified
//     and is immediately emailed an OTP to verify with (same flow as
//     self-registration) — otherwise they'd never be able to log in.
//   - Password is optional — auto-generated if omitted
//   - Role is required — determines which extra fields matter
// ─────────────────────────────────────────────
export class CreateUserDto extends BaseUserDto {
  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT })
  @IsEnum(UserRole)
  role!: UserRole;

  /**
   * Optional. If omitted, a secure temp password is auto-generated
   * and emailed to the user. Format: Gravitest@{year}{random6chars}
   */
  @ApiPropertyOptional({ example: 'TempPass123!' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and a number',
  })
  password?: string;

  @ApiPropertyOptional({
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
    description: 'Assign a subscription tier at creation time',
  })
  @IsOptional()
  @IsEnum(SubscriptionTier)
  subscriptionTier?: SubscriptionTier = SubscriptionTier.FREE;

  /**
   * Skip OTP verification for this user — marks them verified immediately.
   * Use when importing already-verified users from another system.
   * Default: false, meaning the user is created unverified and is sent a
   * verification OTP by email (see sendWelcomeEmail below), same as
   * self-registration.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  skipEmailVerification?: boolean = false;

  /**
   * Whether to email this user at all.
   * If skipEmailVerification is false (default): sends the verification
   * OTP email — without it, the user has no way to verify and can never
   * log in, so turning this off only makes sense if you'll hand them a
   * verification code some other way.
   * If skipEmailVerification is true: sends a welcome/login email instead.
   * Set false when bulk-importing to avoid email spam.
   * Default: true
   */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== false && value !== 'false')
  sendWelcomeEmail?: boolean = true;
}

// ─────────────────────────────────────────────
// BULK CREATE USER ROW DTO
// One row in a bulk import request.
// Inherits all base fields. Password defaults to generated value.
// ─────────────────────────────────────────────
export class BulkCreateUserRowDto extends BaseUserDto {
  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.STUDENT,
    description: 'Defaults to STUDENT if omitted',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole.STUDENT;

  @ApiPropertyOptional({
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
  })
  @IsOptional()
  @IsEnum(SubscriptionTier)
  subscriptionTier?: SubscriptionTier = SubscriptionTier.FREE;

  /**
   * If omitted: Gravitest@{year}{random6} is used.
   * User should be forced to change on first login.
   */
  @ApiPropertyOptional({ example: 'TempPass123!' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

// ─────────────────────────────────────────────
// BULK CREATE USERS DTO
// Wraps an array of user rows. Max 500 per request.
// ─────────────────────────────────────────────
export class BulkCreateUsersDto {
  @ApiProperty({
    type: [BulkCreateUserRowDto],
    description: 'Array of users to import. Max 500 per request.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500, { message: 'Maximum 500 users per bulk request' })
  @ValidateNested({ each: true })
  @Type(() => BulkCreateUserRowDto)
  users!: BulkCreateUserRowDto[];

  /**
   * Silently skip rows where the email already exists.
   * If false, duplicate emails cause the entire batch to fail.
   * Default: true (recommended for large imports)
   */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== false && value !== 'false')
  skipDuplicates?: boolean = true;

  /**
   * Email each created user their login details.
   * Default: false — avoid spamming on large imports.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  sendWelcomeEmails?: boolean = false;
}

export class GeneratedPasswordDto {
  @ApiPropertyOptional({ example: 'Email' })
  @IsOptional()
  @IsString()
  identifier: string;

  @ApiPropertyOptional({ example: 'Temp20241fhg' })
  @IsOptional()
  @IsString()
  temporaryPassword: string;
}

// ─────────────────────────────────────────────
// BULK CREATE RESPONSE
// ─────────────────────────────────────────────
export class BulkCreateUsersResponseDto {
  @ApiProperty({ example: 47 }) created!: number;
  @ApiProperty({ example: 2 }) skipped!: number;
  @ApiProperty({ example: 1 }) failed!: number;

  @ApiProperty({
    type: [String],
    example: ['Row 12 (bad@email): email already exists'],
  })
  errors!: string[];

  @ApiProperty({
    type: [GeneratedPasswordDto],
    example: [
      {
        identifier: 'ada@school.ng',
        temporaryPassword: 'Gravitest@2026xR3!mQ',
      },
      { identifier: '08012345678', temporaryPassword: 'Gravitest@2026kP9#nZ' },
    ],
  })
  generatedPasswords!: GeneratedPasswordDto[];
}
