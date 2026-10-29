import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  CandidateType,
  DifficultyLevel,
  ExamMode,
  ExamType,
  QuestionType,
  Subject,
} from 'src/common/enums/enums';

export class StartExamSessionDto {
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType; // omit for a pure custom/topic practice session

  // School (internal) vs private (external) candidate — only meaningful
  // for WAEC/NECO/NABTEB/BECE/Junior NECO (see CANDIDATE_TYPE_EXAM_TYPES).
  // Omit to draw from both streams.
  @IsOptional()
  @IsEnum(CandidateType)
  candidateType?: CandidateType;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(Subject, { each: true })
  subjects!: Subject[];

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsEnum(QuestionType)
  questionType?: QuestionType = QuestionType.MCQ;

  @IsEnum(ExamMode)
  mode!: ExamMode;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsString()
  sessionTitle?: string;

  @IsInt()
  @Min(1)
  @Max(200)
  questionCount!: number;

  // MIXED session (MCQ part + theory part). When set, the session gets
  // `questionCount` MCQs PLUS this many theory questions, drawn separately
  // so the split is exactly what the student chose (a single shuffled pool
  // would give an arbitrary MCQ/theory ratio). questionType is ignored for
  // a mixed session — it is always MCQ + theory.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  theoryQuestionCount?: number;

  // Minutes. Omit for untimed practice.
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  year?: number; // past-question year filter
}

export class PartAnswerDto {
  // Dot-path of the leaf within Question.structure (see flattenEssayParts)
  @IsString()
  path!: string;

  @IsOptional()
  @IsString()
  essayText?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  essayImageUrls?: string[];
}

export class SubmitAnswerDto {
  @IsUUID()
  sessionQuestionId!: string;

  // ── MCQ ──
  @ValidateIf((o) => !!o.selectedLabel)
  @IsIn(['A', 'B', 'C', 'D', 'E'])
  selectedLabel?: string;

  // ── Essay / theory ──
  @IsOptional()
  @IsString()
  essayText?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  essayImageUrls?: string[]; // R2 URLs of any diagrams attached to the answer

  // Structured (nested) theory/practical questions: one entry per answerable
  // leaf of the question's `structure`. When present it takes precedence
  // over essayText/essayImageUrls.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartAnswerDto)
  partAnswers?: PartAnswerDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSeconds?: number;
}

// Body for POST …/answers/:sessionQuestionId/score and …/regrade
export class ScoreAnswerDto {
  // Dot-path of ONE leaf of a structured question. When given, only that part
  // is graded; omit to grade every part of the question.
  @IsOptional()
  @IsString()
  path?: string;
}

export class FlagQuestionDto {
  @IsUUID()
  sessionQuestionId!: string;
}

// Query string for GET /exams/available-count — mirrors the filters
// StartExamSessionDto uses to build a session's question pool.
export class AvailableCountQueryDto {
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @IsOptional()
  @IsEnum(CandidateType)
  candidateType?: CandidateType;

  // Comma-separated: ?subjects=chemistry,physics
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(',').map((v) => v.trim()).filter(Boolean)
        : [],
  )
  @IsArray()
  @IsEnum(Subject, { each: true })
  subjects: Subject[] = [];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  // Omit to count every type (mixed session)
  @IsOptional()
  @IsEnum(QuestionType)
  questionType?: QuestionType;
}
