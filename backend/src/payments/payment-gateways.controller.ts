import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/enums';
import { PaymentGatewaysService } from './payment-gateways.service';
import { UpdatePaymentGatewayDto } from './dto/update-gateway.dto';

@ApiTags('Payment gateways')
@Controller()
export class PaymentGatewaysController {
  constructor(private readonly gateways: PaymentGatewaysService) {}

  // Any signed-in user: which payment methods can I pick at checkout?
  @Get('billing/gateways')
  @ApiOperation({ summary: 'Payment gateways currently offered at checkout' })
  checkoutOptions() {
    return this.gateways.listCheckoutOptions();
  }

  @Get('admin/payment-gateways')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] All gateways with configured/enabled state' })
  adminList() {
    return this.gateways.listForAdmin();
  }

  @Patch('admin/payment-gateways/:code')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Enable/disable a gateway, set default, label or order' })
  update(@Param('code') code: string, @Body() dto: UpdatePaymentGatewayDto) {
    return this.gateways.update(code, dto);
  }
}
