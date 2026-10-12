import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/enums';
import { KarmenCase } from './entities/karmen-case.entity';
import { KarmenInterrogationQuestion } from './entities/karmen-interrogation.entity';
import {
  CreateKarmenCaseDto,
  CreateKarmenInterrogationDto,
  UpdateKarmenCaseDto,
  UpdateKarmenInterrogationDto,
} from './dto/karmen-admin.dto';

// Admin content management for Madam Karmen — this is "the questions
// set by the admin" the operator asked for: cases and interrogation
// questions are both fully CRUD-able here, on top of the seeded
// prototype content, so the pool can keep growing without a deploy.
@ApiTags('Admin — Madam Karmen')
@ApiBearerAuth()
@Controller('admin/games/karmen')
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class KarmenAdminController {
  constructor(
    @InjectRepository(KarmenCase)
    private readonly caseRepo: Repository<KarmenCase>,
    @InjectRepository(KarmenInterrogationQuestion)
    private readonly interrogationRepo: Repository<KarmenInterrogationQuestion>,
  ) {}

  // ── Cases ──────────────────────────────────────────────
  @Get('cases')
  listCases() {
    return this.caseRepo.find({ order: { name: 'ASC' } });
  }

  @Post('cases')
  createCase(@Body() dto: CreateKarmenCaseDto) {
    return this.caseRepo.save(this.caseRepo.create({ ...dto, isActive: dto.isActive ?? true }));
  }

  @Patch('cases/:id')
  async updateCase(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateKarmenCaseDto) {
    await this.caseRepo.update(id, dto);
    return this.caseRepo.findOne({ where: { id } });
  }

  @Delete('cases/:id')
  async removeCase(@Param('id', ParseUUIDPipe) id: string) {
    await this.caseRepo.delete(id);
    return { message: 'Case removed' };
  }

  // ── Interrogation questions ────────────────────────────
  @Get('interrogations')
  listInterrogations() {
    return this.interrogationRepo.find({ order: { createdAt: 'DESC' } });
  }

  @Post('interrogations')
  createInterrogation(@Body() dto: CreateKarmenInterrogationDto) {
    return this.interrogationRepo.save(
      this.interrogationRepo.create({ ...dto, isActive: dto.isActive ?? true }),
    );
  }

  @Patch('interrogations/:id')
  async updateInterrogation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKarmenInterrogationDto,
  ) {
    await this.interrogationRepo.update(id, dto);
    return this.interrogationRepo.findOne({ where: { id } });
  }

  @Delete('interrogations/:id')
  async removeInterrogation(@Param('id', ParseUUIDPipe) id: string) {
    await this.interrogationRepo.delete(id);
    return { message: 'Interrogation question removed' };
  }
}
