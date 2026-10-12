import { apiClient } from "./client";
import type { BackendSubscriptionTier } from "./billing";

/** Every gate-able feature. Mirrors the backend FeatureKey enum. */
export type FeatureKey =
  | "cbt_practice"
  | "cbt_mock"
  | "ai_tutor"
  | "ai_explain"
  | "ai_explain_more"
  | "ai_essay_scoring"
  | "ai_essay_elaborate"
  | "library_premium";

export type AccessReason =
  | "free" // free for everyone
  | "promo" // paid feature inside its timed free window
  | "tier" // your plan includes it
  | "free_quota" // free taste on a lower plan
  | "upgrade_required"
  | "quota_exhausted"
  | "disabled";

export interface FeatureQuota {
  limit: number;
  used: number;
  remaining: number;
  period: "daily" | "monthly";
  /** ISO time the allowance resets (Lagos midnight). */
  resetsAt: string;
}

export interface AccessDecision {
  feature: FeatureKey;
  allowed: boolean;
  reason: AccessReason;
  /** Lowest plan that unlocks it, when a plan would help. */
  requiredTier: BackendSubscriptionTier | null;
  quota: FeatureQuota | null;
  /** If a timed free window is open, when it closes (ISO). */
  freeUntil: string | null;
}

export interface MyEntitlements {
  /** The plan the user is EFFECTIVELY on right now (expiry/grace applied). */
  tier: BackendSubscriptionTier;
  features: AccessDecision[];
}

export async function getMyEntitlements(): Promise<MyEntitlements> {
  const { data } = await apiClient.get("/entitlements/me");
  return data;
}

/**
 * One feature's current free/paid rule, as shown to the PUBLIC (no login).
 * Powers the pricing comparison table so it always matches what the admin set.
 */
export interface PublicFeatureRule {
  featureKey: FeatureKey;
  label: string;
  description: string;
  mode: "free" | "paid" | "disabled";
  /** Lowest plan that includes it without limits (mode = paid). */
  minTier: BackendSubscriptionTier | null;
  /** Free uses per period for plans below minTier. */
  freeQuota: number | null;
  quotaPeriod: "daily" | "monthly" | null;
  /** ISO time a timed "free for everyone" promo ends; null when none is running. */
  freeUntil: string | null;
}

export async function getFeatureCatalog(): Promise<PublicFeatureRule[]> {
  const { data } = await apiClient.get("/entitlements/catalog");
  return data;
}
