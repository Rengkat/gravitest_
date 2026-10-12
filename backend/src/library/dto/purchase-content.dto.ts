import { IsEnum, IsOptional } from 'class-validator';
import { PaymentGatewayCode } from 'src/common/enums/enums';

export class PurchaseContentDto {
  // Which enabled gateway to check out with (GET /billing/gateways).
  // Omit → the admin-configured default.
  @IsOptional()
  @IsEnum(PaymentGatewayCode)
  gateway?: PaymentGatewayCode;
}
