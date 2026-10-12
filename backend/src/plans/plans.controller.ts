import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserId } from 'src/auth/decorators/current-user.decorator';
import { UserRole } from 'src/common/enums/enums';
import { PlansService } from './plans.service';
import { CreatePlanDto, SetPlanPromoDto, UpdatePlanDto } from './dto/plan.dto';

// Public pricing is served by GET /subscriptions/plans (unchanged URL, so
// existing clients keep working) — this controller is the admin surface.
@ApiTags('Plans (Admin)')
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin/plans')
export class PlansAdminController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'List all plans, including retired/unlisted, with live effective price' })
  list() {
    return this.plans.listAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a plan' })
  create(@Body() dto: CreatePlanDto, @UserId() adminId: string) {
    return this.plans.create(dto, adminId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a plan (price, copy, visibility). Tier/interval are immutable.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
    @UserId() adminId: string,
  ) {
    return this.plans.update(id, dto, adminId);
  }

  @Post(':id/promo')
  @ApiOperation({ summary: 'Schedule a promotional price (auto-expires at promoEndsAt)' })
  setPromo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPlanPromoDto,
    @UserId() adminId: string,
  ) {
    return this.plans.setPromo(id, dto, adminId);
  }

  @Delete(':id/promo')
  @ApiOperation({ summary: 'End a promo immediately' })
  clearPromo(@Param('id', ParseUUIDPipe) id: string, @UserId() adminId: string) {
    return this.plans.clearPromo(id, adminId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Retire a plan (soft delete — existing subscribers are unaffected)' })
  archive(@Param('id', ParseUUIDPipe) id: string, @UserId() adminId: string) {
    return this.plans.archive(id, adminId);
  }
}
