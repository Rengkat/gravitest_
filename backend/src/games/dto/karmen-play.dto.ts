import { IsIn, IsInt, IsUUID, Max, Min } from 'class-validator';

export class KarmenSessionIdDto {
  @IsUUID()
  sessionId!: string;
}

export class SubmitKarmenAnswerDto extends KarmenSessionIdDto {
  @IsUUID()
  chosenCaseId!: string;

  // How many seconds were left on the 30s clock when they answered —
  // drives the server-side time bonus (secondsLeft * 3 points). Purely
  // additive to score, never affects correctness, so a client lying
  // about this only inflates their own score slightly — same trust
  // level as the client-side countdown display itself.
  @IsInt()
  @Min(0)
  @Max(30)
  secondsLeft!: number;
}

export class AnswerKarmenInterrogationDto extends KarmenSessionIdDto {
  @IsInt()
  @Min(0)
  @Max(3)
  selectedIndex!: number;
}
