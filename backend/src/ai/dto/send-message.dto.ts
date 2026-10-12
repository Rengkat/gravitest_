import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { TutorDifficulty, TutorResponseStyle } from 'src/common/enums/enums';

export class SendMessageDto {
  // Omit to start a new conversation.
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsString()
  @MaxLength(4000)
  message!: string;

  // Only used when starting a new conversation.
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsEnum(TutorDifficulty)
  difficulty?: TutorDifficulty;

  @IsOptional()
  @IsEnum(TutorResponseStyle)
  style?: TutorResponseStyle;

  @IsOptional()
  @IsBoolean()
  pidgin?: boolean;
}
