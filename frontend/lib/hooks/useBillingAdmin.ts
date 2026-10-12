"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { extractErrorMessage } from "@/lib/api/client";
import {
  adminArchivePlan, adminClearPlanPromo, adminCreatePlan, adminListFeatureRules, adminListGateways,
  adminListPlans, adminSetPlanPromo, adminUpdateFeatureRule, adminUpdateGateway, adminUpdatePlan,
  type CreatePlanInput, type SetPromoInput, type UpdateFeatureRuleInput, type UpdateGatewayInput, type UpdatePlanInput,
} from "@/lib/api/billing-admin";
import type { FeatureKey } from "@/lib/api/entitlements";
import type { PaymentGatewayCode } from "@/lib/api/billing";
import { billingKeys } from "./useBilling";

const adminKeys = {
  plans: ["admin", "billing", "plans"] as const,
  gateways: ["admin", "billing", "gateways"] as const,
  rules: ["admin", "billing", "feature-rules"] as const,
};

export const useAdminPlans = () => useQuery({ queryKey: adminKeys.plans, queryFn: adminListPlans });
export const useAdminGateways = () => useQuery({ queryKey: adminKeys.gateways, queryFn: adminListGateways });
export const useAdminFeatureRules = () => useQuery({ queryKey: adminKeys.rules, queryFn: adminListFeatureRules });

/** Every admin write: toast the outcome (server messages are admin-readable) and refresh what depends on it. */
function useAdminMutation<TVars, TResult>(
  fn: (v: TVars) => Promise<TResult>,
  opts: { success: string; invalidate: readonly (readonly unknown[])[] },
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      toast.success(opts.success);
      await Promise.all(opts.invalidate.map((queryKey) => qc.invalidateQueries({ queryKey })));
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

// Editing plans changes what the PUBLIC pricing page shows; editing gateways changes checkout;
// editing rules changes every user's entitlements — so each refreshes the customer-facing cache too.
export const useCreatePlan = () =>
  useAdminMutation((v: CreatePlanInput) => adminCreatePlan(v), { success: "Plan created", invalidate: [adminKeys.plans, billingKeys.plans] });
export const useUpdatePlan = () =>
  useAdminMutation((v: { id: string; input: UpdatePlanInput }) => adminUpdatePlan(v.id, v.input), { success: "Plan updated", invalidate: [adminKeys.plans, billingKeys.plans] });
export const useSetPlanPromo = () =>
  useAdminMutation((v: { id: string; input: SetPromoInput }) => adminSetPlanPromo(v.id, v.input), { success: "Promo scheduled", invalidate: [adminKeys.plans, billingKeys.plans] });
export const useClearPlanPromo = () =>
  useAdminMutation((id: string) => adminClearPlanPromo(id), { success: "Promo ended", invalidate: [adminKeys.plans, billingKeys.plans] });
export const useArchivePlan = () =>
  useAdminMutation((id: string) => adminArchivePlan(id), { success: "Plan retired", invalidate: [adminKeys.plans, billingKeys.plans] });
export const useUpdateGateway = () =>
  useAdminMutation((v: { code: PaymentGatewayCode; input: UpdateGatewayInput }) => adminUpdateGateway(v.code, v.input), { success: "Payment method updated", invalidate: [adminKeys.gateways, billingKeys.gateways] });
export const useUpdateFeatureRule = () =>
  useAdminMutation((v: { key: FeatureKey; input: UpdateFeatureRuleInput }) => adminUpdateFeatureRule(v.key, v.input), { success: "Access rule saved", invalidate: [adminKeys.rules, billingKeys.entitlements] });
