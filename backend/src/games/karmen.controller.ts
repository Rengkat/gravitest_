import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KarmenService } from './karmen.service';
import {
  AnswerKarmenInterrogationDto,
  KarmenSessionIdDto,
  SubmitKarmenAnswerDto,
} from './dto/karmen-play.dto';

@ApiTags('Games — Madam Karmen')
@ApiBearerAuth()
@Controller('games/karmen')
export class KarmenController {
  constructor(private readonly karmenService: KarmenService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new Where in Nigeria is Madam Karmen? session' })
  start(@Request() req: any) {
    return this.karmenService.startSession(req.user.id);
  }

  @Post('answer')
  @ApiOperation({ summary: 'Submit a guess for the current case' })
  answer(@Request() req: any, @Body() dto: SubmitKarmenAnswerDto) {
    return this.karmenService.submitAnswer(req.user.id, dto.sessionId, dto.chosenCaseId, dto.secondsLeft);
  }

  @Post('skip')
  @ApiOperation({ summary: 'Skip the current case (small score penalty, no life lost)' })
  skip(@Request() req: any, @Body() dto: KarmenSessionIdDto) {
    return this.karmenService.skipClue(req.user.id, dto.sessionId);
  }

  @Post('hint')
  @ApiOperation({ summary: 'Use a hint on the current case' })
  hint(@Request() req: any, @Body() dto: KarmenSessionIdDto) {
    return this.karmenService.useHint(req.user.id, dto.sessionId);
  }

  @Get('interrogation')
  @ApiOperation({ summary: 'Get the pending interrogation question, if any' })
  getInterrogation(@Request() req: any, @Query('sessionId') sessionId: string) {
    return this.karmenService.getPendingInterrogation(req.user.id, sessionId);
  }

  @Post('interrogation/answer')
  @ApiOperation({ summary: 'Answer the pending interrogation question' })
  answerInterrogation(@Request() req: any, @Body() dto: AnswerKarmenInterrogationDto) {
    return this.karmenService.answerInterrogation(req.user.id, dto.sessionId, dto.selectedIndex);
  }

  @Post('quit')
  @ApiOperation({ summary: 'Walk away from the current game' })
  quit(@Request() req: any, @Body() dto: KarmenSessionIdDto) {
    return this.karmenService.quitSession(req.user.id, dto.sessionId);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'My high score and games played' })
  myStats(@Request() req: any) {
    return this.karmenService.getMyStats(req.user.id);
  }

  @Get('leaderboard/monthly')
  @ApiOperation({ summary: 'Monthly Madam Karmen leaderboard — ranked by best score this month' })
  leaderboard(@Request() req: any, @Query('page') page = '1', @Query('limit') limit = '50') {
    return this.karmenService.getMonthlyLeaderboard({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
      currentUserId: req.user?.id,
    });
  }
}
