import type { UserBillingService } from "@/lib/api/admin-dashboard";

export type ServiceTone = "good" | "limited" | "locked" | "off";

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

/** Plain-English "what does this student get from this service, and why". */
export function describeService(s: UserBillingService, now: Date = new Date()): { text: string; tone: ServiceTone } {
  switch (s.reason) {
    case "free":
      return { text: "Free for everyone", tone: "good" };
    case "tier":
      return { text: "Included in their plan", tone: "good" };
    case "promo": {
      const until = s.freeUntil && new Date(s.freeUntil) > now
        ? ` until ${new Date(s.freeUntil).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`
        : "";
      return { text: `Free promo${until}`, tone: "good" };
    }
    case "free_quota":
      return {
        text: s.quota
          ? `Free allowance: ${s.quota.remaining} of ${s.quota.limit} left this ${s.quota.period === "monthly" ? "month" : "day"}`
          : "Free allowance",
        tone: "limited",
      };
    case "quota_exhausted":
      return { text: "Free allowance used up", tone: "locked" };
    case "upgrade_required":
      return { text: s.requiredTier ? `Needs the ${cap(s.requiredTier)} plan or higher` : "Needs a paid plan", tone: "locked" };
    case "disabled":
      return { text: "Switched off by admin", tone: "off" };
    default:
      return { text: s.allowed ? "Allowed" : "Not available", tone: s.allowed ? "good" : "locked" };
  }
}
