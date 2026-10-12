import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/enums';
import { UserBillingService } from './user-billing.service';

@ApiTags('User billing (Admin)')
@UseGuards(JwtAuthGuard)
@Controller('admin/user-billing')
export class UserBillingController {
  constructor(private readonly service: UserBillingService) {}

  @Get(':userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary:
      "One student's plan, plan history, access per service, items bought one by one, and recent payments.",
  })
  overview(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.service.getOverview(userId);
  }
}
