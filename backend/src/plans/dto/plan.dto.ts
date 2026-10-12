import { PartialType, OmitType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BillingInterval, SubscriptionTier } from 'src/common/enums/enums';

// Money is integer kobo everywhere. Cap at ₦100m so a fat-fingered extra
// zero can't create an absurd plan.
const MAX_KOBO = 10_000_000_000;

export class CreatePlanDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'code must be a lowercase slug, e.g. "standard-monthly"',
  })
  @MaxLength(80)
  code!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(SubscriptionTier)
  tier!: SubscriptionTier;

  @IsOptional()
  @IsEnum(BillingInterval)
  interval?: BillingInterval;

  @IsInt()
  @Min(0)
  @Max(MAX_KOBO)
  amountKobo!: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(140, { each: true })
  features?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  badge?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isSelfServe?: boolean;
}

// `code` is immutable (subscriptions/analytics key off it); tier+interval are
// immutable too, because changing them under live subscribers would silently
// change what they're entitled to. Create a new plan instead.
export class UpdatePlanDto extends PartialType(
  OmitType(CreatePlanDto, ['code', 'tier', 'interval'] as const),
) {}

export class SetPlanPromoDto {
  /** Promo price in kobo. Must be < the list price and at least ₦100 (gateway minimum). */
  @IsInt()
  @Min(10000)
  @Max(MAX_KOBO)
  promoAmountKobo!: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  promoLabel?: string;

  @IsOptional()
  @Transform(({ value }: { value: string | number | Date | null | undefined }) =>
    value ? new Date(value) : undefined,
  )
  @IsDate()
  promoStartsAt?: Date;

  /** Required: an open-ended promo is a permanent price cut — change the list price instead. */
  @Transform(({ value }: { value: string | number | Date | null | undefined }) =>
    value ? new Date(value) : undefined,
  )
  @IsDate()
  promoEndsAt!: Date;
}
