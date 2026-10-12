import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  MaxLength,
  Min,
  ArrayUnique,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ContentType,
  Subject,
  ExamType,
  ClassLevel,
  SubscriptionTier,
} from 'src/common/enums/enums';

export class CreateLibraryDto {
  @ApiProperty({
    example: 'Complete WAEC Mathematics Guide 2024',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    example: 'A comprehensive guide covering all WAEC topics.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ContentType })
  @IsEnum(ContentType)
  contentType!: ContentType;

  @ApiPropertyOptional({ enum: Subject })
  @IsOptional()
  @IsEnum(Subject)
  subject?: Subject;

  @ApiPropertyOptional({ example: 'Differentiation' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiProperty({
    example: 'https://cdn.example.com/files/guide.pdf',
    description:
      'Full public CDN URL for free content, OR the raw R2 object key ' +
      '(e.g. "videos/2026/xy12ab.mp4") for gated content — the key is ' +
      'what /storage/presign-upload or /storage/upload returns.',
  })
  @IsString()
  @MaxLength(1024)
  fileUrl!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/thumbs/guide.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    example: 3600,
    description: 'Duration in seconds (video/audio)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;

  @ApiPropertyOptional({
    example: 240,
    description: 'Total pages (ebook/document)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalPages?: number;

  @ApiPropertyOptional({ example: 5242880, description: 'File size in bytes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSizeBytes?: number;

  @ApiPropertyOptional({ enum: ExamType, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(ExamType, { each: true })
  examTypes?: ExamType[];

  @ApiPropertyOptional({ enum: ClassLevel, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(ClassLevel, { each: true })
  classLevels?: ClassLevel[];

  // ── Access control ──────────────────────────────────────────
  @ApiPropertyOptional({
    default: false,
    description: 'True = accessible to all users for free',
  })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({
    enum: SubscriptionTier,
    description: 'Minimum tier required; null if isFree or pay-per-item',
    nullable: true,
  })
  @IsOptional()
  @IsEnum(SubscriptionTier)
  requiredTier?: SubscriptionTier | null;

  @ApiPropertyOptional({
    example: 500000,
    description:
      'One-time purchase price in kobo (₦5,000 = 500000); null if free or tier-gated',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceKobo?: number | null;

  // ── Metadata / display ────────────────────────────────────────
  @ApiPropertyOptional({
    example: 'Mr. Adewale Obi',
    description: 'Display credit for who created/authored the content (distinct from the uploading admin)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  author?: string;

  @ApiPropertyOptional({ type: [String], example: ['exam prep', '2024'] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({
    default: true,
    description: 'Whether students are allowed to download this content for offline use',
  })
  @IsOptional()
  @IsBoolean()
  isDownloadable?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Whether downloads/streams should be watermarked/DRM-protected',
  })
  @IsOptional()
  @IsBoolean()
  drmProtected?: boolean;

  // ── Free preview overrides (optional) ─────────────────────────
  @ApiPropertyOptional({
    description:
      'Seconds of free preview for VIDEO/AUDIO. Leave unset to use the platform default (90s video / 60s audio). ' +
      'Always clamped server-side against the real file so some of the paid content stays withheld.',
    example: 90,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  previewSeconds?: number;

  @ApiPropertyOptional({
    description:
      'Pages of free preview for EBOOK/DOCUMENT (PDF-backed only). Leave unset to use the platform default (5 ebook / 2 document).',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  previewPages?: number;
}
