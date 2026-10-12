import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAlertsModule } from 'src/admin-alerts/admin-alerts.module';
import { Plan } from './entities/plan.entity';
import { PlansService } from './plans.service';
import { PlansAdminController } from './plans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Plan]), AdminAlertsModule],
  controllers: [PlansAdminController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
