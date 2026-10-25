import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { BackendPlan, BackendSubscription, BackendTransaction, PaymentGatewayOption } from "@/lib/api/billing";
import { HttpError } from "@/lib/api/client";
import {
  describeTransaction, isCurrentPlan, mapPlan, mapSubscriptionHistory, mapTransaction, prettifyPlanCode,
} from "../useBilling";
import PlanComparison, { paymentCopy } from "../components/PlanComparison";
import CurrentPlanCard, { renewalMode } from "../components/CurrentPlanCard";
import { nextStepAfterPayment } from "../result/ResultClient";

const DAY = 86_400_000;
const inDays = (d: number) => new Date(Date.now() + d * DAY).toISOString();

const plan = (o: Partial<BackendPlan> = {}): BackendPlan => ({
  id: "plan-std-m", code: "standard-monthly", name: "Standard Monthly", description: null, tier: "standard", interval: "monthly",
  currency: "NGN", amountKobo: 500000, listAmountKobo: 500000, isPromo: false, promoLabel: null, promoEndsAt: null,
  discountPercent: 0, features: ["Everything in Basic"], badge: null, isSelfServe: true, ...o,
});

const sub = (o: Partial<BackendSubscription> = {}): BackendSubscription => ({
  id: "s1", tier: "standard", status: "active", billingInterval: "monthly", amountKobo: 500000, startedAt: inDays(-10),
  expiresAt: inDays(20), cancelledAt: null, autoRenew: true, createdAt: inDays(-10),
  planId: "plan-std-m", planCode: "standard-monthly", gateway: "paystack", renewalAmountKobo: 500000, ...o,
});

const tx = (o: Partial<BackendTransaction> = {}): BackendTransaction => ({
  id: "t1", userId: "u", type: "subscription", status: "success", amountKobo: 500000, reference: "ref1", gateway: "opay",
  gatewayReference: "ORD1", paystackReference: "ORD1", channel: "card", cardLast4: null, cardType: null, bank: null,
  gatewayMessage: null, purpose: "standard-monthly", metadata: { planCode: "standard-monthly" }, relatedEntityType: "subscription",
  relatedEntityId: "s1", paidAt: "2026-10-01T10:00:00Z", createdAt: "2026-10-01T10:00:00Z", ...o,
});

// ─────────────────────────────────────────────────────────────────────────
describe("transaction descriptions", () => {
  it("names the plan for a new subscription payment", () => {
    expect(describeTransaction(tx())).toBe("Standard Monthly — Subscription");
  });
  it("calls an automatic renewal a Renewal", () => {
    expect(describeTransaction(tx({ purpose: "standard-monthly_renewal", metadata: { renewal: true, planCode: "standard-monthly" } }))).toBe("Standard Monthly — Renewal");
    expect(describeTransaction(tx({ purpose: "standard-monthly_renewal", metadata: null }))).toBe("Standard Monthly — Renewal");
  });
  it("still understands payments from before plans were editable (tier in metadata)", () => {
    expect(describeTransaction(tx({ purpose: null, metadata: { tier: "premium" } }))).toBe("Premium Plan — Subscription");
  });
  it("falls back gracefully with no information", () => {
    expect(describeTransaction(tx({ purpose: null, metadata: null }))).toBe("Subscription payment");
  });
  it("other transaction kinds keep their labels", () => {
    expect(describeTransaction(tx({ type: "content_purchase" }))).toBe("Content purchase");
  });
  it("prettifyPlanCode", () => {
    expect(prettifyPlanCode("standard-annual")).toBe("Standard Annual");
    expect(prettifyPlanCode("back_to_school-promo")).toBe("Back To School Promo");
  });
});

describe("mapTransaction", () => {
  it("carries the gateway and prefers the gateway reference", () => {
    const m = mapTransaction(tx({ gateway: "opay", gatewayReference: "ORD9", paystackReference: "stale" }));
    expect(m).toMatchObject({ gateway: "opay", paystackReference: "ORD9", amount: 5000, status: "paid" });
  });
  it("falls back to our own reference when the provider has none yet", () => {
    expect(mapTransaction(tx({ gatewayReference: null, paystackReference: null, reference: "ours" })).paystackReference).toBe("ours");
  });
});

describe("mapSubscriptionHistory", () => {
  it("labels quarterly plans correctly (they used to read 'Annual')", () => {
    expect(mapSubscriptionHistory(sub({ billingInterval: "quarterly" }))).toMatchObject({ plan: "Standard Quarterly", period: "Quarterly" });
    expect(mapSubscriptionHistory(sub({ billingInterval: "annually" }))).toMatchObject({ plan: "Standard Annual", period: "Annually" });
  });
  it("keeps kobo-level amounts instead of rounding them away", () => {
    expect(mapSubscriptionHistory(sub({ amountKobo: 249950 })).amount).toBe(2499.5);
  });
});

