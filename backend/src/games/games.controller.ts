import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GamesService } from './games.service';
import {
  QuitSessionDto,
  StartScholarSessionDto,
  SubmitAnswerDto,
  UseLifelineDto,
} from './dto/scholar-game.dto';

@ApiTags('Games')
@ApiBearerAuth()
@Controller('games/scholar')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('subjects')
  @ApiOperation({ summary: 'Subjects with enough MCQ content for a full Scholar game' })
  getSubjects() {
    return this.gamesService.getScholarSubjects();
  }

  @Post('start')
  @ApiOperation({ summary: 'Start a new Who Wants to Be a Scholar session' })
  start(@Request() req: any, @Body() dto: StartScholarSessionDto) {
    return this.gamesService.startScholarSession(req.user.id, dto);
  }

  @Post('answer')
  @ApiOperation({ summary: 'Submit an answer for the current question' })
  answer(@Request() req: any, @Body() dto: SubmitAnswerDto) {
    return this.gamesService.submitAnswer(
      req.user.id,
      dto.sessionId,
      dto.questionId,
      dto.selectedLabel,
    );
  }

  @Post('lifeline')
  @ApiOperation({ summary: 'Use a lifeline (50:50 or skip)' })
  lifeline(@Request() req: any, @Body() dto: UseLifelineDto) {
    return this.gamesService.useLifeline(req.user.id, dto.sessionId, dto.lifeline);
  }

  @Post('quit')
  @ApiOperation({ summary: 'Walk away with the current guaranteed prize' })
  quit(@Request() req: any, @Body() dto: QuitSessionDto) {
    return this.gamesService.quitSession(req.user.id, dto.sessionId);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'My highest score and games played' })
  myStats(@Request() req: any) {
    return this.gamesService.getMyScholarStats(req.user.id);
  }

  @Get('leaderboard/monthly')
  @ApiOperation({
    summary: 'Monthly Scholar leaderboard — ranked by best single-session prize this month',
    description:
      'Open to every player, but only students with an active paid subscription are ' +
      'flagged eligible to actually win the monthly incentive.',
  })
  leaderboard(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.gamesService.getMonthlyLeaderboard({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
      currentUserId: req.user?.id,
    });
  }
}
