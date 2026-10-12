import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import {
  BillingInterval,
  PaymentGatewayCode,
  SubscriptionTier,
} from 'src/common/enums/enums';

export class SubscribeDto {
  // Preferred: the id of a plan from GET /subscriptions/plans. Lets admins run
  // several plans per tier (promos, seasonal offers) and makes the price the
  // user saw unambiguous.
  @IsOptional()
  @IsUUID()
  planId?: string;

  // Legacy selector, still accepted for older clients: resolved to the first
  // active plan matching tier + interval. Ignored when planId is present.
  @IsOptional()
  @IsEnum(SubscriptionTier)
  tier?: SubscriptionTier;

  @IsOptional()
  @IsEnum(BillingInterval)
  interval?: BillingInterval;

  // If provided, charges this saved card directly (no redirect). Cards are
  // Paystack-only, so this implies gateway = paystack.
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  // Which enabled gateway to check out with (GET /billing/gateways).
  // Omit → the admin-configured default.
  @IsOptional()
  @IsEnum(PaymentGatewayCode)
  gateway?: PaymentGatewayCode;
}
