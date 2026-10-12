import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { UserId } from 'src/auth/decorators/current-user.decorator';
import { UserRole } from 'src/common/enums/enums';
import { EntitlementsService } from './entitlements.service';
import { UpdateFeatureRuleDto } from './dto/feature-rule.dto';

@ApiTags('Entitlements')
@Controller()
export class EntitlementsController {
  constructor(private readonly entitlements: EntitlementsService) {}

  @Get('entitlements/me')
  @ApiOperation({
    summary: 'What can I use right now? Per-feature allowed/locked state, free-quota remaining, and my effective plan.',
  })
  me(@UserId() userId: string) {
    return this.entitlements.evaluateAll(userId);
  }

  @Public()
  @Get('entitlements/catalog')
  @ApiOperation({
    summary:
      'Public: which features are free / paid (and from which plan) right now. Powers the pricing comparison table.',
  })
  catalog() {
    return this.entitlements.publicCatalog();
  }

  @Get('admin/feature-rules')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Every feature with its current free/paid rule' })
  list() {
    return this.entitlements.listForAdmin();
  }

  @Patch('admin/feature-rules/:key')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary:
      '[Admin] Make a feature free / paid (from a tier, with optional free daily/monthly quota and timed free window) / disabled',
  })
  update(
    @Param('key') key: string,
    @Body() dto: UpdateFeatureRuleDto,
    @UserId() adminId: string,
  ) {
    return this.entitlements.updateRule(key, dto, adminId);
  }
}
