import {
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentType } from 'src/common/enums/enums';

export class RecordAccessDto {
  @ApiProperty({ description: 'ID of the content being accessed' })
  @IsUUID()
  contentId!: string;

  @ApiProperty({ enum: ContentType })
  @IsEnum(ContentType)
  contentType!: ContentType;

  @ApiPropertyOptional({
    description: 'Current progress percentage (0–100)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercent?: number;
}
