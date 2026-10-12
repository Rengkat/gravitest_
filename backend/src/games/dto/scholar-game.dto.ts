import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { Subject } from 'src/common/enums/enums';

export class StartScholarSessionDto {
  @IsEnum(Subject)
  subject!: Subject;
}

export class SubmitAnswerDto {
  @IsUUID()
  sessionId!: string;

  @IsUUID()
  questionId!: string;

  @IsString()
  selectedLabel!: string;
}

export class UseLifelineDto {
  @IsUUID()
  sessionId!: string;

  @IsIn(['ll50', 'skip'])
  lifeline!: 'll50' | 'skip'; // phone/crowd stay client-side — see GamesService note
}

export class QuitSessionDto {
  @IsUUID()
  sessionId!: string;
}
