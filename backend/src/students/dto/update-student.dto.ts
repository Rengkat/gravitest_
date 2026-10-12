import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  IsPositive,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { ExamType, Subject, WeakTopicStatus } from 'src/common/enums/enums';
import { toBoolean } from 'src/common/transforms/transforms';

// ─── Update Profile (student edits their own profile) ─────────────────────────

export class UpdateStudentProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  currentSchool?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  currentClass?: string | null;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2050)
  graduationYear?: number | null;

  // ── Exam Targets ──
  @IsOptional()
  @IsArray()
  @IsEnum(ExamType, { each: true })
  examTargets?: ExamType[];

  @IsOptional()
  @IsDateString()
  examDate?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(400)
  targetScore?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetUniversity?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetCourse?: string | null;

  // ── Subjects ──
  @IsOptional()
  @IsArray()
  @IsEnum(Subject, { each: true })
  focusSubjects?: string[];

  // ── Social ──
  @IsOptional()
  @IsString()
  @MaxLength(20)
  parentPhone?: string | null;

  @IsOptional()
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  } | null;
}

// ─── Admin update (Super Admin can adjust account status) ──────────────────────

export class AdminUpdateStudentDto extends PartialType(
  UpdateStudentProfileDto,
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── List / filter students ───────────────────────────────────────────────────

export class StudentFiltersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // name, email, admissionNo

  @IsOptional()
  @IsEnum(ExamType)
  examTarget?: ExamType;

  // Same bug as questions' StatusFilter had (see update-question.dto.ts):
  // @Type(() => Boolean) coerces the incoming query string with JS's
  // Boolean() constructor, and Boolean("false") is true — so
  // ?isActive=false was silently becoming isActive:true. Fixed the same
  // way, but using the shared toBoolean transform (src/common/transforms)
  // that user-filter.dto.ts and query-library.dto.ts already use
  // correctly, instead of writing another one-off transform inline.
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  isActive?: boolean;

  @IsOptional()
  @IsIn([
    'createdAt',
    'totalXp',
    'averageScore',
    'currentStreak',
    'totalExamsTaken',
  ])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

// ─── Weak topic filters ────────────────────────────────────────────────────────

export class WeakTopicFiltersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(Subject)
  subject?: Subject;

  @IsOptional()
  @IsEnum(WeakTopicStatus)
  status?: WeakTopicStatus;

  @IsOptional()
  @IsIn([
    'averageScore',
    'timesPracticed',
    'lastPracticedAt',
    'improvementRate',
  ])
  sortBy?: string = 'averageScore';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC'; // worst first by default
}

// ─── Study activity / heatmap query ───────────────────────────────────────────

export class ActivityQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  days?: number = 90; // default: last 90 days for heatmap
}

// ─── Exam session filters (for student's own session history) ─────────────────

export class SessionHistoryFiltersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @IsOptional()
  @IsEnum(Subject)
  subject?: Subject;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(['createdAt', 'percentage', 'scaledScore', 'timeSpentSeconds'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

// ─── XP award (internal — called by other modules e.g. after exam) ────────────

export class AwardXpDto {
  @IsUUID()
  studentProfileId!: string;

  @IsInt()
  @Min(1)
  xp!: number;

  @IsOptional()
  @IsString()
  reason?: string; // e.g. 'exam_completed', 'streak_milestone'
}

// ─── Record study activity (called after session ends) ────────────────────────

export class RecordActivityDto {
  @IsUUID()
  studentProfileId!: string;

  @IsInt()
  @Min(0)
  minutesStudied!: number;

  @IsInt()
  @Min(0)
  questionsAttempted!: number;

  @IsInt()
  @Min(0)
  questionsCorrect!: number;

  @IsOptional()
  @IsArray()
  subjectBreakdown?: {
    subject: string;
    minutes: number;
    questionsAttempted: number;
    questionsCorrect: number;
    score: number;
  }[];

  @IsOptional()
  @IsInt()
  @Min(0)
  xpEarned?: number;
}