describe("plan mapping", () => {
  it("is current by plan id when the subscription has one — even if another plan shares its tier and interval", () => {
    const promo = plan({ id: "plan-promo", code: "standard-promo" });
    expect(isCurrentPlan(plan(), sub())).toBe(true);
    expect(isCurrentPlan(promo, sub())).toBe(false);
  });
  it("falls back to tier + interval for subscriptions from before plan ids existed", () => {
    const legacy = sub({ planId: null, planCode: null });
    expect(isCurrentPlan(plan(), legacy)).toBe(true);
    expect(isCurrentPlan(plan({ interval: "annually" }), legacy)).toBe(false);
    expect(isCurrentPlan(plan(), null)).toBe(false);
  });
  it("maps price/promo fields exactly and names the period", () => {
    const m = mapPlan(plan({ amountKobo: 249950, listAmountKobo: 500000, isPromo: true, promoLabel: "Sale", discountPercent: 50, promoEndsAt: inDays(2) }), null);
    expect(m).toMatchObject({ planId: "plan-std-m", price: 2499.5, listPrice: 5000, period: "month", isPromo: true, promoLabel: "Sale", discountPercent: 50 });
    expect(mapPlan(plan({ interval: "quarterly" }), null).period).toBe("quarter");
    expect(mapPlan(plan({ interval: null, tier: "free" }), null).period).toBe("forever");
  });
  it("flags the current plan with a badge", () => {
    expect(mapPlan(plan(), sub()).badge).toBe("Current Plan");
  });
});

// ─────────────────────────────────────────────────────────────────────────
const PAYSTACK: PaymentGatewayOption = { code: "paystack", displayName: "Card, Bank Transfer & USSD (Paystack)", isDefault: true, capabilities: { recurringCharge: true, savedCards: true, methods: ["Card"] } };
const OPAY: PaymentGatewayOption = { code: "opay", displayName: "OPay", isDefault: false, capabilities: { recurringCharge: false, savedCards: false, methods: ["OPay wallet"] } };

const options = (...ps: BackendPlan[]) => ps.map((p) => mapPlan(p, null));

