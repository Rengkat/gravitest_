import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePaymentGatewayDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
