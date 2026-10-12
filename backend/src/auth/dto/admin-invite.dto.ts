import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AdminInviteStatus, UserRole } from 'src/common/enums/enums';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const PHONE_REGEX = /^\+234\d{10}$/;

// Only these two roles can ever be invited this way — SUPER_ADMIN creation
// via invite is intentionally still gated behind the same endpoint (a
// SUPER_ADMIN vouching for another SUPER_ADMIN), never self-service.
const INVITABLE_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

// ───────────────── CREATE INVITE (super admin) ─────────────────

export class CreateAdminInviteDto {
  @ApiProperty({ example: 'Adaeze' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Okonkwo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ example: 'adaeze@gravitest.com' })
  @IsEmail({}, { message: 'Provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @Matches(PHONE_REGEX, {
    message: 'Phone must be a valid Nigerian number: +234XXXXXXXXXX',
  })
  phoneNumber?: string;

  @ApiProperty({ enum: INVITABLE_ROLES, default: UserRole.ADMIN })
  @IsEnum(UserRole)
  @IsIn(INVITABLE_ROLES, {
    message: 'role must be either admin or super_admin',
  })
  role: UserRole = UserRole.ADMIN;

  @ApiPropertyOptional({ example: 'Content Manager' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string;
}

// ───────────────── ACCEPT INVITE (invitee, public) ─────────────────

export class AcceptAdminInviteDto {
  @ApiProperty({ description: 'The raw token from the invite link' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'MySecurePass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_REGEX, {
    message:
      'Password must contain uppercase, lowercase, number, and special character',
  })
  password!: string;
}

// ───────────────── RESPONSE DTOs ─────────────────

export class AdminInviteResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty()
  firstName: string;

  @Expose()
  @ApiProperty()
  lastName: string;

  @Expose()
  @ApiPropertyOptional()
  phoneNumber?: string | null;

  @Expose()
  @ApiPropertyOptional()
  designation?: string | null;

  @Expose()
  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @Expose()
  @ApiProperty({ enum: AdminInviteStatus })
  status: AdminInviteStatus;

  @Expose()
  @ApiPropertyOptional()
  invitedByName?: string | null;

  @Expose()
  @ApiProperty()
  expiresAt: Date;

  @Expose()
  @ApiProperty()
  createdAt: Date;
}

// Returned by the public "validate this link before showing the form"
// endpoint — deliberately minimal, no internal IDs.
export class ValidateAdminInviteResponseDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  expiresAt: Date;
}
