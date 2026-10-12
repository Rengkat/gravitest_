import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionDto } from './create-question.dto';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsIn,
  IsUUID,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  CandidateType,
  DifficultyLevel,
  ExamType,
  QuestionType,
  Subject,
} from 'src/common/enums/enums';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { toBoolean } from 'src/common/transforms/transforms';

// ─── Update (all fields optional) ────────────────────────────────────────────

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}

// ─── Filter / query params for GET /questions ────────────────────────────────

export class QuestionFiltersDto extends PaginationDto {
  @IsString()
  @IsOptional()
  questionNumber: string; //for theory questions e.g Question 1a, 1b etc

  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  // Only WAEC/NECO/NABTEB/BECE/Junior NECO ever have this set. Filtering
  // by it returns questions tagged for that stream PLUS untagged
  // (candidateType = null) questions, which apply to both — see
  // QuestionsService.findAll.
  @IsOptional()
  @IsEnum(CandidateType)
  candidateType?: CandidateType;

  @IsOptional()
  @IsEnum(Subject)
  subject?: Subject;

  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsUUID()
  passageId?: string;

  // `isActive` arrives here as a query-string value ("true"/"false"),
  // never a real boolean. @Type(() => Boolean) — which is what this used
  // to be — converts via the Boolean() constructor, and Boolean("false")
  // is true (any non-empty string is truthy in JS). That silently turned
  // every `?isActive=false` request (the Status filter's "Inactive"/
  // "Draft" option) into `isActive=true` on the way in, so filtering for
  // drafts actually returned published questions instead. toBoolean is
  // the shared transform (src/common/transforms) user-filter.dto.ts and
  // query-library.dto.ts already use correctly for this exact situation.
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  isActive?: boolean;

  // Search
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['createdAt', 'year', 'difficulty', 'examType', 'subject'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

// ─── Bulk toggle active status ────────────────────────────────────────────────

export class BulkToggleDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsBoolean()
  isActive!: boolean;
}

// ─── Bulk delete ──────────────────────────────────────────────────────────────

export class BulkDeleteDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids!: string[];
}
