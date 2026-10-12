import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsString,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { UserRole, NigerianState, Gender } from 'src/common/enums/enums';
import { toBoolean, toInt } from 'src/common/transforms/transforms';

// ─────────────────────────────────────────────
// USER FILTER DTO
// Who calls it: Super Admin via GET /users?role=student&state=Lagos
// What it does: Paginated, filterable list of all users.
// ─────────────────────────────────────────────
export class UserFilterDto {
  @ApiPropertyOptional({ enum: UserRole, description: 'Filter by role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    enum: NigerianState,
    description: 'Filter by state of residence',
  })
  @IsOptional()
  @IsEnum(NigerianState)
  state?: NigerianState;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter active/inactive accounts',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter email-verified accounts',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  emailVerified?: boolean;

  @ApiPropertyOptional({
    example: 'adaeze',
    description: 'Full-text search across firstName, lastName, email, phone',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Filter users created on or after this date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description: 'Filter users created on or before this date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    enum: ['createdAt', 'firstName', 'lastName', 'email'],
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'email' = 'createdAt';

  @ApiPropertyOptional({
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    description: 'Sort direction',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ example: 1, description: 'Page number (1-based)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(toInt)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page (max 100)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(toInt)
  limit?: number = 10;
}
