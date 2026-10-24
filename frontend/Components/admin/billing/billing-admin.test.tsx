import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import type { AdminFeatureRule, AdminGateway, AdminPlan } from "@/lib/api/billing-admin";
import GatewaysAdmin from "./GatewaysAdmin";
import FeatureRulesAdmin from "./FeatureRulesAdmin";
import PlansAdmin from "./PlansAdmin";

vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api/billing-admin", () => ({
  adminListPlans: vi.fn(), adminCreatePlan: vi.fn(), adminUpdatePlan: vi.fn(), adminSetPlanPromo: vi.fn(),
  adminClearPlanPromo: vi.fn(), adminArchivePlan: vi.fn(),
  adminListGateways: vi.fn(), adminUpdateGateway: vi.fn(),
  adminListFeatureRules: vi.fn(), adminUpdateFeatureRule: vi.fn(),
}));
import toast from "react-hot-toast";
import * as api from "@/lib/api/billing-admin";

const wrap = (ui: ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};
beforeEach(() => vi.resetAllMocks());

// ── gateways ───────────────────────────────────────────────────────────────
const gw = (o: Partial<AdminGateway>): AdminGateway => ({
  code: "paystack", displayName: "Paystack", isDefault: true, enabled: true, configured: true, sortOrder: 0, updatedAt: "",
  capabilities: { recurringCharge: true, savedCards: true, methods: ["Card"] }, ...o,
});

describe("GatewaysAdmin", () => {
  it("cannot switch on a gateway whose credentials are missing, and says why", async () => {
    vi.mocked(api.adminListGateways).mockResolvedValue([gw({}), gw({ code: "opay", displayName: "OPay", isDefault: false, enabled: false, configured: false })]);
    wrap(<GatewaysAdmin />);
    expect(await screen.findByText(/Not configured/)).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Enable OPay" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Enable Paystack" })).toBeEnabled();
  });

  it("lists exactly which environment variables are still missing (names only)", async () => {
    vi.mocked(api.adminListGateways).mockResolvedValue([
      gw({}),
      gw({ code: "opay", displayName: "OPay", isDefault: false, enabled: false, configured: false, missingConfig: ["OPAY_CALLBACK_URL", "OPAY_RETURN_URL"] }),
    ]);
    wrap(<GatewaysAdmin />);
    expect(await screen.findByText("OPAY_CALLBACK_URL, OPAY_RETURN_URL")).toBeInTheDocument();
  });

  it("explains the 'configured but switched off' state that makes checkout Paystack-only", async () => {
    vi.mocked(api.adminListGateways).mockResolvedValue([gw({}), gw({ code: "opay", displayName: "OPay", isDefault: false, enabled: false })]);
    wrap(<GatewaysAdmin />);
    const banner = await screen.findByText(/has its credentials set but is switched off/);
    expect(banner).toHaveTextContent(/OPay has its credentials set but is switched off.*only offered one payment method/);
    expect(screen.getByText(/this method is off/i)).toBeInTheDocument();
  });

  it("shows no warning when every configured gateway is on", async () => {
    vi.mocked(api.adminListGateways).mockResolvedValue([gw({}), gw({ code: "opay", displayName: "OPay", isDefault: false, enabled: true })]);
    wrap(<GatewaysAdmin />);
    await screen.findByRole("switch", { name: "Enable OPay" });
    expect(screen.queryByText(/switched off/)).not.toBeInTheDocument();
    expect(screen.queryByText(/this method is off/i)).not.toBeInTheDocument();
  });

  it("enables a configured gateway", async () => {
    vi.mocked(api.adminListGateways).mockResolvedValue([gw({}), gw({ code: "opay", displayName: "OPay", isDefault: false, enabled: false })]);
    vi.mocked(api.adminUpdateGateway).mockResolvedValue([]);
    wrap(<GatewaysAdmin />);
    await userEvent.click(await screen.findByRole("switch", { name: "Enable OPay" }));
    await waitFor(() => expect(api.adminUpdateGateway).toHaveBeenCalledWith("opay", { enabled: true }));
  });

  it("'Make default' is only offered for an enabled gateway that isn't already the default", async () => {
    vi.mocked(api.adminListGateways).mockResolvedValue([gw({}), gw({ code: "opay", displayName: "OPay", isDefault: false, enabled: true })]);
    vi.mocked(api.adminUpdateGateway).mockResolvedValue([]);
    wrap(<GatewaysAdmin />);
    const buttons = await screen.findAllByRole("button", { name: "Make default" });
    expect(buttons[0]).toBeDisabled(); // paystack is already default
    await userEvent.click(buttons[1]);
    await waitFor(() => expect(api.adminUpdateGateway).toHaveBeenCalledWith("opay", { isDefault: true }));
  });

  it("surfaces a load failure instead of an empty screen", async () => {
    vi.mocked(api.adminListGateways).mockRejectedValue(new Error("x"));
    wrap(<GatewaysAdmin />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/Couldn't load/);
  });
});

