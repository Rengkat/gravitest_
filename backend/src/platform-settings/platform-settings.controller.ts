import { Body, Controller, Get, Header, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserId } from 'src/auth/decorators/current-user.decorator';
import { UserRole } from 'src/common/enums/enums';
import { PlatformSettingsService } from './platform-settings.service';
import { UpdatePlatformAppearanceDto } from './dto/update-platform-appearance.dto';

@ApiTags('Platform')
@Controller()
export class PlatformSettingsController {
  constructor(private readonly platformSettings: PlatformSettingsService) {}

  // GET /platform/appearance
  // Public on purpose: the login, register and marketing pages are recoloured
  // too, and they render before anyone has a token. Contains nothing secret —
  // just the brand colour.
  @Public()
  @Get('platform/appearance')
  @Header('Cache-Control', 'public, max-age=30')
  @ApiOperation({ summary: 'Platform-wide appearance (accent colour)' })
  @ApiResponse({ status: 200, description: '{ accentColor, updatedAt }' })
  getAppearance() {
    return this.platformSettings.getAppearance();
  }

  // PATCH /admin/platform/appearance
  @Patch('admin/platform/appearance')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Set the accent colour for every user' })
  @ApiResponse({ status: 200, description: 'Updated { accentColor, updatedAt }' })
  @ApiResponse({ status: 400, description: 'Not a 6-digit hex colour' })
  @ApiResponse({ status: 403, description: 'Requires ADMIN or SUPER_ADMIN' })
  updateAppearance(
    @Body() dto: UpdatePlatformAppearanceDto,
    @UserId() adminId: string,
  ) {
    return this.platformSettings.updateAppearance(dto, adminId ?? null);
  }
}
