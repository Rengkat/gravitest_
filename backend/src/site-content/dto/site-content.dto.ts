import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsBoolean, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

/** The `data` payload is validated against the server-side schema, not by class-validator. */
export class SaveContentDto {
  @ApiProperty({ description: 'Field values; validated against the section/collection schema.' })
  @IsObject()
  data!: Record<string, unknown>;
}

export class CreateContentItemDto extends SaveContentDto {
  @ApiPropertyOptional({ default: false, description: 'Publish immediately (default: save as a draft).' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class ReorderContentDto {
  @ApiProperty({ type: [String], description: 'Item ids in the desired order.' })
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('all', { each: true })
  ids!: string[];
}

export class BlockKeysQueryDto {
  @ApiPropertyOptional({ description: 'Comma-separated block keys. Omit for all.' })
  @IsOptional()
  @IsString()
  keys?: string;
}
