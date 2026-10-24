import { apiClient } from "./client";
import type {
  BackendBillingInterval,
  BackendSubscriptionTier,
  PaymentGatewayCode,
  PaymentGatewayOption,
} from "./billing";
import type { FeatureKey } from "./entitlements";

// ── Plans ────────────────────────────────────────────────────────────────

export interface AdminPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  tier: BackendSubscriptionTier;
  interval: BackendBillingInterval | null;
  amountKobo: number;
  currency: string;
  features: string[];
  badge: string | null;
  sortOrder: number;
  isActive: boolean;
  isPublic: boolean;
  isSelfServe: boolean;
  promoAmountKobo: number | null;
  promoLabel: string | null;
  promoStartsAt: string | null;
  promoEndsAt: string | null;
  /** What customers pay right now (promo-aware). */
  effective: {
    amountKobo: number;
    listAmountKobo: number;
    isPromo: boolean;
    promoLabel: string | null;
    promoEndsAt: string | null;
    discountPercent: number;
  };
}

export interface CreatePlanInput {
  code: string;
  name: string;
  description?: string;
  tier: BackendSubscriptionTier;
  interval?: BackendBillingInterval;
  amountKobo: number;
  features?: string[];
  badge?: string;
  sortOrder?: number;
  isActive?: boolean;
  isPublic?: boolean;
  isSelfServe?: boolean;
}

/** `code`, `tier` and `interval` are immutable once a plan exists. */
export type UpdatePlanInput = Partial<Omit<CreatePlanInput, "code" | "tier" | "interval">>;

export interface SetPromoInput {
  promoAmountKobo: number;
  promoLabel?: string;
  /** ISO. Defaults to now. */
  promoStartsAt?: string;
  /** ISO. Required — a promo always ends. */
  promoEndsAt: string;
}

export async function adminListPlans(): Promise<AdminPlan[]> {
  return (await apiClient.get("/admin/plans")).data;
}
export async function adminCreatePlan(input: CreatePlanInput): Promise<AdminPlan> {
  return (await apiClient.post("/admin/plans", input)).data;
}
export async function adminUpdatePlan(id: string, input: UpdatePlanInput): Promise<AdminPlan> {
  return (await apiClient.patch(`/admin/plans/${id}`, input)).data;
}
export async function adminSetPlanPromo(id: string, input: SetPromoInput): Promise<AdminPlan> {
  return (await apiClient.post(`/admin/plans/${id}/promo`, input)).data;
}
export async function adminClearPlanPromo(id: string): Promise<AdminPlan> {
  return (await apiClient.delete(`/admin/plans/${id}/promo`)).data;
}
/** Retires the plan (soft delete). Existing subscribers are unaffected. */
export async function adminArchivePlan(id: string): Promise<AdminPlan> {
  return (await apiClient.delete(`/admin/plans/${id}`)).data;
}

// ── Payment gateways ─────────────────────────────────────────────────────

export interface AdminGateway extends PaymentGatewayOption {
  enabled: boolean;
  /** Are the server env credentials present? An unconfigured gateway can't be enabled. */
  configured: boolean;
  /** Names (never values) of the env variables still unset. Absent on older backends. */
  missingConfig?: string[];
  sortOrder: number;
  updatedAt: string;
}

export interface UpdateGatewayInput {
  enabled?: boolean;
  isDefault?: boolean;
  displayName?: string;
  sortOrder?: number;
}

export async function adminListGateways(): Promise<AdminGateway[]> {
  return (await apiClient.get("/admin/payment-gateways")).data;
}
export async function adminUpdateGateway(
  code: PaymentGatewayCode,
  input: UpdateGatewayInput,
): Promise<AdminGateway[]> {
  return (await apiClient.patch(`/admin/payment-gateways/${code}`, input)).data;
}

// ── Feature access rules ─────────────────────────────────────────────────

export type FeatureAccessMode = "free" | "paid" | "disabled";

export interface AdminFeatureRule {
  featureKey: FeatureKey;
  label: string;
  description: string;
  /** How the backend enforces it — show to admins so expectations match reality. */
  enforcement: string;
  supportedModes: FeatureAccessMode[];
  mode: FeatureAccessMode;
  minTier: BackendSubscriptionTier | null;
  freeQuota: number | null;
  quotaPeriod: "daily" | "monthly" | null;
  freeUntil: string | null;
  promoActive: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface UpdateFeatureRuleInput {
  mode?: FeatureAccessMode;
  minTier?: BackendSubscriptionTier;
  /** 0 or null removes the free allowance. */
  freeQuota?: number | null;
  quotaPeriod?: "daily" | "monthly";
  /** ISO time to open the feature to everyone until; null ends a promo now. */
  freeUntil?: string | null;
}

export async function adminListFeatureRules(): Promise<AdminFeatureRule[]> {
  return (await apiClient.get("/admin/feature-rules")).data;
}
export async function adminUpdateFeatureRule(
  key: FeatureKey,
  input: UpdateFeatureRuleInput,
): Promise<AdminFeatureRule> {
  return (await apiClient.patch(`/admin/feature-rules/${key}`, input)).data;
}
