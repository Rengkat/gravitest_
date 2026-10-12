import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type as TransformType } from 'class-transformer';
import {
  CandidateType,
  DifficultyLevel,
  ExamType,
  QuestionType,
  Subject,
} from 'src/common/enums/enums';

// Sent as query params alongside the multipart file upload — the same
// shared examType/subject/year/difficulty/type an admin would otherwise
// have to repeat on every row of a CSV.
export class BulkImportDefaultsDto {
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  // Only relevant when examType is WAEC/NECO/NABTEB/BECE/Junior NECO —
  // lets an admin tag a whole file as school-candidate-only or
  // private-candidate-only instead of repeating it per row.
  @IsOptional()
  @IsEnum(CandidateType)
  candidateType?: CandidateType;

  @IsOptional()
  @IsEnum(Subject)
  subject?: Subject;

  @IsOptional()
  @TransformType(() => Number)
  @IsInt()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;
}
