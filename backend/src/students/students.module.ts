import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionQuestion } from './entities/session-questions.entity';
import { StudentAnswer } from './entities/student-answers.entity';
import { ExamSession } from './entities/exam-session.entity';
import { StudentProfile } from './entities/student-profile.entity';
import { StudyActivity } from './entities/study-activity.entity';
import { StudyStreak } from './entities/study-streak.entity';
import { WeakTopic } from './entities/weak-topic.entity';
import { TopicMasteryHistory } from './entities/topic-mastery-history.entity';
import { PaginationModule } from 'src/common/pagination/pagination.module';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService],
  imports: [
    TypeOrmModule.forFeature([
      StudentProfile,
      ExamSession,
      StudentAnswer,
      SessionQuestion,
      WeakTopic,
      StudyStreak,
      TopicMasteryHistory,
      StudyActivity,
    ]),
    PaginationModule,
  ],
  exports: [StudentsService],
})
export class StudentsModule {}
