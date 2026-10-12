import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min, ValidateIf } from 'class-validator';
import { FeatureAccessMode, QuotaPeriod, SubscriptionTier } from 'src/common/enums/enums';

export class UpdateFeatureRuleDto {
  @IsOptional()
  @IsEnum(FeatureAccessMode)
  mode?: FeatureAccessMode;

  /** Lowest tier with unlimited use. Required when mode = paid. */
  @IsOptional()
  @IsEnum(SubscriptionTier)
  minTier?: SubscriptionTier;

  /** Free uses per period for users below minTier. Send 0 or null to remove. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsInt()
  @Min(0)
  @Max(100000)
  freeQuota?: number | null;

  @IsOptional()
  @IsEnum(QuotaPeriod)
  quotaPeriod?: QuotaPeriod;

  /** Timed promo: open to everyone until this instant. Send null to end it now. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Transform(({ value }: { value: string | number | Date | null | undefined }) =>
    value ? new Date(value) : value,
  )
  @IsDate()
  freeUntil?: Date | null;
}
