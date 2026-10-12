import { IsEnum, IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ContentType,
  Subject,
  ExamType,
  ClassLevel,
  SubscriptionTier,
} from 'src/common/enums/enums';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

export class QueryLibraryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ContentType })
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @ApiPropertyOptional({ enum: Subject })
  @IsOptional()
  @IsEnum(Subject)
  subject?: Subject;

  @ApiPropertyOptional({ enum: ExamType })
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @ApiPropertyOptional({ enum: ClassLevel })
  @IsOptional()
  @IsEnum(ClassLevel)
  classLevel?: ClassLevel;

  @ApiPropertyOptional({ description: 'Filter free content only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ enum: SubscriptionTier })
  @IsOptional()
  @IsEnum(SubscriptionTier)
  requiredTier?: SubscriptionTier;

  @ApiPropertyOptional({
    description: 'Published content only (default: true for non-admin)',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Active content only (default: true)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Full-text search on title, description, topic',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?:
    | 'createdAt'
    | 'totalViews'
    | 'totalDownloads'
    | 'averageRating'
    | 'priceKobo';

  @ApiPropertyOptional({ default: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}
