import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UpdateLeaderboardSettingsDto {
  @ApiPropertyOptional({
    description: 'Weight applied to XP earned in the period',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  xpWeight?: number;

  @ApiPropertyOptional({
    description: 'Weight applied to current streak (days)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  streakWeight?: number;

  @ApiPropertyOptional({
    description: 'Weight applied to performance (0–100 accuracy)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  performanceWeight?: number;

  @ApiPropertyOptional({
    description: 'Weight applied to consistency (0–100 activity rate)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  consistencyWeight?: number;

  @ApiPropertyOptional({
    description: 'Minimum completed sessions to be leaderboard-eligible',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minSessionsRequired?: number;

  @ApiPropertyOptional({
    description: 'Minimum questions attempted to be leaderboard-eligible',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minQuestionsAttemptedRequired?: number;

  @ApiPropertyOptional({ description: 'Only active subscribers are eligible' })
  @IsOptional()
  @IsBoolean()
  subscribersOnly?: boolean;

  @ApiPropertyOptional({
    description:
      'Top N eligible users per category who qualify for the monthly incentive',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  incentiveTopN?: number;

  @ApiPropertyOptional({
    description:
      'Days before month-end to send a "closing soon" nudge, e.g. [7,3,1,0]',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(27, { each: true })
  @Type(() => Number)
  notifyDaysBeforeClose?: number[];

  @ApiPropertyOptional({
    description: 'Notify users when monthly results are published',
  })
  @IsOptional()
  @IsBoolean()
  notifyOnResultsPublished?: boolean;
}
