import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Question } from 'src/questions/entities/question.entity';
import { ExamSession } from 'src/students/entities/exam-session.entity';
import { SessionQuestion } from 'src/students/entities/session-questions.entity';
import { StudentAnswer } from 'src/students/entities/student-answers.entity';
import { StudentProfile } from 'src/students/entities/student-profile.entity';
import { User } from 'src/user/entities/user.entity';
import { StorageModule } from 'src/storage/storage.module';
import { QuestionContribution } from './entities/question-contribution.entity';
import { ContributionReaction } from './entities/contribution-reaction.entity';
import { ContributionReport } from './entities/contribution-report.entity';
import { DiscussionAccessService } from './discussion-access.service';
import { DiscussionsService } from './discussions.service';
import { DiscussionsController } from './discussions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuestionContribution,
      ContributionReaction,
      ContributionReport,
      Question,
      ExamSession,
      SessionQuestion,
      StudentAnswer,
      StudentProfile,
      User,
    ]),
    StorageModule,
  ],
  controllers: [DiscussionsController],
  providers: [DiscussionAccessService, DiscussionsService],
  exports: [DiscussionAccessService],
})
export class DiscussionsModule {}
