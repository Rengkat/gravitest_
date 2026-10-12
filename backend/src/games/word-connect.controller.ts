import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WordConnectService } from './word-connect.service';
import {
  StartWordConnectDto,
  SubmitWordDto,
  WordConnectSessionIdDto,
} from './dto/word-connect.dto';

@ApiTags('Games — Word Connect')
@ApiBearerAuth()
@Controller('games/word-connect')
export class WordConnectController {
  constructor(private readonly service: WordConnectService) {}

  @Get('subjects')
  @ApiOperation({ summary: 'Subjects that have Word Connect puzzles available' })
  getSubjects() {
    return this.service.getSubjects();
  }

  @Post('start')
  @ApiOperation({ summary: 'Start a new Word Connect session for a subject' })
  start(@Request() req: any, @Body() dto: StartWordConnectDto) {
    return this.service.startSession(req.user.id, dto.subjectKey);
  }

  @Post('word')
  @ApiOperation({ summary: 'Submit a guess for one word in the current puzzle' })
  submit(@Request() req: any, @Body() dto: SubmitWordDto) {
    return this.service.submitWord(req.user.id, dto.sessionId, dto.wordIndex, dto.guess);
  }

  @Post('quit')
  @ApiOperation({ summary: 'End the current session, keeping the score earned' })
  quit(@Request() req: any, @Body() dto: WordConnectSessionIdDto) {
    return this.service.quitSession(req.user.id, dto.sessionId);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'My high score and games played' })
  myStats(@Request() req: any) {
    return this.service.getMyStats(req.user.id);
  }

  @Get('leaderboard/monthly')
  @ApiOperation({
    summary: 'Monthly Word Connect leaderboard — ranked by best single session this month',
    description:
      'Free to play for everyone; only students with an active paid subscription are flagged ' +
      'eligible to win the monthly incentive.',
  })
  leaderboard(@Request() req: any, @Query('page') page = '1', @Query('limit') limit = '50') {
    return this.service.getMonthlyLeaderboard({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
      currentUserId: req.user?.id,
    });
  }
}
