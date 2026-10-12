import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BlogCategory } from 'src/common/enums/enums';

export class CreatePostDto {
  @ApiProperty({ example: 'How to Score 300+ in JAMB Mathematics' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title!: string;

  // Optional — auto-generated from title (slugify) if omitted. Explicit
  // override supported for posts where the admin wants a cleaner/shorter
  // URL than a straight title-slugify would produce.
  @ApiPropertyOptional({ example: 'score-300-jamb-mathematics' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase, alphanumeric, and hyphen-separated',
  })
  slug?: string;

  @ApiProperty({ example: 'A step-by-step breakdown of the topics that matter most.' })
  @IsString()
  @MinLength(10)
  @MaxLength(400)
  excerpt!: string;

  @ApiProperty({ description: 'Markdown body' })
  @IsString()
  @MinLength(20)
  content!: string;

  @ApiProperty({ enum: BlogCategory })
  @IsEnum(BlogCategory)
  category!: BlogCategory;

  @ApiProperty({ example: 'JAMB Guide' })
  @IsString()
  @MaxLength(60)
  tag!: string;

  @ApiProperty({ example: 'Adaeze Okafor' })
  @IsString()
  @MaxLength(120)
  authorName!: string;

  @ApiPropertyOptional({ example: 'Content Lead' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorRole?: string;

  @ApiPropertyOptional({ example: 'AO' })
  @IsOptional()
  @IsString()
  @MaxLength(4)
  authorInitials?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  readTimeMinutes?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  // Create as a draft by default (isPublished: false) — publishing is a
  // deliberate separate action (PATCH /blog/posts/:id/publish), same
  // pattern as the question bank module.
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}

export class PostFilterDto {
  @ApiPropertyOptional({ enum: BlogCategory })
  @IsOptional()
  @IsEnum(BlogCategory)
  category?: BlogCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  limit?: number = 12;
}

// Admin-only listing variant — same filters, plus the ability to see
// drafts, which the public endpoint never returns.
export class AdminPostFilterDto extends PostFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
