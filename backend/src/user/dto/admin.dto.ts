import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { DeactivationType } from 'src/common/enums/enums';
import { CreateUserDto } from './create-user.dto';
import { UserResponseDto } from './user-response.dto';

// ─────────────────────────────────────────────
// CREATE SUPER ADMIN DTO
// Who calls it: Only an existing SUPER_ADMIN
//   via POST /admin/admins
//
// SUPER_ADMIN has unrestricted access to everything.
// There should be very few of these — guard this endpoint tightly.
// ─────────────────────────────────────────────
export class CreateSuperAdminDto extends CreateUserDto {
  /**
   * Internal Gravitest team designation.
   * e.g. 'CTO', 'Content Manager', 'Support Lead'
   */
  @ApiPropertyOptional({ example: 'Content Manager' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string;

  /**
   * Access level within super admins (for audit purposes only).
   * Does not affect permissions — all super admins have full access.
   * 'full' | 'readonly' | 'support'
   */
  @ApiPropertyOptional({
    example: 'support',
    description: 'Audit label only — does not restrict permissions',
  })
  @IsOptional()
  @IsString()
  accessLevel?: 'full' | 'readonly' | 'support';
}

// ─────────────────────────────────────────────
// SUPER ADMIN RESPONSE DTO
// ─────────────────────────────────────────────
export class SuperAdminResponseDto extends UserResponseDto {
  @Expose()
  @ApiPropertyOptional({ example: 'Content Manager' })
  designation?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'full' })
  accessLevel?: string;
}

// ─────────────────────────────────────────────
// SUPER ADMIN DEACTIVATE DTO
// ─────────────────────────────────────────────
export class DeactivateUserDto {
  @IsEnum(DeactivationType)
  @IsOptional()
  type?: DeactivationType = DeactivationType.ADMIN_SUSPENSION;

  @IsString()
  @IsOptional()
  reason?: string;
}
