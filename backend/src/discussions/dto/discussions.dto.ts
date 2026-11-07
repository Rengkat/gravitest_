import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ReportReason, ReportStatus } from '../entities/contribution-report.entity';

export class ThreadQueryDto {
  @ApiPropertyOptional({ description: "Permanent id of the sub-question. Omit for the question's own thread." })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  partId?: string;

  @ApiPropertyOptional({ enum: ['newest', 'top'], default: 'newest' })
  @IsOptional()
  @IsIn(['newest', 'top'])
  sort?: 'newest' | 'top';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, maximum: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit?: number;
}

export class PageQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, maximum: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit?: number;
}

export class CreateContributionDto {
  @ApiProperty({ description: 'The underlying question (never a session position or display number).' })
  @IsUUID()
  questionId!: string;

  @ApiPropertyOptional({ description: 'Permanent id of the sub-question; omit for the question itself.' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  partId?: string;

  @ApiPropertyOptional({ description: 'Reply to this contribution (must be in the same thread).' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  content!: string;

  @ApiPropertyOptional({ type: [String], description: 'URLs returned by POST /discussions/uploads (max 3).' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @MaxLength(600, { each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ description: 'Client-generated id making a retried or double-clicked submit idempotent.' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  clientToken?: string;
}

export class UpdateContributionDto {
  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  content!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @MaxLength(600, { each: true })
  imageUrls?: string[];
}

export class ReactDto {
  @ApiProperty({ enum: [1, -1, 0], description: '1 = like, -1 = dislike, 0 = remove my reaction' })
  @Type(() => Number)
  @IsIn([1, -1, 0])
  value!: 1 | -1 | 0;
}

export class ReportDto {
  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}

export class ReportsQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: ReportStatus, default: ReportStatus.OPEN })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}

export class ModerateDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}