// ── feature rules ──────────────────────────────────────────────────────────
const rule = (o: Partial<AdminFeatureRule> = {}): AdminFeatureRule => ({
  featureKey: "ai_tutor", label: "AI Tutor", description: "Chat with the tutor", enforcement: "Checked on every message.",
  supportedModes: ["free", "paid", "disabled"], mode: "paid", minTier: "basic", freeQuota: null, quotaPeriod: null,
  freeUntil: null, promoActive: false, updatedBy: null, updatedAt: null, ...o,
});

describe("FeatureRulesAdmin", () => {
  it("shows each feature with what the backend actually enforces", async () => {
    vi.mocked(api.adminListFeatureRules).mockResolvedValue([rule()]);
    wrap(<FeatureRulesAdmin />);
    expect(await screen.findByText("Checked on every message.")).toBeInTheDocument();
  });

  it("makes a paid feature free with one change", async () => {
    vi.mocked(api.adminListFeatureRules).mockResolvedValue([rule()]);
    vi.mocked(api.adminUpdateFeatureRule).mockResolvedValue(rule({ mode: "free" }));
    wrap(<FeatureRulesAdmin />);
    await userEvent.selectOptions(await screen.findByLabelText("AI Tutor access"), "free");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(api.adminUpdateFeatureRule).toHaveBeenCalledWith("ai_tutor", { mode: "free" }));
  });

  it("only offers modes the feature supports (library has no 'off')", async () => {
    vi.mocked(api.adminListFeatureRules).mockResolvedValue([rule({ featureKey: "library_premium", label: "Library", supportedModes: ["free", "paid"] })]);
    wrap(<FeatureRulesAdmin />);
    const sel = await screen.findByLabelText("Library access");
    expect(within(sel).queryByRole("option", { name: "Turned off" })).toBeNull();
  });

  it("sets 'paid from Standard, with 5 free uses a day'", async () => {
    vi.mocked(api.adminListFeatureRules).mockResolvedValue([rule()]);
    vi.mocked(api.adminUpdateFeatureRule).mockResolvedValue(rule());
    wrap(<FeatureRulesAdmin />);
    await userEvent.selectOptions(await screen.findByLabelText("AI Tutor minimum plan"), "standard");
    await userEvent.type(screen.getByLabelText("AI Tutor free uses"), "5");
    await userEvent.selectOptions(screen.getByLabelText("AI Tutor quota period"), "daily");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(api.adminUpdateFeatureRule).toHaveBeenCalledWith("ai_tutor", { mode: "paid", minTier: "standard", freeQuota: 5, quotaPeriod: "daily", freeUntil: null }));
  });

  it("'Free for 24 hours' sets a real future end time and sends it", async () => {
    vi.mocked(api.adminListFeatureRules).mockResolvedValue([rule()]);
    vi.mocked(api.adminUpdateFeatureRule).mockResolvedValue(rule());
    wrap(<FeatureRulesAdmin />);
    await userEvent.click(await screen.findByRole("button", { name: "Free for 1 day" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(api.adminUpdateFeatureRule).toHaveBeenCalled());
    const sent = vi.mocked(api.adminUpdateFeatureRule).mock.calls[0][1];
    const ms = new Date(sent.freeUntil as string).getTime() - Date.now();
    expect(ms).toBeGreaterThan(23 * 3_600_000);
    expect(ms).toBeLessThan(25 * 3_600_000);
  });

  it("invalid input is blocked client-side with the reason, and nothing is sent", async () => {
    vi.mocked(api.adminListFeatureRules).mockResolvedValue([rule()]);
    wrap(<FeatureRulesAdmin />);
    await userEvent.type(await screen.findByLabelText("AI Tutor free uses"), "5"); // but no period chosen
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/daily or monthly/));
    expect(api.adminUpdateFeatureRule).not.toHaveBeenCalled();
  });

  it("hides the paid-only controls when the feature is free", async () => {
    vi.mocked(api.adminListFeatureRules).mockResolvedValue([rule({ mode: "free", minTier: null })]);
    wrap(<FeatureRulesAdmin />);
    await screen.findByLabelText("AI Tutor access");
    expect(screen.queryByLabelText("AI Tutor minimum plan")).toBeNull();
    expect(screen.queryByLabelText("AI Tutor free until")).toBeNull();
  });
});