describe("PlanComparison (checkout)", () => {
  const open = (plans: ReturnType<typeof options>, gateways = [PAYSTACK], onSubscribe = vi.fn().mockResolvedValue(undefined)) => {
    render(<PlanComparison isOpen onClose={vi.fn()} plans={plans} gateways={gateways} onSubscribe={onSubscribe} />);
    return onSubscribe;
  };

  it("checks out by PLAN ID (the plan the customer was shown), not tier + interval", async () => {
    const onSubscribe = open(options(plan({ id: "promo-id", code: "std-promo" }), plan()));
    await userEvent.click(screen.getAllByRole("button", { name: /Upgrade Now/ })[0]);
    expect(onSubscribe).toHaveBeenCalledWith({ planId: "promo-id", gateway: "paystack" });
    const payload = onSubscribe.mock.calls[0][0];
    expect("tier" in payload || "interval" in payload).toBe(false);
  });

  it("shows a live promo with the regular price struck through and the first-payment-only disclosure", () => {
    open(options(plan({ isPromo: true, amountKobo: 400000, discountPercent: 20, promoLabel: "Back to school", promoEndsAt: inDays(3) })));
    expect(screen.getByText("₦4,000")).toBeInTheDocument();
    expect(screen.getByLabelText("Regular price ₦5,000")).toBeInTheDocument();
    expect(screen.getByText(/Back to school · 20% off/)).toBeInTheDocument();
    expect(screen.getByText(/first payment\. Renews at ₦5,000\/month/)).toBeInTheDocument();
  });

  it("does not show a promo that has already ended on this device's clock", () => {
    open(options(plan({ isPromo: true, amountKobo: 400000, discountPercent: 20, promoEndsAt: inDays(-1) })));
    expect(screen.getByText("₦5,000")).toBeInTheDocument();
    expect(screen.queryByText(/% off/)).toBeNull();
  });

  it("offers a payment choice when more than one gateway is enabled, and sends the chosen one", async () => {
    const onSubscribe = open(options(plan()), [PAYSTACK, OPAY]);
    expect(screen.getByText("Pay securely with Paystack or OPay")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/OPay/));
    await userEvent.click(screen.getByRole("button", { name: /Upgrade Now/ }));
    expect(onSubscribe).toHaveBeenCalledWith({ planId: "plan-std-m", gateway: "opay" });
  });

  it("a failed payment-method lookup is SAID, not silently shown as 'only Paystack'", () => {
    render(<PlanComparison isOpen onClose={vi.fn()} plans={options(plan())} gateways={[]} gatewaysError onSubscribe={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent(/couldn't load all payment options/);
    expect(screen.queryByLabelText(/OPay/)).toBeNull();
  });

  it("no failure notice when the lookup worked, or when a choice is being shown", () => {
    const { unmount } = render(<PlanComparison isOpen onClose={vi.fn()} plans={options(plan())} gateways={[PAYSTACK]} onSubscribe={vi.fn()} />);
    expect(screen.queryByRole("status")).toBeNull();
    unmount();
    render(<PlanComparison isOpen onClose={vi.fn()} plans={options(plan())} gateways={[PAYSTACK, OPAY]} gatewaysError onSubscribe={vi.fn()} />);
    expect(screen.queryByRole("status")).toBeNull(); // list is usable; no need to alarm
    expect(screen.getByLabelText(/OPay/)).toBeInTheDocument();
  });

  it("pre-selects the admin's default gateway", async () => {
    const onSubscribe = open(options(plan()), [OPAY, { ...PAYSTACK, isDefault: true }]);
    await userEvent.click(screen.getByRole("button", { name: /Upgrade Now/ }));
    expect(onSubscribe).toHaveBeenCalledWith({ planId: "plan-std-m", gateway: "paystack" });
  });

  it("no picker with a single gateway, and the header names it truthfully", () => {
    open(options(plan()), [PAYSTACK]);
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByText("All plans are billed securely through Paystack")).toBeInTheDocument();
  });

  it("a free plan sends no gateway (there is nothing to pay)", async () => {
    const onSubscribe = open(options(plan({ id: "free-id", code: "free", tier: "free", interval: null, amountKobo: 0, listAmountKobo: 0 })), [PAYSTACK, OPAY]);
    await userEvent.click(screen.getByRole("button", { name: /Switch to Free/ }));
    expect(onSubscribe).toHaveBeenCalledWith({ planId: "free-id" });
  });

  it("a contact-sales plan has no checkout: a mailto link, never 'Upgrade' or 'Free'", () => {
    open(options(plan({ id: "ent", code: "enterprise", name: "Enterprise", tier: "enterprise", amountKobo: 0, listAmountKobo: 0, isSelfServe: false })));
    const link = screen.getByRole("link", { name: /Contact sales/ });
    expect(link.getAttribute("href")).toMatch(/^mailto:support@gravitest\.ng\?subject=Enterprise%20plan%20enquiry/);
    expect(screen.queryByRole("button", { name: /Upgrade Now|Switch to Free/ })).toBeNull();
    expect(screen.getByText("Contact us")).toBeInTheDocument();
    expect(screen.queryByText("Free")).toBeNull();
  });

  it("the current plan cannot be re-bought from here", () => {
    open([mapPlan(plan(), sub())]);
    expect(screen.getByRole("button", { name: /Current Plan/ })).toBeDisabled();
  });

  it("shows the SERVER's reason when checkout fails (not axios's generic text)", async () => {
    const onSubscribe = vi.fn().mockRejectedValue(new HttpError("You're already on Standard Monthly (25 days left).", 400));
    open(options(plan()), [PAYSTACK], onSubscribe);
    await userEvent.click(screen.getByRole("button", { name: /Upgrade Now/ }));
    expect(await screen.findByText(/already on Standard Monthly/)).toBeInTheDocument();
  });

  it("closes only after an instant activation, not when it redirects away", async () => {
    const onClose = vi.fn();
    const onSubscribe = vi.fn().mockResolvedValue({ subscription: {} });
    render(<PlanComparison isOpen onClose={onClose} plans={options(plan())} gateways={[PAYSTACK]} onSubscribe={onSubscribe} />);
    await userEvent.click(screen.getByRole("button", { name: /Upgrade Now/ }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("paymentCopy wording", () => {
    expect(paymentCopy([])).toBe("Pay securely online");
    expect(paymentCopy([OPAY])).toBe("All plans are billed securely through OPay");
    expect(paymentCopy([PAYSTACK, OPAY])).toBe("Pay securely with Paystack or OPay");
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("renewalMode", () => {
  it.each([
    [{ autoRenew: true, cancelledAt: null }, "renewing"],
    [{ autoRenew: false, cancelledAt: null }, "prepaid"],
    [{ autoRenew: false, cancelledAt: "2026-10-01T00:00:00Z" }, "ending"],
  ])("%j -> %s", (s, mode) => expect(renewalMode(s)).toBe(mode));
});

describe("CurrentPlanCard — says only what is true about this subscription", () => {
  const show = (s: BackendSubscription | null, onCancel = vi.fn().mockResolvedValue(undefined)) => {
    render(<CurrentPlanCard subscription={s} onUpgrade={vi.fn()} onCancel={onCancel} />);
    return onCancel;
  };

  it("auto-renewing card plan: says it renews, names the gateway, offers Cancel", () => {
    show(sub());
    expect(screen.getByText("Monthly · Renews automatically via Paystack")).toBeInTheDocument();
    expect(screen.getByText("Next Renewal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel Subscription" })).toBeInTheDocument();
    expect(screen.getByText("Standard Monthly")).toBeInTheDocument();
  });

  it("prepaid OPay plan: does NOT claim automatic billing, says it expires, has nothing to cancel", () => {
    show(sub({ autoRenew: false, gateway: "opay" }));
    expect(screen.getByText("Monthly · Prepaid via OPay — renew to keep access")).toBeInTheDocument();
    expect(screen.queryByText(/Billed automatically|Renews automatically/)).toBeNull();
    expect(screen.getByText("Expires")).toBeInTheDocument();
    expect(screen.getByText(/days of access left/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Subscription" })).toBeNull();
    expect(screen.getByRole("button", { name: /Renew \/ Change Plan/ })).toBeInTheDocument();
  });

  it("cancelled-at-period-end: says access ends and no more charges, and can't be cancelled twice", () => {
    show(sub({ autoRenew: false, cancelledAt: inDays(-1) }));
    expect(screen.getByText("Monthly · Cancelled — no further charges")).toBeInTheDocument();
    expect(screen.getByText("Access Ends")).toBeInTheDocument();
    expect(screen.getByText(/^Ends /)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Subscription" })).toBeNull();
  });

  it("shows the RENEWAL price per period, and tells a promo customer what their first period cost", () => {
    show(sub({ amountKobo: 300000, renewalAmountKobo: 500000 }));
    expect(screen.getByText("₦5,000")).toBeInTheDocument(); // not the ₦3,000 promo, forever
    expect(screen.getByText("Your first month was ₦3,000")).toBeInTheDocument();
  });

  it("no promo note when the first payment was the regular price", () => {
    show(sub());
    expect(screen.queryByText(/Your first/)).toBeNull();
  });

  it("a failed renewal shows what's happening and what to do", () => {
    show(sub({ status: "past_due" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t renew/);
    expect(screen.getByText("Payment overdue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Renew \/ Change Plan/ })).toBeInTheDocument();
  });

  it("legacy subscriptions (no gateway recorded, no plan code) still render sensibly as Paystack", () => {
    show(sub({ gateway: null, planCode: null, planId: null, renewalAmountKobo: null }));
    expect(screen.getByText("Monthly · Renews automatically via Paystack")).toBeInTheDocument();
    expect(screen.getByText("Standard Plan")).toBeInTheDocument();
    expect(screen.getByText("₦5,000")).toBeInTheDocument();
  });

  it("quarterly plans say quarter, not month", () => {
    show(sub({ billingInterval: "quarterly" }));
    expect(screen.getByText("per quarter")).toBeInTheDocument();
    expect(screen.getByText("Quarterly", { selector: "p" })).toBeInTheDocument();
  });

  it("free / no subscription", () => {
    show(null);
    expect(screen.getByText("Free Plan")).toBeInTheDocument();
    expect(screen.getByText("No active subscription")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Upgrade Plan/ })).toBeInTheDocument();
  });

  it("cancelling shows the server's message if it fails", async () => {
    show(sub(), vi.fn().mockRejectedValue(new HttpError("Subscription is already cancelled.", 400)));
    await userEvent.click(screen.getByRole("button", { name: "Cancel Subscription" }));
    const modal = screen.getByText("Cancel Anyway").closest("div")!.parentElement!;
    await userEvent.click(within(modal).getByRole("button", { name: "Cancel Anyway" }));
    expect(await screen.findByText("Subscription is already cancelled.")).toBeInTheDocument();
  });
});

describe("nextStepAfterPayment (one return URL, many kinds of payment)", () => {
  it("sends a book buyer back to the book", () => {
    expect(nextStepAfterPayment(tx({ type: "content_purchase", relatedEntityId: "book-1" }))).toEqual({ href: "/dashboard/library/book-1", label: "Open your purchase" });
  });
  it("sends a plan buyer to their billing page", () => {
    expect(nextStepAfterPayment(tx())).toEqual({ href: "/dashboard/billing", label: "View my plan" });
  });
  it("a content purchase with no id falls back to billing instead of a broken link", () => {
    expect(nextStepAfterPayment(tx({ type: "content_purchase", relatedEntityId: null })).href).toBe("/dashboard/billing");
  });
});
