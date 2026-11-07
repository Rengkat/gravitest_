import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Question } from 'src/questions/entities/question.entity';
import { ExamSession } from 'src/students/entities/exam-session.entity';
import { SessionQuestion } from 'src/students/entities/session-questions.entity';
import { StudentProfile } from 'src/students/entities/student-profile.entity';
import { ExamMode, SessionStatus, UserRole } from 'src/common/enums/enums';
import { flattenEssayParts } from 'src/questions/utils/flatten-essay-parts.util';
import { assignPartIds } from 'src/questions/utils/assign-part-ids.util';
import { isActiveExam, isCorrectionReleased } from './utils/release-rules.util';

export interface ThreadRef {
  questionId: string;
  /** Permanent part id, or null for the question's own thread. */
  partId: string | null;
}

/**
 * Decides who may read or write a question's discussion. EVERY discussion
 * endpoint goes through assertCanAccess, so the integrity rules hold for
 * direct API calls exactly as they do in the UI.
 */
@Injectable()
export class DiscussionAccessService {
  constructor(
    @InjectRepository(Question) private readonly questions: Repository<Question>,
    @InjectRepository(ExamSession) private readonly sessions: Repository<ExamSession>,
    @InjectRepository(SessionQuestion) private readonly sessionQuestions: Repository<SessionQuestion>,
    @InjectRepository(StudentProfile) private readonly profiles: Repository<StudentProfile>,
  ) {}

  static isModerator(role: UserRole | undefined): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  /**
   * Resolves and validates a thread reference: the question must exist and,
   * if a part is named, it must be a real answerable part of THAT question.
   * Legacy structures without part ids are backfilled here, once.
   */
  async resolveThread(
    questionId: string,
    partId?: string | null,
  ): Promise<{ question: Question; partPath: string | null }> {
    const question = await this.questions.findOne({
      where: { id: questionId },
      select: { id: true, type: true, structure: true, isActive: true },
    });
    if (!question) throw new NotFoundException('Question not found.');
    if (!partId) return { question, partPath: null };

    let leaves = flattenEssayParts(question.structure);
    if (leaves.some((l) => !l.id)) {
      // Legacy question saved before part ids existed — give every part its permanent id now.
      question.structure = assignPartIds(question.structure);
      await this.questions.update(question.id, { structure: question.structure });
      leaves = flattenEssayParts(question.structure);
    }
    const leaf = leaves.find((l) => l.id === partId);
    if (!leaf) throw new BadRequestException('That sub-question does not belong to this question.');
    return { question, partPath: leaf.path };
  }

  async assertCanAccess(
    user: { id: string; role: UserRole },
    ref: ThreadRef,
  ): Promise<{ partPath: string | null }> {
    const { question, partPath } = await this.resolveThread(ref.questionId, ref.partId);
    if (DiscussionAccessService.isModerator(user.role)) return { partPath };

    const profile = await this.profiles
      .createQueryBuilder('p')
      .select('p.id')
      .where('p.user_id = :userId', { userId: user.id })
      .getOne();
    if (!profile) throw new ForbiddenException('Discussions are available to students.');

    // 1. Exam integrity: while the student is sitting an exam, the whole
    //    discussion API is closed to them — not just for this question.
    const live = await this.sessions.find({
      where: { studentProfileId: profile.id, mode: ExamMode.MOCK, status: SessionStatus.IN_PROGRESS },
      select: { id: true, mode: true, status: true, startedAt: true, allowedDurationSeconds: true },
      take: 20,
    });
    const now = Date.now();
    if (live.some((s) => isActiveExam(s, now))) {
      throw new ForbiddenException({
        code: 'exam_in_progress',
        message: 'Discussions are closed while an exam is in progress. They open again once you submit and your results are released.',
      });
    }

    // 2. The student must have reached the point where this question's correction is released.
    const attempts = await this.sessionQuestions
      .createQueryBuilder('sq')
      .innerJoin('sq.examSession', 'es')
      .leftJoin('sq.studentAnswer', 'sa')
      .select([
        'es.mode AS mode',
        'es.status AS status',
        'sa.id AS "answerId"',
        'sa.scoringStatus AS "scoringStatus"',
        'sa.partScores AS "partScores"',
      ])
      .where('sq.questionId = :qid', { qid: question.id })
      .andWhere('es.student_profile_id = :pid', { pid: profile.id })
      .getRawMany<{
        mode: ExamMode;
        status: SessionStatus;
        answerId: string | null;
        scoringStatus: any;
        partScores: { path: string; status?: string }[] | null;
      }>();

    const released = attempts.some((a) =>
      isCorrectionReleased({
        mode: a.mode,
        sessionStatus: a.status,
        questionType: question.type,
        hasAnswer: !!a.answerId,
        scoringStatus: a.scoringStatus ?? null,
        partScores: a.partScores,
        partPath,
      }),
    );
    if (!released) {
      throw new ForbiddenException({
        code: 'discussion_locked',
        message: 'This discussion opens after you have attempted the question and its correction is available.',
      });
    }
    return { partPath };
  }
}
