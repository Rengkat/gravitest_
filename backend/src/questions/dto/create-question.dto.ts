import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsArray,
  ValidateNested,
  IsIn,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import {
  CandidateType,
  DifficultyLevel,
  ExamType,
  QuestionType,
  Subject,
} from 'src/common/enums/enums';
import { EssayPartDto } from './essay-part.dto';

// ─── Option ──────────────────────────────────────────────────────────────────

export class CreateOptionDto {
  @IsIn(['A', 'B', 'C', 'D'])
  label!: string;

  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string | null;

  @IsInt()
  @Min(0)
  order!: number;
}

// ─── Answer ───────────────────────────────────────────────────────────────────

export class CreateAnswerDto {
  @IsIn(['A', 'B', 'C', 'D'])
  correctLabel!: string;

  // correctOptionId is resolved server-side after options are inserted;
  // the client sends the label, not the UUID.
}

// ─── Explanation ─────────────────────────────────────────────────────────────

export class CreateExplanationDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string | null;

  @IsOptional()
  @IsUrl()
  videoUrl?: string | null;
}

// ─── Main DTO ─────────────────────────────────────────────────────────────────

export class CreateQuestionDto {
  @IsString()
  @IsOptional()
  questionNumber?: string; //for theory questions e.g Question 1a, 1b etc

  @IsEnum(ExamType)
  examType!: ExamType;

  // Only meaningful for CANDIDATE_TYPE_EXAM_TYPES (WAEC, NECO, NABTEB,
  // BECE, Junior NECO). Omit to leave the question applicable to both
  // school (internal) and private (external) candidates.
  @IsOptional()
  @IsEnum(CandidateType)
  candidateType?: CandidateType | null;

  @IsEnum(Subject)
  subject!: Subject;

  @IsInt()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  year!: number;

  @IsString()
  @IsNotEmpty()
  questionText!: string;

  @IsOptional()
  @IsUrl()
  questionImageUrl?: string | null;

  @IsEnum(DifficultyLevel)
  difficulty!: DifficultyLevel;

  @IsEnum(QuestionType)
  type!: QuestionType;

  @IsOptional()
  @IsString()
  topic?: string | null;

  // Links this question into a comprehension/passage set. Usually left
  // unset when creating manually — bulk import resolves this
  // automatically by grouping rows that share identical passage text
  // (see BulkImportService).
  @IsOptional()
  @IsUUID()
  passageId?: string | null;

  // Theory/essay questions only — marks this question is worth, and an
  // optional mark-scheme answer passed to AiScoringService as grading
  // context. MCQ questions ignore both (always worth 1 point).
  @IsOptional()
  @IsInt()
  @Min(1)
  maxScore?: number;

  @IsOptional()
  @IsString()
  modelAnswer?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // MCQ-only fields
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAnswerDto)
  answer?: CreateAnswerDto;

  // Explanations (at least one recommended for published questions)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExplanationDto)
  explanations?: CreateExplanationDto[];

  // Essay/theory only — custom numbering (1 → (a) → (i)), sub-questions,
  // per-part marks, tables, images. Omit for a plain essay question.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EssayPartDto)
  structure?: EssayPartDto[];
}
