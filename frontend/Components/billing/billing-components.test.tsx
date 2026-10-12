import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import type { BackendPlan, BackendTransaction, PaymentGatewayOption } from "@/lib/api/billing";
import type { AccessDecision } from "@/lib/api/entitlements";
import PlanPrice from "./PlanPrice";
import GatewayPicker, { defaultGateway } from "./GatewayPicker";
import FeatureGate from "./FeatureGate";
import CheckoutResult from "./CheckoutResult";

vi.mock("@/lib/api/billing", async (orig) => ({ ...(await orig<typeof import("@/lib/api/billing")>()), verifyCheckout: vi.fn() }));
vi.mock("@/lib/api/entitlements", () => ({ getMyEntitlements: vi.fn() }));
import { verifyCheckout } from "@/lib/api/billing";
import { getMyEntitlements } from "@/lib/api/entitlements";

const wrap = (ui: ReactNode, qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })) =>
  render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);

const plan = (o: Partial<BackendPlan> = {}): BackendPlan => ({
  id: "p1", code: "standard-monthly", name: "Standard", description: null, tier: "standard", interval: "monthly",
  currency: "NGN", amountKobo: 500000, listAmountKobo: 500000, isPromo: false, promoLabel: null, promoEndsAt: null,
  discountPercent: 0, features: [], badge: null, isSelfServe: true, ...o,
});

