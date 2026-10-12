import axios from "axios";
import { HttpError } from "@/lib/api/client";
import type { BackendSubscriptionTier } from "@/lib/api/billing";
import type { AccessDecision, FeatureKey, FeatureQuota } from "@/lib/api/entitlements";

export type AccessErrorCode = "UPGRADE_REQUIRED" | "QUOTA_EXHAUSTED" | "FEATURE_DISABLED";

export interface AccessError {
  code: AccessErrorCode;
  feature: FeatureKey;
  requiredTier: BackendSubscriptionTier | null;
  quota: FeatureQuota | null;
  /** Server-written, user-ready sentence. */
  message: string;
}

const CODES: readonly string[] = ["UPGRADE_REQUIRED", "QUOTA_EXHAUSTED", "FEATURE_DISABLED"];

/**
 * If `err` is the backend's "you can't use this feature" 403, return its
 * structured details so the UI can show the right prompt (upgrade / quota
 * used up / temporarily off). Returns null for every other error — including
 * plain 403s for unrelated permission problems — so callers can fall through
 * to normal error handling.
 */
export function parseAccessError(err: unknown): AccessError | null {
  let d: Record<string, unknown> | undefined;
  if (axios.isAxiosError(err) && err.response?.status === 403) {
    d = err.response.data as Record<string, unknown> | undefined;
  } else if (err instanceof HttpError && err.status === 403) {
    d = err.body as Record<string, unknown> | undefined; // fetch-based calls (e.g. the tutor stream)
  }
  if (!d || typeof d.code !== "string" || !CODES.includes(d.code)) return null;

  return {
    code: d.code as AccessErrorCode,
    feature: d.feature as FeatureKey,
    requiredTier: (d.requiredTier as BackendSubscriptionTier | null) ?? null,
    quota: (d.quota as FeatureQuota | null) ?? null,
    message: typeof d.message === "string" ? d.message : "This feature isn't available on your plan.",
  };
}

/**
 * Adapts a server "you can't use this" error to the shape <UpgradePrompt/>
 * takes, so every AI button shows the same, accurate message (needs a plan /
 * free allowance used up / temporarily off) instead of a generic failure.
 */
export function accessErrorDecision(e: AccessError): Pick<AccessDecision, "reason" | "requiredTier" | "quota"> {
  const reason =
    e.code === "FEATURE_DISABLED" ? "disabled" : e.code === "QUOTA_EXHAUSTED" ? "quota_exhausted" : "upgrade_required";
  return { reason, requiredTier: e.requiredTier, quota: e.quota };
}
