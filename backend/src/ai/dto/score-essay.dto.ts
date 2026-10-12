import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RubricCriterionDto {
  @IsString()
  criterion!: string;

  @IsInt()
  @Min(1)
  maxPoints!: number;
}

export class ScoreEssayDto {
  @IsOptional()
  @IsUUID()
  questionId?: string;

  @IsString()
  questionText!: string;

  @IsString()
  studentAnswer!: string;

  @IsOptional()
  @IsString()
  modelAnswer?: string;

  // R2 URLs of any diagrams/images the student included in their answer
  // (e.g. a labeled biology diagram, a circuit sketch, a graph). When
  // present, scoring is forced through the vision-capable model (see
  // AiRouterService.resolveVisionModel) so the AI actually looks at the
  // image rather than scoring on text alone.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diagramImageUrls?: string[];

  @IsInt()
  @Min(1)
  @Max(100)
  maxScore!: number;

  @IsIn(['practice', 'exam'])
  mode!: 'practice' | 'exam';

  // Optional structured rubric — if supplied, the AI scores each
  // criterion individually instead of a single freeform score.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricCriterionDto)
  rubric?: RubricCriterionDto[];
}
