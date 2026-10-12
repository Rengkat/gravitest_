import { describe, it, expect } from "vitest";
import type { UserBillingService } from "@/lib/api/admin-dashboard";
import { describeService } from "./adminUserBilling";

const svc = (o: Partial<UserBillingService>): UserBillingService => ({
  feature: "ai_tutor", label: "Sabi AI Tutor", allowed: true, reason: "tier", requiredTier: null, quota: null, freeUntil: null, ...o,
});
const NOW = new Date("2026-10-09T10:00:00Z");

describe("describeService", () => {
  it("free + plan-included read as good", () => {
    expect(describeService(svc({ reason: "free" }), NOW)).toEqual({ text: "Free for everyone", tone: "good" });
    expect(describeService(svc({ reason: "tier" }), NOW).tone).toBe("good");
  });
  it("shows the remaining free allowance", () => {
    const d = describeService(svc({ reason: "free_quota", quota: { limit: 5, used: 2, remaining: 3, period: "daily", resetsAt: "" } }), NOW);
    expect(d).toEqual({ text: "Free allowance: 3 of 5 left this day", tone: "limited" });
  });
  it("says which plan is needed", () => {
    expect(describeService(svc({ allowed: false, reason: "upgrade_required", requiredTier: "standard" }), NOW))
      .toEqual({ text: "Needs the Standard plan or higher", tone: "locked" });
  });
  it("used-up allowance, switched-off and promo", () => {
    expect(describeService(svc({ allowed: false, reason: "quota_exhausted" }), NOW).tone).toBe("locked");
    expect(describeService(svc({ allowed: false, reason: "disabled" }), NOW).tone).toBe("off");
    expect(describeService(svc({ reason: "promo", freeUntil: "2026-10-20T00:00:00Z" }), NOW).text).toMatch(/^Free promo until /);
  });
});