describe("PlanPrice", () => {
  it("shows a normal price with its cadence and no promo furniture", () => {
    render(<PlanPrice plan={plan()} />);
    expect(screen.getByText("₦5,000")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
    expect(screen.queryByText(/% off/)).toBeNull();
  });

  it("shows the promo price, label, discount, struck list price and the first-payment-only disclosure", () => {
    const now = new Date("2026-10-01T12:00:00Z");
    render(<PlanPrice now={now} plan={plan({ isPromo: true, amountKobo: 400000, discountPercent: 20, promoLabel: "Back to school", promoEndsAt: "2026-10-04T12:00:00Z" })} />);
    expect(screen.getByText("₦4,000")).toBeInTheDocument();
    expect(screen.getByLabelText("Regular price ₦5,000")).toBeInTheDocument();
    expect(screen.getByText(/Back to school · 20% off/)).toBeInTheDocument();
    expect(screen.getByText("Ends in 3 days")).toBeInTheDocument();
    // honesty: the customer is told renewals cost the list price
    expect(screen.getByText(/first payment\. Renewals are at ₦5,000/)).toBeInTheDocument();
  });

  it("does not sell a checkout price for a contact-sales plan", () => {
    render(<PlanPrice plan={plan({ isSelfServe: false, amountKobo: 0, listAmountKobo: 0 })} />);
    expect(screen.getByText("Contact us")).toBeInTheDocument();
  });
});

const PAYSTACK: PaymentGatewayOption = { code: "paystack", displayName: "Card, Bank Transfer & USSD (Paystack)", isDefault: true, capabilities: { recurringCharge: true, savedCards: true, methods: ["Card", "USSD"] } };
const OPAY: PaymentGatewayOption = { code: "opay", displayName: "OPay", isDefault: false, capabilities: { recurringCharge: false, savedCards: false, methods: ["OPay wallet", "Card"] } };

describe("GatewayPicker", () => {
  it("renders nothing when there is only one gateway (no choice to make)", () => {
    const { container } = render(<GatewayPicker gateways={[PAYSTACK]} value="paystack" onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists every offered gateway, marks the selection, and reports changes", () => {
    const onChange = vi.fn();
    render(<GatewayPicker gateways={[PAYSTACK, OPAY]} value="paystack" onChange={onChange} />);
    expect(screen.getByLabelText(/Paystack/)).toBeChecked();
    expect(screen.getByLabelText(/OPay/)).not.toBeChecked();
    fireEvent.click(screen.getByLabelText(/OPay/));
    expect(onChange).toHaveBeenCalledWith("opay");
  });

  it("tells OPay customers it's a one-time payment (no auto-renew), but not Paystack customers", () => {
    render(<GatewayPicker gateways={[PAYSTACK, OPAY]} value="opay" onChange={() => {}} />);
    expect(screen.getAllByText(/remind you before it ends/)).toHaveLength(1);
  });

  it("defaultGateway prefers the admin's default, else the first, else null", () => {
    expect(defaultGateway([OPAY, PAYSTACK])).toBe("paystack");
    expect(defaultGateway([{ ...OPAY }, { ...PAYSTACK, isDefault: false }])).toBe("opay");
    expect(defaultGateway([])).toBeNull();
  });
});

const decision = (o: Partial<AccessDecision>): AccessDecision => ({
  feature: "ai_tutor", allowed: true, reason: "tier", requiredTier: "basic", quota: null, freeUntil: null, ...o,
});
const entitlements = (d: AccessDecision) => vi.mocked(getMyEntitlements).mockResolvedValue({ tier: "free", features: [d] });

describe("FeatureGate", () => {
  beforeEach(() => vi.resetAllMocks());

  it("renders the feature when allowed", async () => {
    entitlements(decision({}));
    wrap(<FeatureGate feature="ai_tutor"><p>tutor ui</p></FeatureGate>);
    expect(await screen.findByText("tutor ui")).toBeInTheDocument();
  });

  it("shows the loading fallback, not the feature or a prompt, while entitlements load", () => {
    vi.mocked(getMyEntitlements).mockReturnValue(new Promise(() => {}));
    wrap(<FeatureGate feature="ai_tutor" loadingFallback={<p>loading…</p>}><p>tutor ui</p></FeatureGate>);
    expect(screen.getByText("loading…")).toBeInTheDocument();
    expect(screen.queryByText("tutor ui")).toBeNull();
  });

  it("replaces the feature with an upgrade prompt naming the plan when locked", async () => {
    entitlements(decision({ allowed: false, reason: "upgrade_required", requiredTier: "standard" }));
    wrap(<FeatureGate feature="ai_tutor" label="AI Tutor"><p>tutor ui</p></FeatureGate>);
    expect(await screen.findByText("AI Tutor is on Standard plans")).toBeInTheDocument();
    expect(screen.queryByText("tutor ui")).toBeNull();
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/pricing");
  });

  it("shows remaining free uses while a user is on a free allowance", async () => {
    entitlements(decision({ reason: "free_quota", quota: { limit: 5, used: 4, remaining: 1, period: "daily", resetsAt: "2026-10-01T23:00:00Z" } }));
    wrap(<FeatureGate feature="ai_tutor"><p>tutor ui</p></FeatureGate>);
    expect(await screen.findByTestId("quota-note")).toHaveTextContent("1 free use left today");
    expect(screen.getByText("tutor ui")).toBeInTheDocument();
  });

  it("explains an exhausted allowance and when it resets, instead of a generic paywall", async () => {
    entitlements(decision({ allowed: false, reason: "quota_exhausted", quota: { limit: 5, used: 5, remaining: 0, period: "daily", resetsAt: "2026-10-01T23:00:00Z" } }));
    wrap(<FeatureGate feature="ai_tutor" label="AI Tutor"><p>tutor ui</p></FeatureGate>);
    expect(await screen.findByText(/used your free ai tutor for today/i)).toBeInTheDocument();
    expect(screen.getByText(/allowance resets/)).toBeInTheDocument();
  });

  it("announces a timed promo so free access doesn't feel accidental", async () => {
    entitlements(decision({ reason: "promo", freeUntil: "2026-10-05T12:00:00Z" }));
    wrap(<FeatureGate feature="ai_tutor"><p>tutor ui</p></FeatureGate>);
    expect(await screen.findByTestId("promo-note")).toHaveTextContent(/Free for everyone until/);
  });

  it("a disabled feature shows 'temporarily unavailable', with no upgrade upsell", async () => {
    entitlements(decision({ allowed: false, reason: "disabled", requiredTier: null }));
    wrap(<FeatureGate feature="ai_tutor" label="AI Tutor"><p>tutor ui</p></FeatureGate>);
    expect(await screen.findByText(/temporarily unavailable/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "See plans" })).toBeNull();
  });

  it("FAILS OPEN if entitlements can't be fetched: never locks out a paying user over a network blip", async () => {
    vi.mocked(getMyEntitlements).mockRejectedValue(new Error("network"));
    wrap(<FeatureGate feature="ai_tutor"><p>tutor ui</p></FeatureGate>);
    expect(await screen.findByText("tutor ui")).toBeInTheDocument();
  });
});

const tx = (o: Partial<BackendTransaction>): BackendTransaction =>
  ({ id: "t1", status: "pending", amountKobo: 500000, gatewayMessage: null, ...o }) as BackendTransaction;

describe("CheckoutResult", () => {
  beforeEach(() => vi.resetAllMocks());

  it("polls while pending, then shows success with the amount", async () => {
    vi.mocked(verifyCheckout).mockResolvedValueOnce(tx({ status: "pending" })).mockResolvedValue(tx({ status: "success" }));
    wrap(<CheckoutResult search="?reference=r1&gateway=opay" pollMs={10} />);
    expect(screen.getByText("Confirming your payment…")).toBeInTheDocument();
    expect(await screen.findByText("Payment successful")).toBeInTheDocument();
    expect(screen.getByText(/payment of ₦5,000 was received/)).toBeInTheDocument();
    expect(verifyCheckout).toHaveBeenCalledWith("r1");
    expect(vi.mocked(verifyCheckout).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("after a successful payment, refreshes the subscription and entitlements so the app unlocks immediately", async () => {
    vi.mocked(verifyCheckout).mockResolvedValue(tx({ status: "success" }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, "invalidateQueries");
    wrap(<CheckoutResult search="?reference=r1" pollMs={10} />, qc);
    await screen.findByText("Payment successful");
    const keys = spy.mock.calls.map(([f]) => JSON.stringify((f as { queryKey: unknown }).queryKey));
    expect(keys).toContain(JSON.stringify(["billing", "subscription"]));
    expect(keys).toContain(JSON.stringify(["billing", "entitlements"]));
  });

  it("does NOT refresh them for a failed payment", async () => {
    vi.mocked(verifyCheckout).mockResolvedValue(tx({ status: "failed" }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, "invalidateQueries");
    wrap(<CheckoutResult search="?reference=r1" pollMs={10} />, qc);
    await screen.findByText("Payment not completed");
    expect(spy).not.toHaveBeenCalled();
  });

  it("'Continue' goes where the confirmed transaction says (one return URL serves plans AND book purchases)", async () => {
    vi.mocked(verifyCheckout).mockResolvedValue(tx({ status: "success", type: "content_purchase", relatedEntityId: "book-9" } as Partial<BackendTransaction>));
    const successAction = (t: BackendTransaction) =>
      t.type === "content_purchase"
        ? { href: `/dashboard/library/${t.relatedEntityId}`, label: "Open your purchase" }
        : { href: "/dashboard/billing", label: "View my plan" };
    wrap(<CheckoutResult search="?reference=r1" pollMs={10} successAction={successAction} />);
    const link = await screen.findByRole("link", { name: "Open your purchase" });
    expect(link).toHaveAttribute("href", "/dashboard/library/book-9");
  });

  it("falls back to successHref when no successAction is given", async () => {
    vi.mocked(verifyCheckout).mockResolvedValue(tx({ status: "success" }));
    wrap(<CheckoutResult search="?reference=r1" pollMs={10} successHref="/dashboard/billing" />);
    expect(await screen.findByRole("link", { name: "Continue" })).toHaveAttribute("href", "/dashboard/billing");
  });

  it("stops polling once the payment is final (does not hammer the server after success)", async () => {
    vi.mocked(verifyCheckout).mockResolvedValue(tx({ status: "success" }));
    wrap(<CheckoutResult search="?reference=r1" pollMs={10} />);
    await screen.findByText("Payment successful");
    const calls = vi.mocked(verifyCheckout).mock.calls.length;
    await new Promise((r) => setTimeout(r, 80));
    expect(vi.mocked(verifyCheckout).mock.calls.length).toBe(calls);
  });

  it.each(["failed", "abandoned", "reversed"] as const)("%s is a final failure — no endless spinner", async (status) => {
    vi.mocked(verifyCheckout).mockResolvedValue(tx({ status, gatewayMessage: "Insufficient funds" }));
    wrap(<CheckoutResult search="?reference=r1" pollMs={10} />);
    expect(await screen.findByText("Payment not completed")).toBeInTheDocument();
    expect(screen.getByText(/Insufficient funds/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/pricing");
  });

  it("a cancelled OPay checkout says nothing was charged and never calls the server", () => {
    wrap(<CheckoutResult search="?reference=r1&gateway=opay&cancelled=1" />);
    expect(screen.getByText("Payment cancelled")).toBeInTheDocument();
    expect(verifyCheckout).not.toHaveBeenCalled();
  });

  it("handles a page load with no reference without calling the server", () => {
    wrap(<CheckoutResult search="" />);
    expect(screen.getByText("We couldn't find your payment")).toBeInTheDocument();
    expect(verifyCheckout).not.toHaveBeenCalled();
  });

  it("if verification itself errors, tells the user NOT to pay twice and offers a manual re-check", async () => {
    vi.mocked(verifyCheckout).mockRejectedValue(new Error("network"));
    wrap(<CheckoutResult search="?reference=r1" pollMs={10} />);
    // the hook retries a failed verify once (default ~1s backoff) before giving up
    expect(await screen.findByText("Still confirming your payment", {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText(/don.t pay again/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check again" })).toBeInTheDocument();
  });

  it("does not treat a URL parameter as the outcome: ?status=success without server confirmation stays pending", async () => {
    vi.mocked(verifyCheckout).mockResolvedValue(tx({ status: "pending" }));
    wrap(<CheckoutResult search="?reference=r1&status=success" pollMs={1000} />);
    await waitFor(() => expect(verifyCheckout).toHaveBeenCalled());
    expect(screen.queryByText("Payment successful")).toBeNull();
  });
});
