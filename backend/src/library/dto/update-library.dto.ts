import { PartialType } from '@nestjs/swagger';
import { CreateLibraryDto } from './create-library.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLibraryDto extends PartialType(CreateLibraryDto) {
  @ApiPropertyOptional({
    description: 'Soft-toggle visibility without deleting',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Publish / unpublish content' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    description: 'Pin/feature this item in curated sections — admin-only, not settable at creation',
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
