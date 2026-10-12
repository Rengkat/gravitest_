import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import {
  BulkDeleteDto,
  BulkToggleDto,
  QuestionFiltersDto,
  UpdateQuestionDto,
} from './dto/update-question.dto';
import { Question } from './entities/question.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QuestionAnswer } from './entities/question-answer.entity';
import { QuestionOption } from './entities/question-option.entity';
import { QuestionExplanation } from './entities/question-explanation.entity';
import { DataSource } from 'typeorm';
import { BulkImportDto, BulkImportResult } from './dto/BulkQuestionsImport.dto';
import { QuestionBankStats } from './types/interface';
import { QuestionType } from 'src/common/enums/enums';
import { PaginationProvider } from 'src/common/pagination/pagination.provider';
import { PaginatedResult } from 'src/common/pagination/pagination.interface';
import {
  BulkImportDefaults,
  BulkImportParserProvider,
} from './providers/bulk-import-parser.provider';
import { Passage } from './entities/passage.entity';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,

    @InjectRepository(QuestionAnswer)
    private readonly questionAnswerRepository: Repository<QuestionAnswer>,

    private readonly dataSource: DataSource,

    private readonly paginationProvider: PaginationProvider,

    private readonly bulkImportParser: BulkImportParserProvider,

    @InjectRepository(Passage)
    private readonly passageRepository: Repository<Passage>,
  ) {}

  // ─── CREATE ────────────────────────────────────────────────────────────────
  async create(dto: CreateQuestionDto): Promise<Question> {
    this.validateQuestionTypeConstraints(dto);

    return this.dataSource.transaction(async (manager) => {
      // 1. Persist core question
      const question = manager.create(Question, {
        questionNumber: dto.questionNumber ?? null,
        examType: dto.examType,
        candidateType: dto.candidateType ?? null,
        subject: dto.subject,
        year: dto.year,
        questionText: dto.questionText,
        questionImageUrl: dto.questionImageUrl ?? null,
        difficulty: dto.difficulty,
        type: dto.type,
        topic: dto.topic ?? null,
        maxScore: dto.maxScore ?? 10,
        modelAnswer: dto.modelAnswer ?? null,
        structure: dto.structure ?? null,
        isActive: dto.isActive ?? false, // default draft until published
        passageId: dto.passageId ?? null,
      });
      const savedQuestion = await manager.save(question);

      // 2. Options (MCQ / TRUE_FALSE / OBJECTIVE)
      if (dto.options?.length) {
        const options = dto.options.map((o, idx) =>
          manager.create(QuestionOption, {
            label: o.label,
            text: o.text,
            imageUrl: o.imageUrl ?? null,
            order: o.order ?? idx,
            question: savedQuestion,
          }),
        );
        const saveOption = await manager.save(options);

        // 3. Answer — resolve the UUID of the correct option
        if (dto.answer) {
          const correctOption = saveOption.find(
            (o) => o.label === dto.answer!.correctLabel,
          );
          if (!correctOption) {
            throw new BadRequestException(
              `Answer label "${dto.answer.correctLabel}" does not match any provided option.`,
            );
          }
          const answer = manager.create(QuestionAnswer, {
            correctLabel: dto.answer.correctLabel,
            correctOptionId: correctOption.id,
            question: savedQuestion,
          });
          await manager.save(answer);
        }
      }

      // 4. Explanations
      if (dto.explanations?.length) {
        const explanations = dto.explanations.map((e) =>
          manager.create(QuestionExplanation, {
            text: e.text,
            imageUrl: e.imageUrl ?? null,
            videoUrl: e.videoUrl ?? null,
            question: savedQuestion,
          }),
        );
        await manager.save(explanations);
      }

      return manager.findOne(Question, {
        where: { id: savedQuestion.id },
        relations: ['options', 'answer', 'explanations', 'passage'],
        order: { options: { order: 'ASC' } },
      }) as Promise<Question>;
    });
  }

  // ─── LIST / SEARCH ─────────────────────────────────────────────────────────

  async findAll(
    filters: QuestionFiltersDto,
  ): Promise<PaginatedResult<Question>> {
    const {
      page = 1,
      limit = 50,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      ...fieldFilters
    } = filters;

    const qb = this.questionRepository
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.options', 'options')
      .leftJoinAndSelect('q.answer', 'answer')
      .leftJoinAndSelect('q.explanations', 'explanations')
      .leftJoinAndSelect('q.passage', 'passage');

    // ── Field filters ──
    if (fieldFilters.examType)
      qb.andWhere('q.examType = :examType', {
        examType: fieldFilters.examType,
      });
    // A question with no candidateType (null) applies to BOTH school
    // and private candidates, so filtering for one stream must still
    // surface those untagged questions alongside ones explicitly
    // tagged for it — otherwise the admin would only ever see the
    // small subset of questions someone bothered to tag.
    if (fieldFilters.candidateType)
      qb.andWhere(
        '(q.candidateType = :candidateType OR q.candidateType IS NULL)',
        { candidateType: fieldFilters.candidateType },
      );
    if (fieldFilters.subject)
      qb.andWhere('q.subject = :subject', { subject: fieldFilters.subject });
    if (fieldFilters.year)
      qb.andWhere('q.year = :year', { year: fieldFilters.year });
    if (fieldFilters.type)
      qb.andWhere('q.type = :type', { type: fieldFilters.type });
    if (fieldFilters.difficulty)
      qb.andWhere('q.difficulty = :difficulty', {
        difficulty: fieldFilters.difficulty,
      });
    if (fieldFilters.topic)
      qb.andWhere('q.topic ILIKE :topic', { topic: `%${fieldFilters.topic}%` });
    if (fieldFilters.isActive !== undefined)
      qb.andWhere('q.isActive = :isActive', {
        isActive: fieldFilters.isActive,
      });

    // ── Full-text search ──
    if (search) {
      qb.andWhere('(q.questionText ILIKE :search OR q.topic ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // ── Sort + paginate ──
    const allowedSorts: Record<string, string> = {
      createdAt: 'q.createdAt',
      year: 'q.year',
      difficulty: 'q.difficulty',
      examType: 'q.examType',
      subject: 'q.subject',
    };
    qb.orderBy(allowedSorts[sortBy] ?? 'q.createdAt', sortOrder).addOrderBy(
      'options.order',
      'ASC',
    );
    return this.paginationProvider.paginateQueryBuilder(qb, { page, limit });
  }

  // ─── FIND ONE ──────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<Question> {
    return this.findOneOrThrow(id);
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateQuestionDto): Promise<Question> {
    await this.findOneOrThrow(id);
    this.validateQuestionTypeConstraints(dto);

    return this.dataSource.transaction(async (manager) => {
      // Update scalar fields
      const coreFields: Partial<Question> = {};
      if (dto.examType !== undefined) coreFields.examType = dto.examType;
      if (dto.candidateType !== undefined)
        coreFields.candidateType = dto.candidateType ?? null;
      if (dto.subject !== undefined) coreFields.subject = dto.subject;
      if (dto.year !== undefined) coreFields.year = dto.year;
      if (dto.questionText !== undefined)
        coreFields.questionText = dto.questionText;
      if (dto.questionImageUrl !== undefined)
        coreFields.questionImageUrl = dto.questionImageUrl ?? null;
      if (dto.difficulty !== undefined) coreFields.difficulty = dto.difficulty;
      if (dto.type !== undefined) coreFields.type = dto.type;
      if (dto.topic !== undefined) coreFields.topic = dto.topic ?? null;
      if (dto.maxScore !== undefined) coreFields.maxScore = dto.maxScore;
      if (dto.modelAnswer !== undefined)
        coreFields.modelAnswer = dto.modelAnswer ?? null;
      if (dto.isActive !== undefined) coreFields.isActive = dto.isActive;
      if (dto.questionNumber !== undefined)
        coreFields.questionNumber = dto.questionNumber ?? null;
      if (dto.passageId !== undefined)
        coreFields.passageId = dto.passageId ?? null;
      if (dto.structure !== undefined)
        coreFields.structure = dto.structure ?? null;

      await manager.update(Question, id, coreFields);

      // Replace options + answer if supplied
      if (dto.options !== undefined) {
        await manager.delete(QuestionOption, { question: { id } });
        await manager.delete(QuestionAnswer, { question: { id } });

        const savedOptions = await manager.save(
          dto.options.map((o, idx) =>
            manager.create(QuestionOption, {
              label: o.label,
              text: o.text,
              imageUrl: o.imageUrl ?? null,
              order: o.order ?? idx,
              question: { id } as Question,
            }),
          ),
        );

        if (dto.answer) {
          const correct = savedOptions.find(
            (o) => o.label === dto.answer!.correctLabel,
          );
          if (!correct) {
            throw new BadRequestException(
              `Answer label "${dto.answer.correctLabel}" does not match any updated option.`,
            );
          }
          await manager.save(
            manager.create(QuestionAnswer, {
              correctLabel: dto.answer.correctLabel,
              correctOptionId: correct.id,
              question: { id } as Question,
            }),
          );
        }
      }

      // Replace explanations if supplied
      if (dto.explanations !== undefined) {
        await manager.delete(QuestionExplanation, { question: { id } });
        if (dto.explanations.length) {
          await manager.save(
            dto.explanations.map((e) =>
              manager.create(QuestionExplanation, {
                text: e.text,
                imageUrl: e.imageUrl ?? null,
                videoUrl: e.videoUrl ?? null,
                question: { id } as Question,
              }),
            ),
          );
        }
      }

      return manager.findOne(Question, {
        where: { id },
        relations: ['options', 'answer', 'explanations', 'passage'],
        order: { options: { order: 'ASC' } },
      }) as Promise<Question>;
    });
  }

  // ─── PUBLISH / TOGGLE ACTIVE ───────────────────────────────────────────────

  async toggleActive(id: string, isActive: boolean): Promise<Question> {
    const question = await this.findOneOrThrow(id);

    if (isActive) {
      this.assertPublishable(question);
    }

    await this.questionRepository.update(id, { isActive });
    return this.findOneOrThrow(id);
  }

  // ─── BULK TOGGLE ──────────────────────────────────────────────────────────

  async bulkToggleActive(dto: BulkToggleDto): Promise<{ affected: number }> {
    if (!dto.ids?.length) throw new BadRequestException('No IDs provided.');
    const result = await this.questionRepository
      .createQueryBuilder()
      .update()
      .set({ isActive: dto.isActive })
      .whereInIds(dto.ids)
      .execute();
    return { affected: result.affected ?? 0 };
  }

  // ─── SOFT DELETE (toggle inactive) ────────────────────────────────────────

  async remove(id: string): Promise<{ id: string }> {
    await this.findOneOrThrow(id);
    await this.questionRepository.delete(id);
    return { id };
  }

  // ─── BULK DELETE ──────────────────────────────────────────────────────────

  async bulkDelete(dto: BulkDeleteDto): Promise<{ affected: number }> {
    if (!dto.ids?.length) throw new BadRequestException('No IDs provided.');
    const result = await this.questionRepository
      .createQueryBuilder()
      .delete()
      .whereInIds(dto.ids)
      .execute();
    return { affected: result.affected ?? 0 };
  }

  // ─── DUPLICATE ────────────────────────────────────────────────────────────

  async duplicate(id: string): Promise<Question> {
    const original = await this.findOneOrThrow(id);

    return this.dataSource.transaction(async (manager) => {
      const copy = manager.create(Question, {
        examType: original.examType,
        candidateType: original.candidateType,
        questionNumber: original.questionNumber,
        subject: original.subject,
        year: original.year,
        questionText: `${original.questionText} (Copy)`,
        questionImageUrl: original.questionImageUrl,
        difficulty: original.difficulty,
        type: original.type,
        topic: original.topic,
        isActive: false, // copies start inactive
      });
      const savedCopy = await manager.save(copy);

      if (original.options?.length) {
        const copiedOptions = await manager.save(
          original.options.map((o) =>
            manager.create(QuestionOption, {
              label: o.label,
              text: o.text,
              imageUrl: o.imageUrl,
              order: o.order,
              question: savedCopy,
            }),
          ),
        );

        if (original.answer) {
          const matchingOption = copiedOptions.find(
            (o) => o.label === original.answer.correctLabel,
          );
          if (matchingOption) {
            await manager.save(
              manager.create(QuestionAnswer, {
                correctLabel: original.answer.correctLabel,
                correctOptionId: matchingOption.id,
                question: savedCopy,
              }),
            );
          }
        }
      }

      if (original.explanations?.length) {
        await manager.save(
          original.explanations.map((e) =>
            manager.create(QuestionExplanation, {
              text: e.text,
              imageUrl: e.imageUrl,
              videoUrl: e.videoUrl,
              question: savedCopy,
            }),
          ),
        );
      }

      return manager.findOne(Question, {
        where: { id: savedCopy.id },
        relations: ['options', 'answer', 'explanations', 'passage'],
        order: { options: { order: 'ASC' } },
      }) as Promise<Question>;
    });
  }

  // ─── STATS ────────────────────────────────────────────────────────────────

  async getBankStats(): Promise<QuestionBankStats> {
    const base = this.questionRepository.createQueryBuilder('q');

    const [
      total,
      active,
      byExamRaw,
      byCandidateTypeRaw,
      bySubjectRaw,
      byDifficultyRaw,
      byTypeRaw,
      byYearRaw,
      withExplanations,
      withImages,
    ] = await Promise.all([
      base.clone().getCount(),
      base.clone().andWhere('q.isActive = true').getCount(),
      base
        .clone()
        .select('q.examType', 'examType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('q.examType')
        .getRawMany<{ examType: string; count: string }>(),
      base
        .clone()
        .andWhere('q.candidateType IS NOT NULL')
        .select('q.candidateType', 'candidateType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('q.candidateType')
        .getRawMany<{ candidateType: string; count: string }>(),
      base
        .clone()
        .select('q.subject', 'subject')
        .addSelect('COUNT(*)', 'count')
        .groupBy('q.subject')
        .getRawMany<{ subject: string; count: string }>(),
      base
        .clone()
        .select('q.difficulty', 'difficulty')
        .addSelect('COUNT(*)', 'count')
        .groupBy('q.difficulty')
        .getRawMany<{ difficulty: string; count: string }>(),
      base
        .clone()
        .select('q.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('q.type')
        .getRawMany<{ type: string; count: string }>(),
      base
        .clone()
        .select('q.year', 'year')
        .addSelect('COUNT(*)', 'count')
        .groupBy('q.year')
        .orderBy('q.year', 'DESC')
        .getRawMany<{ year: number; count: string }>(),
      base.clone().innerJoin('q.explanations', 'e').getCount(),
      base.clone().andWhere('q.questionImageUrl IS NOT NULL').getCount(),
    ]);

    const toMap = (rows: { [k: string]: any }[], key: string) =>
      Object.fromEntries(rows.map((r) => [r[key], Number(r.count)]));

    return {
      total,
      active,
      inactive: total - active,
      byExamType: toMap(byExamRaw, 'examType'),
      byCandidateType: toMap(byCandidateTypeRaw, 'candidateType'),
      bySubject: toMap(bySubjectRaw, 'subject'),
      byDifficulty: toMap(byDifficultyRaw, 'difficulty'),
      byType: toMap(byTypeRaw, 'type'),
      byYear: Object.fromEntries(
        byYearRaw.map((r) => [Number(r.year), Number(r.count)]),
      ) as Record<number, number>,
      withExplanations,
      withImages,
    };
  }

  // ─── EXAM SESSION QUESTION POOL ────────────────────────────────────────────
  // Called by ExamSessions module when building a new session

  /**
   * The single source of truth for "which questions can a session draw
   * from" — used by both getSessionPool (to build a session) and
   * countSessionPool (to tell the student how many are available), so the
   * count shown in the wizard can never drift from what a session gets.
   */
  private buildSessionPoolQuery(params: {
    examType?: string;
    candidateType?: string;
    subjects: string[];
    year?: number;
    difficulty?: string;
    type?: string;
  }) {
    const qb = this.questionRepository
      .createQueryBuilder('q')
      .where('q.isActive = true');

    if (params.examType)
      qb.andWhere('q.examType = :examType', { examType: params.examType });
    // Same "untagged = applies to both" rule as findAll() — a student
    // who picked "Private Candidate" should still get the (majority of)
    // questions nobody's specifically tagged as school-only.
    if (params.candidateType)
      qb.andWhere(
        '(q.candidateType = :candidateType OR q.candidateType IS NULL)',
        { candidateType: params.candidateType },
      );
    if (params.subjects?.length)
      qb.andWhere('q.subject IN (:...subjects)', {
        subjects: params.subjects,
      });
    if (params.year) qb.andWhere('q.year = :year', { year: params.year });
    if (params.difficulty)
      qb.andWhere('q.difficulty = :difficulty', {
        difficulty: params.difficulty,
      });
    if (params.type) qb.andWhere('q.type = :type', { type: params.type });
    return qb;
  }

  /** How many active questions match — for a top-level question (a theory/practical one counts once, with all its nested parts). */
  async countSessionPool(params: {
    examType?: string;
    candidateType?: string;
    subjects: string[];
    year?: number;
    difficulty?: string;
    type?: string;
  }): Promise<number> {
    return this.buildSessionPoolQuery(params).getCount();
  }

  async getSessionPool(params: {
    examType?: string;
    candidateType?: string;
    subjects: string[];
    year?: number;
    difficulty?: string;
    type?: string;
    limit: number;
    shuffled?: boolean;
  }): Promise<Question[]> {
    // Step 1: fetch matching question IDs only (no joins = no DISTINCT problem)
    const idQb = this.buildSessionPoolQuery(params).select('q.id');

    const allIds = await idQb.getMany();

    if (!allIds.length) return [];

    // Step 2: shuffle in memory and pick limit
    let ids = allIds.map((q) => q.id);
    if (params.shuffled) {
      ids = ids.sort(() => Math.random() - 0.5);
    }
    ids = ids.slice(0, params.limit);

    // Step 3: fetch full question data with relations for the selected IDs.
    // IMPORTANT: this is the pool a student's practice/exam session is
    // actually built from (see the controller's ApiOperation description
    // above) — the previous version joined in `answer` and returned it
    // directly to the client with nothing stripping it, meaning every
    // question a student was served came with its correct answer key
    // attached in the same response. verifyAnswer() below already exists
    // as the correct, safe way to check correctness without exposing the
    // key upfront — so `answer` is now dropped here before the response
    // goes out, not joined into the query at all.
    const questions = await this.questionRepository
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.options', 'options')
      .leftJoinAndSelect('q.passage', 'passage')
      .whereInIds(ids)
      .orderBy('options.order', 'ASC')
      .getMany();

    // Same class of leak as the `answer` relation above, just missed for
    // essay/theory questions: modelAnswer is the mark scheme an admin
    // writes for AI-assisted grading, not something a student sitting
    // the exam should ever receive. Nothing above selected it out (it's
    // a plain column on Question, not a joined relation), so it was
    // going out in every essay question in every session pool response.
    return questions.map((q) => ({ ...q, modelAnswer: null }));
  }

  // ─── ANSWER VERIFICATION ───────────────────────────────────────────────────
  // Called by ExamSessions when auto-scoring MCQ submissions

  // ─── SUBJECT AVAILABILITY (used by the games module to only offer a ──
  // subject once there's actually enough MCQ content to fill a session) ──
  async getMcqSubjectCounts(): Promise<{ subject: string; count: number }[]> {
    const rows = await this.questionRepository
      .createQueryBuilder('q')
      .select('q.subject', 'subject')
      .addSelect('COUNT(*)', 'count')
      .where('q.isActive = true')
      .andWhere('q.type = :type', { type: QuestionType.MCQ })
      .groupBy('q.subject')
      .getRawMany();

    return rows.map((r) => ({
      subject: r.subject,
      count: parseInt(r.count, 10),
    }));
  }

  async verifyAnswer(
    questionId: string,
    selectedLabel: string,
  ): Promise<boolean> {
    const answer = await this.questionAnswerRepository.findOne({
      where: { question: { id: questionId } },
    });
    if (!answer) return false;
    return answer.correctLabel === selectedLabel;
  }

  // Same lookup as verifyAnswer, but also returns the correct label —
  // safe to call once a round is actually over (the game/exam UI is
  // about to reveal the correct answer regardless), unlike exposing it
  // up front when the question is first served.
  async checkAnswer(
    questionId: string,
    selectedLabel: string,
  ): Promise<{ isCorrect: boolean; correctLabel: string | null }> {
    const answer = await this.questionAnswerRepository.findOne({
      where: { question: { id: questionId } },
    });
    if (!answer) return { isCorrect: false, correctLabel: null };
    return {
      isCorrect: answer.correctLabel === selectedLabel,
      correctLabel: answer.correctLabel,
    };
  }

  // ─── BULK IMPORT ──────────────────────────────────────────────────────────
  // Processes each row individually so partial success is possible.
  // Errors are collected and returned; the caller decides whether to retry.

  async bulkImport(dto: BulkImportDto): Promise<BulkImportResult> {
    const result: BulkImportResult = { imported: 0, failed: 0, errors: [] };

    for (let i = 0; i < dto.questions.length; i++) {
      const row = dto.questions[i];
      try {
        await this.create(row);
        result.imported++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          reason: err?.message ?? 'Unknown error',
        });
      }
    }

    return result;
  }

  // class-validator puts messages for a plain field on error.constraints,
  // but for a @ValidateNested() property (options/answer/explanations on
  // CreateQuestionDto) the parent error has NO constraints of its own —
  // the actual messages live on error.children[].constraints, recursively.
  // The old code only ever read the top-level e.constraints, so any
  // failure inside options/answer/explanations produced an empty string;
  // joining three of those with '; ' is exactly the "; ;" every row was
  // showing. This walks the full error tree instead of just the top level.
  private flattenValidationErrors(
    errors: ValidationError[],
    prefix = '',
  ): string[] {
    const messages: string[] = [];
    for (const error of errors) {
      const path = prefix ? `${prefix}.${error.property}` : error.property;
      if (error.constraints) {
        messages.push(
          ...Object.values(error.constraints).map((msg) => `${path}: ${msg}`),
        );
      }
      if (error.children?.length) {
        messages.push(...this.flattenValidationErrors(error.children, path));
      }
    }
    return messages;
  }

  // ─── BULK IMPORT FROM FILE (CSV or JSON) ────────────────────────────────────
  //
  // Handles the actual "upload a spreadsheet of past questions" workflow —
  // bulkImport() above only accepts a fully-formed JSON array and has no
  // UI calling it. This is what the admin's Bulk Import page (see
  // /admin/questions/bulk-import on the frontend) actually posts to.
  //
  // `defaults` are the exam-level fields an admin sets once for the whole
  // file (examType/subject/year/difficulty/type — the same params as the
  // single "Add Question" form) so individual CSV rows don't have to
  // repeat them. Rows that share identical passage text (and image, and
  // examType+subject) are automatically grouped into one Passage record —
  // this is how a JAMB/WAEC-style comprehension set (one passage, several
  // questions) gets built from a flat spreadsheet without a separate join
  // file: the admin just pastes the same passage into each of that set's
  // rows, matching how these spreadsheets naturally arrive from exam boards.
  //
  // dryRun=true parses and validates everything but persists nothing —
  // used by the frontend's "Preview" step so an admin can see row counts
  // and errors before committing.
  async bulkImportFromFile(
    fileBuffer: Buffer,
    format: 'csv' | 'json',
    defaults: BulkImportDefaults,
    dryRun: boolean,
  ): Promise<BulkImportResult> {
    const text = fileBuffer.toString('utf-8');

    let outcome: ReturnType<BulkImportParserProvider['buildQuestionInput']>;

    if (format === 'json') {
      const parsed = this.bulkImportParser.parseJson(text);
      const rawRows = (parsed.questions ?? []).map((q) =>
        this.jsonQuestionToRawRow(q),
      );
      outcome = this.bulkImportParser.buildQuestionInput(rawRows, defaults);
    } else {
      const rawRows = this.bulkImportParser.parseCsv(text);
      if (rawRows.length === 0) {
        throw new BadRequestException(
          'No data rows found — check the file has a header row plus at least one question.',
        );
      }
      outcome = this.bulkImportParser.buildQuestionInput(rawRows, defaults);
    }

    // Validate every parsed DTO up front (class-validator) so bad rows are
    // reported without touching the database at all, even when dryRun is
    // false — a row that fails validation never reaches this.create().
    const validationErrors: { row: number; reason: string }[] = [];
    const validRows: typeof outcome.rows = [];
    for (const row of outcome.rows) {
      // row.dto was built by hand in BulkImportParserProvider — `new
      // CreateQuestionDto()` plus manual property assignment — so its
      // nested arrays (options/answer/explanations/structure) are still
      // plain objects, not real CreateOptionDto/CreateAnswerDto/
      // CreateExplanationDto/EssayPartDto instances. The single "Add
      // Question" endpoint gets that conversion for free from the global
      // ValidationPipe's `transform: true` (see main.ts), which runs
      // class-transformer's plainToInstance() before class-validator's
      // validate() ever sees the body. This import path never goes
      // through that pipe, so without doing the same conversion here,
      // @ValidateNested() on those fields has nothing it recognizes to
      // recurse into and every nested option/answer/explanation fails
      // with "an unknown value was passed to the validate function" —
      // on every row, regardless of content. Running plainToInstance by
      // hand fixes it and matches what the form-based path already does.
      const dto = plainToInstance(CreateQuestionDto, row.dto, {
        enableImplicitConversion: true,
      });
      const errors = await validate(dto, { whitelist: true });
      if (errors.length) {
        const reason = this.flattenValidationErrors(errors).join('; ');
        validationErrors.push({
          row: row.rowNumber,
          reason: reason || 'Invalid row (see options/answer/explanations)',
        });
      } else {
        validRows.push({ ...row, dto });
      }
    }

    const allErrors = [...outcome.rowErrors, ...validationErrors].sort(
      (a, b) => a.row - b.row,
    );

    if (dryRun) {
      return {
        imported: 0,
        failed: allErrors.length,
        errors: allErrors,
        passagesCreated: outcome.passages.length,
        dryRun: true,
        // validRows.length, not preview.length — preview below is capped
        // to 10 rows for display, so it would silently undercount on
        // larger files if used to answer "how many would import?".
        wouldImport: validRows.length,
        preview: validRows.slice(0, 10).map((r) => r.dto),
      };
    }

    // ── Persist passages first, building key → real UUID map ──
    const passageIdByKey = new Map<string, string>();
    let passagesCreated = 0;
    for (const p of outcome.passages) {
      try {
        const saved = await this.passageRepository.save(
          this.passageRepository.create({
            examType: p.examType,
            subject: p.subject,
            year: p.year,
            title: p.title,
            instructions: p.instructions,
            passageText: p.passageText,
            passageImageUrl: p.passageImageUrl,
            isActive: true,
          }),
        );
        passageIdByKey.set(p.key, saved.id);
        passagesCreated++;
      } catch (err: any) {
        // Every question that depended on this passage becomes a failure
        // too — there's no sensible way to save a comprehension question
        // with a passage that didn't actually get created.
        allErrors.push({
          row: 0,
          reason: `Failed to create passage "${p.title}": ${err?.message}`,
        });
      }
    }

    const result: BulkImportResult = {
      imported: 0,
      failed: allErrors.length,
      errors: allErrors,
      passagesCreated,
    };

    for (const row of validRows) {
      try {
        if (row.passageKey) {
          const passageId = passageIdByKey.get(row.passageKey);
          if (!passageId) {
            throw new Error('Linked passage failed to import');
          }
          row.dto.passageId = passageId;
        }
        await this.create(row.dto);
        result.imported++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({
          row: row.rowNumber,
          reason: err?.message ?? 'Unknown error',
        });
      }
    }

    return result;
  }

  // Maps the full-fidelity JSON question shape down to the same flat
  // "raw row" shape the CSV path produces, so both formats share one
  // grouping/validation pipeline. JSON rows may pass options/answer/
  // explanations as proper nested objects OR as the flat A/B/C/D columns —
  // both are accepted.
  private jsonQuestionToRawRow(q: Record<string, any>): Record<string, string> {
    const raw: Record<string, string> = {};
    const flatFields = [
      'questionNumber',
      'examType',
      'subject',
      'topic',
      'questionText',
      'questionImageUrl',
      'difficulty',
      'type',
      'maxScore',
      'modelAnswer',
      'passageTitle',
      'passageText',
      'passageInstructions',
      'passageImageUrl',
    ];
    for (const field of flatFields) {
      if (q[field] !== undefined && q[field] !== null)
        raw[field] = String(q[field]);
    }
    if (q.year !== undefined) raw.year = String(q.year);

    if (Array.isArray(q.options)) {
      for (const opt of q.options) {
        const label = String(opt.label ?? '').toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(label)) {
          raw[`option${label}`] = opt.text ?? '';
          if (opt.imageUrl) raw[`option${label}Image`] = opt.imageUrl;
        }
      }
    } else {
      for (const label of ['A', 'B', 'C', 'D']) {
        if (q[`option${label}`] !== undefined)
          raw[`option${label}`] = q[`option${label}`];
        if (q[`option${label}Image`] !== undefined)
          raw[`option${label}Image`] = q[`option${label}Image`];
      }
    }

    if (q.answer?.correctLabel) raw.correctLabel = q.answer.correctLabel;
    else if (q.correctLabel) raw.correctLabel = q.correctLabel;

    if (Array.isArray(q.explanations) && q.explanations.length) {
      raw.explanation = q.explanations[0].text ?? '';
      if (q.explanations[0].imageUrl)
        raw.explanationImageUrl = q.explanations[0].imageUrl;
    } else if (q.explanation) {
      raw.explanation = q.explanation;
    }

    // Essay structure — kept as native JSON here and re-stringified only
    // because it then flows through the exact same buildQuestionInput()
    // path CSV rows use (see BulkImportParserProvider), rather than
    // forking a second code path just for this one field.
    if (q.structure !== undefined && q.structure !== null) {
      raw.structure = JSON.stringify(q.structure);
    }

    return raw;
  }

  // ─── PRIVATE HELPERS ───────────────────────────────────────────────────────

  private async findOneOrThrow(id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['options', 'answer', 'explanations', 'passage'],
      order: { options: { order: 'ASC' } },
    });
    if (!question) {
      throw new NotFoundException(`Question "${id}" not found.`);
    }
    return question;
  }

  private validateQuestionTypeConstraints(
    dto: Partial<CreateQuestionDto>,
  ): void {
    const mcqTypes = [
      QuestionType.MCQ,
      QuestionType.TRUE_FALSE,
      QuestionType.OBJECTIVE,
    ];
    const isMcq = dto.type && mcqTypes.includes(dto.type as QuestionType);

    if (isMcq && dto.options !== undefined && dto.options.length < 2) {
      throw new BadRequestException(
        'MCQ questions require at least 2 options.',
      );
    }

    if (isMcq && dto.options?.length && !dto.answer) {
      throw new BadRequestException('MCQ questions require an answer.');
    }
  }

  private assertPublishable(question: Question): void {
    const mcqTypes = [
      QuestionType.MCQ,
      QuestionType.TRUE_FALSE,
      QuestionType.OBJECTIVE,
    ];
    const isMcq = mcqTypes.includes(question.type);

    if (isMcq && (!question.options?.length || !question.answer)) {
      throw new BadRequestException(
        'Cannot publish MCQ question without options and an answer.',
      );
    }
  }
}
