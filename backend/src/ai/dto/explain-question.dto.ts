import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class ExplainQuestionDto {
  @IsUUID()
  questionId!: string;

  // The option label the student actually picked (e.g. 'B') — when given,
  // the explanation specifically addresses why that choice was wrong.
  @IsOptional()
  @IsString()
  studentAnswerLabel?: string;

  // 'standard' (default) is the normal explanation shown right after
  // answering. 'detailed' is the on-demand "explain more" follow-up —
  // step-by-step reasoning, a worked example, and common misconceptions.
  @IsOptional()
  @IsIn(['standard', 'detailed'])
  detailLevel?: 'standard' | 'detailed';
}
