import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ExamType, DifficultyLevel } from 'src/common/enums/enums';
import { CreateUserDto } from './create-user.dto';
import { UserResponseDto } from './user-response.dto';

// ─────────────────────────────────────────────
// CREATE STUDENT DTO
// Who calls it:
//   1. Student self-registers via POST /auth/register (role = STUDENT)
//   2. Super Admin creates student via POST /users
//
// The base CreateUserDto handles all common fields.
// This adds student-specific fields.
export class CreateStudentDto extends CreateUserDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @IsInt()
  @Min(new Date().getFullYear())
  @Max(new Date().getFullYear() + 10)
  graduationYear?: number;

  @ApiPropertyOptional({
    enum: ExamType,
    isArray: true,
    example: [ExamType.JAMB, ExamType.WAEC],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ExamType, { each: true })
  examTypes?: ExamType[];

  @ApiPropertyOptional({
    type: [String],
    example: ['physics', 'mathematics', 'chemistry'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @ApiPropertyOptional({
    example: 320,
    description: 'JAMB target score (0–400)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(400)
  targetScore?: number;
}
// ─────────────────────────────────────────────
// UPDATE STUDENT DTO
// Student updates their own exam preferences.
// ─────────────────────────────────────────────
export class UpdateStudentDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @IsInt()
  @Min(new Date().getFullYear())
  @Max(new Date().getFullYear() + 10)
  graduationYear?: number;

  @ApiPropertyOptional({ enum: ExamType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ExamType, { each: true })
  examTypes?: ExamType[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @ApiPropertyOptional({ example: 320 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(400)
  targetScore?: number;
}

// ─────────────────────────────────────────────
// STUDENT RESPONSE DTO
// What the API returns for student users.
// Extends UserResponseDto with student-specific fields.
// ─────────────────────────────────────────────
export class StudentResponseDto extends UserResponseDto {
  @Expose()
  @ApiPropertyOptional({ example: 2026 })
  graduationYear?: number;

  @Expose()
  @ApiPropertyOptional({ enum: ExamType, isArray: true })
  examTypes?: ExamType[];

  @Expose()
  @ApiPropertyOptional({ type: [String] })
  subjects?: string[];

  @Expose()
  @ApiProperty({ example: 14 })
  streakCount!: number;

  @Expose()
  @ApiProperty({ example: 1200 })
  xpPoints!: number;

  @Expose()
  @ApiPropertyOptional({ example: 320 })
  targetScore?: number;

  // Stats (populated from UserProgress records)
  @Expose()
  @ApiProperty({ example: 42 })
  totalSessions!: number;

  @Expose()
  @ApiProperty({ example: 67.4 })
  averageScore!: number;

  @Expose()
  @ApiPropertyOptional({ enum: DifficultyLevel })
  performanceLevel?: DifficultyLevel;
}
