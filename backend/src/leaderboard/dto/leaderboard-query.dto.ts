import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ExamType, UserRole } from 'src/common/enums/enums';
import { toBoolean } from 'src/common/transforms/transforms';

export enum LeaderboardScope {
  GENERAL = 'general', // all eligible users, every category
  CATEGORY = 'category', // scoped to a single category (§1.1.2)
  EXAM_TYPE = 'exam_type', // scoped to a single exam type (§1.1.3)
}

export class LeaderboardQueryDto {
  @ApiPropertyOptional({ enum: LeaderboardScope, default: LeaderboardScope.GENERAL })
  @IsOptional()
  @IsEnum(LeaderboardScope)
  scope?: LeaderboardScope = LeaderboardScope.GENERAL;

  @ApiPropertyOptional({
    enum: [UserRole.STUDENT, UserRole.PROFESSIONAL_STUDENT],
    description: 'Required when scope=category',
  })
  @IsOptional()
  @IsIn([UserRole.STUDENT, UserRole.PROFESSIONAL_STUDENT])
  category?: UserRole;

  @ApiPropertyOptional({ enum: ExamType, description: 'Required when scope=exam_type' })
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @ApiPropertyOptional({
    description: "'current' (default) or a specific finalized period, e.g. '2026-09'",
    default: 'current',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(current|\d{4}-(0[1-9]|1[0-2]))$/, {
    message: "period must be 'current' or 'YYYY-MM'",
  })
  period?: string = 'current';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // Admin-only escape hatch to see ineligible users too (debugging /
  // support). Regular student-facing endpoints never set this.
  // NOT @Type(() => Boolean): that runs Boolean("false"), which is true, so
  // ?includeIneligible=false (what the admin page sends while its toggle is
  // off) was silently listing ineligible students as if they were ranked.
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  includeIneligible?: boolean = false;
}
