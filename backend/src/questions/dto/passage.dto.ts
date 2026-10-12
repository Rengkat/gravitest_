import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ExamType, Subject } from 'src/common/enums/enums';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

export class CreatePassageDto {
  @IsEnum(ExamType)
  examType!: ExamType;

  @IsEnum(Subject)
  subject!: Subject;

  @IsInt()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  year!: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string | null;

  @IsOptional()
  @IsString()
  instructions?: string | null;

  @IsOptional()
  @IsString()
  passageText?: string | null;

  @IsOptional()
  @IsString()
  passageImageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePassageDto extends PartialType(CreatePassageDto) {}

export class PassageFiltersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @IsOptional()
  @IsEnum(Subject)
  subject?: Subject;

  @IsOptional()
  @IsInt()
  year?: number;
}
