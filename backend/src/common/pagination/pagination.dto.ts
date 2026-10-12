// src/common/pagination/pagination.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsPositive()
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Type(() => Number)
  limit: number = 10;
}
