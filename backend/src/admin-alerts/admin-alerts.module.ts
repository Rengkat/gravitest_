import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAlert } from './entities/admin-alert.entity';
import { AdminAlertsService } from './admin-alerts.service';
import { AdminAlertsController } from './admin-alerts.controller';
import { PaginationModule } from 'src/common/pagination/pagination.module';

@Module({
  imports: [TypeOrmModule.forFeature([AdminAlert]), PaginationModule],
  controllers: [AdminAlertsController],
  providers: [AdminAlertsService],
  exports: [AdminAlertsService],
})
export class AdminAlertsModule {}
