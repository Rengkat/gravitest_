import { IsUUID } from 'class-validator';

export class ChargeAuthorizationDto {
  @IsUUID()
  paymentMethodId!: string;
}
