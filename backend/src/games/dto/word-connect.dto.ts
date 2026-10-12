import { PartialType } from '@nestjs/mapped-types';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Play ──────────────────────────────────────────────
export class StartWordConnectDto {
  @IsString()
  @MaxLength(50)
  subjectKey!: string;
}

export class SubmitWordDto {
  @IsUUID()
  sessionId!: string;

  @IsInt()
  @Min(0)
  wordIndex!: number;

  @IsString()
  @MaxLength(30)
  guess!: string;
}

export class WordConnectSessionIdDto {
  @IsUUID()
  sessionId!: string;
}

// ── Admin ─────────────────────────────────────────────
export class WordConnectWordDto {
  @IsString()
  @MaxLength(30)
  word!: string;

  @IsIn(['h', 'v'])
  dir!: 'h' | 'v';

  @IsInt()
  @Min(0)
  @Max(20)
  row!: number;

  @IsInt()
  @Min(0)
  @Max(20)
  col!: number;

  @IsString()
  clue!: string;
}

export class CreateWordConnectPuzzleDto {
  @IsString()
  @MaxLength(50)
  subjectKey!: string;

  @IsString()
  @MaxLength(100)
  subjectName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => WordConnectWordDto)
  words!: WordConnectWordDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateWordConnectPuzzleDto extends PartialType(CreateWordConnectPuzzleDto) {}