// ── plans ──────────────────────────────────────────────────────────────────
const plan = (o: Partial<AdminPlan> = {}): AdminPlan => ({
  id: "p1", code: "standard-monthly", name: "Standard Monthly", description: null, tier: "standard", interval: "monthly",
  amountKobo: 500000, currency: "NGN", features: [], badge: null, sortOrder: 0, isActive: true, isPublic: true, isSelfServe: true,
  promoAmountKobo: null, promoLabel: null, promoStartsAt: null, promoEndsAt: null,
  effective: { amountKobo: 500000, listAmountKobo: 500000, isPromo: false, promoLabel: null, promoEndsAt: null, discountPercent: 0 }, ...o,
});

describe("PlansAdmin", () => {
  it("lists plans with their live effective price, and a running promo", async () => {
    vi.mocked(api.adminListPlans).mockResolvedValue([
      plan({ promoLabel: "Back to school", effective: { amountKobo: 400000, listAmountKobo: 500000, isPromo: true, promoLabel: "Back to school", promoEndsAt: new Date(Date.now() + 3 * 86_400_000).toISOString(), discountPercent: 20 } }),
    ]);
    wrap(<PlansAdmin />);
    expect(await screen.findByText("₦4,000")).toBeInTheDocument();
    expect(screen.getByText(/Back to school: 20% off \(list ₦5,000\)/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "End promo now" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Run a promo" })).toBeNull();
  });

  it("changes the price: ₦5,500 is sent as 550000 kobo", async () => {
    vi.mocked(api.adminListPlans).mockResolvedValue([plan()]);
    vi.mocked(api.adminUpdatePlan).mockResolvedValue(plan());
    wrap(<PlansAdmin />);
    await userEvent.click(await screen.findByRole("button", { name: "Change price" }));
    const input = screen.getByLabelText("New price in naira");
    await userEvent.clear(input);
    await userEvent.type(input, "5,500");
    expect(screen.getByText(/Existing subscribers keep the price/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save price" }));
    await waitFor(() => expect(api.adminUpdatePlan).toHaveBeenCalledWith("p1", { amountKobo: 550000 }));
  });

  it("starts a promo: naira→kobo, trimmed label, ISO end date; and explains it applies to first payment only", async () => {
    vi.mocked(api.adminListPlans).mockResolvedValue([plan()]);
    vi.mocked(api.adminSetPlanPromo).mockResolvedValue(plan());
    wrap(<PlansAdmin />);
    await userEvent.click(await screen.findByRole("button", { name: "Run a promo" }));
    expect(screen.getByText(/first payment/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Promo price in naira"), "3500");
    await userEvent.type(screen.getByLabelText("Promo label"), " Sale ");
    fireEvent.change(screen.getByLabelText("Promo ends"), { target: { value: "2099-01-01T10:00" } });
    await userEvent.click(screen.getByRole("button", { name: "Start promo" }));
    await waitFor(() => expect(api.adminSetPlanPromo).toHaveBeenCalled());
    const [id, input] = vi.mocked(api.adminSetPlanPromo).mock.calls[0];
    expect(id).toBe("p1");
    expect(input).toMatchObject({ promoAmountKobo: 350000, promoLabel: "Sale" });
    expect(input.promoEndsAt).toMatch(/^2099-01-01T/);
  });

  it("refuses a promo that isn't cheaper than the regular price, before calling the API", async () => {
    vi.mocked(api.adminListPlans).mockResolvedValue([plan()]);
    wrap(<PlansAdmin />);
    await userEvent.click(await screen.findByRole("button", { name: "Run a promo" }));
    await userEvent.type(screen.getByLabelText("Promo price in naira"), "6000");
    fireEvent.change(screen.getByLabelText("Promo ends"), { target: { value: "2099-01-01T10:00" } });
    await userEvent.click(screen.getByRole("button", { name: "Start promo" }));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/lower than the regular price/));
    expect(api.adminSetPlanPromo).not.toHaveBeenCalled();
  });

  it("ends a promo immediately", async () => {
    vi.mocked(api.adminListPlans).mockResolvedValue([plan({ effective: { amountKobo: 400000, listAmountKobo: 500000, isPromo: true, promoLabel: null, promoEndsAt: new Date(Date.now() + 86_400_000).toISOString(), discountPercent: 20 } })]);
    vi.mocked(api.adminClearPlanPromo).mockResolvedValue(plan());
    wrap(<PlansAdmin />);
    await userEvent.click(await screen.findByRole("button", { name: "End promo now" }));
    await waitFor(() => expect(api.adminClearPlanPromo).toHaveBeenCalledWith("p1"));
  });

  it("retiring asks for confirmation first, and does nothing if declined", async () => {
    vi.mocked(api.adminListPlans).mockResolvedValue([plan()]);
    vi.mocked(api.adminArchivePlan).mockResolvedValue(plan());
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    wrap(<PlansAdmin />);
    await userEvent.click(await screen.findByRole("button", { name: "Retire" }));
    expect(api.adminArchivePlan).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await userEvent.click(screen.getByRole("button", { name: "Retire" }));
    await waitFor(() => expect(api.adminArchivePlan).toHaveBeenCalledWith("p1"));
    confirm.mockRestore();
  });

  it("no price/promo controls for a free plan or a contact-sales plan; retired plans are marked", async () => {
    vi.mocked(api.adminListPlans).mockResolvedValue([
      plan({ id: "f", code: "free", name: "Free", tier: "free", interval: null, amountKobo: 0 }),
      plan({ id: "e", code: "enterprise", name: "Enterprise", tier: "enterprise", isSelfServe: false, amountKobo: 0 }),
      plan({ id: "r", code: "old", name: "Old plan", isActive: false }),
    ]);
    wrap(<PlansAdmin />);
    await screen.findByText("Old plan");
    expect(screen.queryAllByRole("button", { name: "Change price" })).toHaveLength(0);
    expect(screen.getByText(/Retired/)).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("creates a plan: ₦48,000 annual → 4800000 kobo, features split by line", async () => {
    vi.mocked(api.adminListPlans).mockResolvedValue([]);
    vi.mocked(api.adminCreatePlan).mockResolvedValue(plan());
    wrap(<PlansAdmin />);
    await userEvent.click(await screen.findByRole("button", { name: "New plan" }));
    await userEvent.type(screen.getByLabelText("Plan name"), "Standard Annual");
    await userEvent.type(screen.getByLabelText("Plan code"), "standard-annual");
    await userEvent.selectOptions(screen.getByLabelText("Plan interval"), "annually");
    await userEvent.type(screen.getByLabelText("Plan price in naira"), "48000");
    await userEvent.type(screen.getByLabelText("Plan features"), "Everything in Basic{enter}Save 20%");
    await userEvent.click(screen.getByRole("button", { name: "Create plan" }));
    await waitFor(() => expect(api.adminCreatePlan).toHaveBeenCalledWith({
      code: "standard-annual", name: "Standard Annual", tier: "standard", interval: "annually", amountKobo: 4800000,
      features: ["Everything in Basic", "Save 20%"], isSelfServe: true, isPublic: true,
    }));
  });

  it("a bad plan code is caught in the form, not by a server round-trip", async () => {
    vi.mocked(api.adminListPlans).mockResolvedValue([]);
    wrap(<PlansAdmin />);
    await userEvent.click(await screen.findByRole("button", { name: "New plan" }));
    await userEvent.type(screen.getByLabelText("Plan name"), "X");
    await userEvent.type(screen.getByLabelText("Plan code"), "Bad Code");
    await userEvent.type(screen.getByLabelText("Plan price in naira"), "1000");
    await userEvent.click(screen.getByRole("button", { name: "Create plan" }));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/lowercase/));
    expect(api.adminCreatePlan).not.toHaveBeenCalled();
  });
});
