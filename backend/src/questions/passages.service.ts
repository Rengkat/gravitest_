import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Passage } from './entities/passage.entity';
import { Question } from './entities/question.entity';
import {
  CreatePassageDto,
  PassageFiltersDto,
  UpdatePassageDto,
} from './dto/passage.dto';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginatedResult } from 'src/common/pagination/pagination.interface';

@Injectable()
export class PassagesService {
  constructor(
    @InjectRepository(Passage)
    private readonly passageRepository: Repository<Passage>,

    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,

    private readonly paginationProvider: PaginationProvider,
  ) {}

  async create(dto: CreatePassageDto): Promise<Passage> {
    if (!dto.passageText && !dto.passageImageUrl) {
      throw new BadRequestException(
        'A passage needs either passageText, passageImageUrl, or both.',
      );
    }
    const passage = this.passageRepository.create({
      examType: dto.examType,
      subject: dto.subject,
      year: dto.year,
      title: dto.title ?? null,
      instructions: dto.instructions ?? null,
      passageText: dto.passageText ?? null,
      passageImageUrl: dto.passageImageUrl ?? null,
      isActive: dto.isActive ?? true,
    });
    return this.passageRepository.save(passage);
  }

  async findAll(filters: PassageFiltersDto): Promise<PaginatedResult<Passage>> {
    const { page = 1, limit = 20, examType, subject, year } = filters;

    const qb = this.passageRepository
      .createQueryBuilder('p')
      .loadRelationCountAndMap('p.questionCount', 'p.questions')
      .orderBy('p.createdAt', 'DESC');

    if (examType) qb.andWhere('p.examType = :examType', { examType });
    if (subject) qb.andWhere('p.subject = :subject', { subject });
    if (year) qb.andWhere('p.year = :year', { year });

    return this.paginationProvider.paginateQueryBuilder(qb, { page, limit });
  }

  async findOne(id: string): Promise<Passage> {
    const passage = await this.passageRepository.findOne({
      where: { id },
      relations: ['questions', 'questions.options', 'questions.answer'],
      order: { questions: { questionNumber: 'ASC' } },
    });
    if (!passage) {
      throw new NotFoundException(`Passage "${id}" not found.`);
    }
    return passage;
  }

  async update(id: string, dto: UpdatePassageDto): Promise<Passage> {
    const passage = await this.findOne(id);
    Object.assign(passage, {
      ...(dto.examType !== undefined && { examType: dto.examType }),
      ...(dto.subject !== undefined && { subject: dto.subject }),
      ...(dto.year !== undefined && { year: dto.year }),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.instructions !== undefined && { instructions: dto.instructions }),
      ...(dto.passageText !== undefined && { passageText: dto.passageText }),
      ...(dto.passageImageUrl !== undefined && {
        passageImageUrl: dto.passageImageUrl,
      }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });
    return this.passageRepository.save(passage);
  }

  async remove(id: string): Promise<{ message: string }> {
    const passage = await this.findOne(id);
    const linkedCount = await this.questionRepository.count({
      where: { passageId: id },
    });
    if (linkedCount > 0) {
      throw new BadRequestException(
        `Cannot delete — ${linkedCount} question(s) still reference this passage. ` +
          `Reassign or delete them first.`,
      );
    }
    await this.passageRepository.remove(passage);
    return { message: 'Passage deleted' };
  }
}
