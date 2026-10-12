import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminAlertsService } from './admin-alerts.service';
import { AdminAlertFiltersDto } from './dto/admin-alert-filters.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserId } from 'src/auth/decorators/current-user.decorator';
import { UserRole } from 'src/common/enums/enums';

// Admin-only operational alerts feed (fraud signals, signups, disputes,
// infra health) — distinct from /notifications, which is the student-facing
// inbox. See the comment on AdminAlertType in src/common/enums/enums.ts.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/alerts')
export class AdminAlertsController {
  constructor(private readonly adminAlertsService: AdminAlertsService) {}

  // GET /admin/alerts
  @Get()
  findAll(@Query() filters: AdminAlertFiltersDto) {
    return this.adminAlertsService.findAll(filters);
  }

  // GET /admin/alerts/stats
  @Get('stats')
  getStats() {
    return this.adminAlertsService.getStats();
  }

  // PATCH /admin/alerts/:id/read
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminAlertsService.markRead(id);
  }

  // PATCH /admin/alerts/mark-all-read
  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  markAllRead() {
    return this.adminAlertsService.markAllRead();
  }

  // PATCH /admin/alerts/:id/resolve
  @Patch(':id/resolve')
  @HttpCode(HttpStatus.OK)
  resolve(@Param('id', ParseUUIDPipe) id: string, @UserId() adminUserId: string) {
    return this.adminAlertsService.resolve(id, adminUserId);
  }

  // PATCH /admin/alerts/:id/archive
  @Patch(':id/archive')
  @HttpCode(HttpStatus.OK)
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminAlertsService.archive(id);
  }

  // DELETE /admin/alerts/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminAlertsService.delete(id);
  }
}
