"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { AccessDecision, FeatureKey } from "@/lib/api/entitlements";
import { useFeatureAccess } from "@/lib/hooks/useBilling";

interface UpgradePromptProps {
  decision: Pick<AccessDecision, "reason" | "requiredTier" | "quota">;
  upgradeHref?: string;
  featureLabel?: string;
}

const TIER_NAME: Record<string, string> = {
  basic: "Basic", standard: "Standard", premium: "Premium", enterprise: "Enterprise",
};

/** Why a feature is locked, in words a student understands, with the way forward. */
export function UpgradePrompt({ decision, upgradeHref = "/pricing", featureLabel = "This feature" }: UpgradePromptProps) {
  const { reason, requiredTier, quota } = decision;

  if (reason === "disabled") {
    return (
      <div role="status" className="rounded-2xl border border-cream-border bg-white p-5 text-sm text-green-900">
        {featureLabel} is temporarily unavailable. Please check back soon.
      </div>
    );
  }

  const plan = requiredTier ? (TIER_NAME[requiredTier] ?? requiredTier) : "a paid";
  const exhausted = reason === "quota_exhausted";
  const resets = quota ? new Date(quota.resetsAt).toLocaleString("en-NG", { weekday: "short", hour: "numeric", minute: "2-digit" }) : null;

  return (
    <div role="status" className="rounded-2xl border border-gold/40 bg-gold/10 p-5">
      <p className="font-semibold text-green-900">
        {exhausted ? `You've used your free ${featureLabel.toLowerCase()} for ${quota?.period === "monthly" ? "this month" : "today"}` : `${featureLabel} is on ${plan} plans`}
      </p>
      <p className="mt-1 text-sm text-green-800/80">
        {exhausted && resets ? `Your free allowance resets ${resets}. Or upgrade to keep going now.` : "Upgrade to unlock it."}
      </p>
      <Link
        href={upgradeHref}
        className="mt-3 inline-block rounded-full bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
      >
        See plans
      </Link>
    </div>
  );
}

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  /** Human name used in the prompt copy, e.g. "AI Tutor". */
  label?: string;
  upgradeHref?: string;
  /** Shown while entitlements load. Defaults to nothing. */
  loadingFallback?: ReactNode;
  /** Show "3 free uses left today" above the feature when on a free allowance. */
  showQuota?: boolean;
}

/**
 * Renders `children` only if the user may use `feature` right now; otherwise an
 * upgrade / quota / unavailable prompt. Purely a UX layer — the server
 * enforces every gate — so if entitlements can't be fetched it fails OPEN.
 */
export default function FeatureGate({
  feature, children, label, upgradeHref, loadingFallback = null, showQuota = true,
}: FeatureGateProps) {
  const { isLoading, decision, allowed } = useFeatureAccess(feature);

  if (isLoading) return <>{loadingFallback}</>;
  if (!allowed && decision) return <UpgradePrompt decision={decision} upgradeHref={upgradeHref} featureLabel={label} />;

  return (
    <>
      {showQuota && decision?.reason === "free_quota" && decision.quota && (
        <p className="mb-2 text-xs text-green-800/70" data-testid="quota-note">
          {decision.quota.remaining} free {decision.quota.remaining === 1 ? "use" : "uses"} left {decision.quota.period === "monthly" ? "this month" : "today"}
        </p>
      )}
      {decision?.reason === "promo" && decision.freeUntil && (
        <p className="mb-2 text-xs text-green-800/70" data-testid="promo-note">
          Free for everyone until {new Date(decision.freeUntil).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      )}
      {children}
    </>
  );
}
