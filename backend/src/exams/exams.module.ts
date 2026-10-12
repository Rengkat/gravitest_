import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamSession } from 'src/students/entities/exam-session.entity';
import { SessionQuestion } from 'src/students/entities/session-questions.entity';
import { StudentAnswer } from 'src/students/entities/student-answers.entity';
import { Question } from 'src/questions/entities/question.entity';
import { AiEssayScore } from 'src/ai/entities/ai-essay-score.entity';
import { QuestionsModule } from 'src/questions/questions.module';
import { StudentsModule } from 'src/students/students.module';
import { AiModule } from 'src/ai/ai.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { EntitlementsModule } from 'src/entitlements/entitlements.module';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamSession, SessionQuestion, StudentAnswer, Question, AiEssayScore]),
    QuestionsModule,
    StudentsModule,
    AiModule,
    NotificationsModule,
    EntitlementsModule,
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
