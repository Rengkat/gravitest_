import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddBookmarkDto {
  @ApiProperty({ description: 'Page number or video timestamp (seconds)' })
  @IsInt()
  @Min(0)
  position!: number;

  @ApiPropertyOptional({ description: 'Optional note at this position' })
  @IsOptional()
  @IsString()
  note?: string;
}
