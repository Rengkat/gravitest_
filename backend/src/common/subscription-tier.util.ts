import { SubscriptionTier } from 'src/common/enums/enums';

// Single source of truth for tier ordering. Previously copy-pasted into the
// library service; anything comparing tiers (feature gates, library access,
// admin rules) should go through these helpers so adding a tier is a
// one-line change.
export const TIER_RANK: Record<SubscriptionTier, number> = {
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.BASIC]: 1,
  [SubscriptionTier.STANDARD]: 2,
  [SubscriptionTier.PREMIUM]: 3,
  [SubscriptionTier.ENTERPRISE]: 4,
};

export function tierAtLeast(
  actual: SubscriptionTier,
  required: SubscriptionTier,
): boolean {
  return TIER_RANK[actual] >= TIER_RANK[required];
}
