import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { GameSession } from './entities/game-session.entity';
import { KarmenCase } from './entities/karmen-case.entity';
import { KarmenInterrogationQuestion } from './entities/karmen-interrogation.entity';
import { KarmenSession } from './entities/karmen-session.entity';
import { KarmenService } from './karmen.service';
import { KarmenController } from './karmen.controller';
import { KarmenAdminController } from './karmen-admin.controller';
import { KarmenSeedService } from './seed/karmen-seed.service';
import { WordConnectPuzzle } from './entities/word-connect-puzzle.entity';
import { WordConnectSession } from './entities/word-connect-session.entity';
import { WordConnectService } from './word-connect.service';
import { WordConnectController } from './word-connect.controller';
import { WordConnectAdminController } from './word-connect-admin.controller';
import { WordConnectSeedService } from './seed/word-connect-seed.service';
import { QuestionsModule } from 'src/questions/questions.module';
import { StudentsModule } from 'src/students/students.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';

@Module({
  controllers: [
    GamesController,
    KarmenController,
    KarmenAdminController,
    WordConnectController,
    WordConnectAdminController,
  ],
  providers: [
    GamesService,
    KarmenService,
    KarmenSeedService,
    WordConnectService,
    WordConnectSeedService,
  ],
  imports: [
    TypeOrmModule.forFeature([
      GameSession,
      KarmenCase,
      KarmenInterrogationQuestion,
      KarmenSession,
      WordConnectPuzzle,
      WordConnectSession,
    ]),
    QuestionsModule,
    StudentsModule,
    SubscriptionsModule,
  ],
  exports: [GamesService, KarmenService, WordConnectService],
})
export class GamesModule {}
