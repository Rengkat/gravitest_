import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class RenameConversationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;
}

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
