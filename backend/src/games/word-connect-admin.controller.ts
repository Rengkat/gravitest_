import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/enums';
import { WordConnectPuzzle } from './entities/word-connect-puzzle.entity';
import {
  CreateWordConnectPuzzleDto,
  UpdateWordConnectPuzzleDto,
} from './dto/word-connect.dto';

// Admin content management for Word Connect — puzzles are fully
// CRUD-able on top of the seeded prototype content, so the bank can keep
// growing without a deploy.
@ApiTags('Admin — Word Connect')
@ApiBearerAuth()
@Controller('admin/games/word-connect')
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class WordConnectAdminController {
  constructor(
    @InjectRepository(WordConnectPuzzle)
    private readonly puzzleRepo: Repository<WordConnectPuzzle>,
  ) {}

  @Get('puzzles')
  @ApiOperation({ summary: 'List all puzzles, optionally filtered by subject' })
  list(@Query('subjectKey') subjectKey?: string) {
    return this.puzzleRepo.find({
      where: subjectKey ? { subjectKey } : {},
      order: { subjectKey: 'ASC', orderIndex: 'ASC' },
    });
  }

  @Get('puzzles/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.puzzleRepo.findOne({ where: { id } });
  }

  @Post('puzzles')
  @ApiOperation({
    summary: 'Create a puzzle',
    description:
      'Words carry their own grid coordinates (row/col/dir). Intersecting words must agree on ' +
      'the shared letter — validate visually in the admin grid editor before saving.',
  })
  create(@Body() dto: CreateWordConnectPuzzleDto) {
    return this.puzzleRepo.save(
      this.puzzleRepo.create({
        ...dto,
        words: dto.words.map((w) => ({ ...w, word: w.word.toUpperCase() })),
        isActive: dto.isActive ?? true,
      }),
    );
  }

  @Patch('puzzles/:id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWordConnectPuzzleDto) {
    const patch: any = { ...dto };
    if (dto.words) patch.words = dto.words.map((w) => ({ ...w, word: w.word.toUpperCase() }));
    await this.puzzleRepo.update(id, patch);
    return this.puzzleRepo.findOne({ where: { id } });
  }

  @Delete('puzzles/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.puzzleRepo.delete(id);
    return { message: 'Puzzle removed' };
  }
}
