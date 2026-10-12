import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RateConversationDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class FlagConversationDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
