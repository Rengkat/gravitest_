import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { QuestionExplanation } from './entities/question-explanation.entity';
import { QuestionAnswer } from './entities/question-answer.entity';
import { QuestionOption } from './entities/question-option.entity';
import { Question } from './entities/question.entity';
import { Passage } from './entities/passage.entity';
import { PassagesService } from './passages.service';
import { PassagesController } from './passages.controller';
import { BulkImportParserProvider } from './providers/bulk-import-parser.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaginationModule } from 'src/common/pagination/pagination.module';

@Module({
  controllers: [QuestionsController, PassagesController],
  providers: [QuestionsService, PassagesService, BulkImportParserProvider],
  imports: [
    TypeOrmModule.forFeature([
      Question,
      QuestionOption,
      QuestionAnswer,
      QuestionExplanation,
      Passage,
    ]),
    PaginationModule,
  ],
  exports: [QuestionsService, PassagesService],
})
export class QuestionsModule {}
