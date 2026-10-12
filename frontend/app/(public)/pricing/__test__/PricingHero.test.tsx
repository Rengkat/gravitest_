import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BackendPlan } from "@/lib/api/billing";
import PricingHero from "../PricingHero";

vi.mock("@/lib/hooks/useBilling", () => ({ usePlans: vi.fn() }));
import { usePlans } from "@/lib/hooks/useBilling";

const state = (o: { data?: BackendPlan[]; isLoading?: boolean }) =>
  vi.mocked(usePlans).mockReturnValue({ data: o.data, isLoading: o.isLoading ?? false } as ReturnType<typeof usePlans>);

let n = 0;
const P = (o: Partial<BackendPlan>): BackendPlan => ({
  id: `p${++n}`, code: `c${n}`, name: "Plan", description: null, tier: "standard", interval: "monthly", currency: "NGN",
  amountKobo: 500000, listAmountKobo: 500000, isPromo: false, promoLabel: null, promoEndsAt: null, discountPercent: 0,
  features: [], badge: null, isSelfServe: true, ...o,
});
const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

const FREE = P({ id: "free", name: "Free", tier: "free", interval: null, amountKobo: 0, listAmountKobo: 0, features: ["Limited practice sessions"], description: "Start for free." });
const BASIC = P({ id: "basic", name: "Basic Monthly", tier: "basic", amountKobo: 250000, listAmountKobo: 250000, features: ["Unlimited practice"] });
const STD_M = P({ id: "std-m", name: "Standard Monthly", tier: "standard", badge: "Most Popular", features: ["Everything in Basic", "AI essay scoring"] });
const STD_A = P({ id: "std-a", name: "Standard Annual", tier: "standard", interval: "annually", amountKobo: 4800000, listAmountKobo: 4800000, features: ["Everything in Basic", "AI essay scoring"], badge: "Most Popular" });
const ENT = P({ id: "ent", name: "Enterprise", tier: "enterprise", interval: "annually", amountKobo: 0, listAmountKobo: 0, isSelfServe: false, features: ["Dedicated support"] });
const CATALOGUE = [FREE, BASIC, STD_M, STD_A, ENT];

beforeEach(() => vi.resetAllMocks());

const cards = () => screen.getAllByTestId("plan-card");

describe("PricingHero — live plans", () => {
  it("shows a loading skeleton, and NONE of the static prices, while plans load", () => {
    state({ isLoading: true });
    render(<PricingHero />);
    expect(screen.getByLabelText("Loading plans")).toBeInTheDocument();
    expect(screen.queryByText(/₦2,500/)).toBeNull();
    expect(screen.queryByText(/Student Pro/)).toBeNull();
  });

  it("renders one card per tier from the API: names, prices, admin-written features and description", () => {
    state({ data: CATALOGUE });
    render(<PricingHero />);
    expect(cards()).toHaveLength(4);
    const names = cards().map((c) => within(c).getByText(/^(Free|Basic Monthly|Standard Monthly|Enterprise)$/).textContent);
    expect(names).toEqual(["Free", "Basic Monthly", "Standard Monthly", "Enterprise"]);
    expect(screen.getByText("Limited practice sessions")).toBeInTheDocument();
    expect(screen.getByText("AI essay scoring")).toBeInTheDocument();
    expect(screen.getByText("Start for free.")).toBeInTheDocument();
    expect(within(cards()[1]).getByText("₦2,500")).toBeInTheDocument();
    expect(within(cards()[2]).getByText("₦5,000")).toBeInTheDocument();
    // none of the old hardcoded marketing numbers leak through
    expect(screen.queryByText(/₦20,000|₦1,667|Student Pro/)).toBeNull();
  });

  it("the admin's badge, not the code, decides which card is highlighted", () => {
    state({ data: CATALOGUE });
    render(<PricingHero />);
    expect(screen.getAllByText("Most Popular")).toHaveLength(1);
    expect(within(cards()[2]).getByText("Most Popular")).toBeInTheDocument();
  });

  it("the Monthly/Annual toggle swaps plans, per-month equivalent and the billed line", async () => {
    state({ data: CATALOGUE });
    render(<PricingHero />);
    expect(within(cards()[2]).getByText("Billed monthly")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Annual/ }));
    const std = cards()[2];
    expect(within(std).getByText("Standard Annual")).toBeInTheDocument();
    expect(within(std).getByText("₦4,000")).toBeInTheDocument(); // 48,000 / 12
    expect(within(std).getByText("Billed ₦48,000/year — save 20%")).toBeInTheDocument();
    expect(within(std).getByRole("link", { name: "Start Standard Annual — ₦48,000/yr" })).toHaveAttribute("href", "/register");
    // a monthly-only tier keeps its own cadence rather than vanishing
    expect(within(cards()[1]).getByText("Basic Monthly")).toBeInTheDocument();
  });

  it("the toggle's saving pill is computed from real prices, not hardcoded", () => {
    state({ data: CATALOGUE });
    render(<PricingHero />);
    expect(screen.getByText("Save up to 20%")).toBeInTheDocument();
    expect(screen.queryByText("Save 33%")).toBeNull();
  });

  it("no toggle at all when the catalogue sells only one billing period", () => {
    state({ data: [FREE, BASIC, STD_M] });
    render(<PricingHero />);
    expect(screen.getByRole("button", { name: /Annual/ }).closest("div.hidden")).not.toBeNull();
  });

  it("only-annual catalogues show annual plans without a toggle", () => {
    state({ data: [FREE, STD_A] });
    render(<PricingHero />);
    expect(within(cards()[1]).getByText("Standard Annual")).toBeInTheDocument();
  });

  it("a running promo shows the label, discount, countdown and struck regular price", () => {
    const promo = { ...STD_M, amountKobo: 400000, listAmountKobo: 500000, isPromo: true, promoLabel: "Back to school", discountPercent: 20, promoEndsAt: inDays(3) };
    state({ data: [FREE, promo] });
    render(<PricingHero />);
    const c = cards()[1];
    expect(within(c).getByText("₦4,000")).toBeInTheDocument();
    expect(within(c).getByLabelText("Regular price ₦5,000 per month")).toBeInTheDocument();
    expect(within(c).getByText(/Back to school · 20% off/)).toBeInTheDocument();
    expect(within(c).getByText("Ends in 3 days")).toBeInTheDocument();
    expect(within(c).getByText(/first payment; renews at the regular price/)).toBeInTheDocument();
  });

  it("a promo that already ended on this device's clock is not shown (even if the cached response says it's live)", () => {
    const stale = { ...STD_M, amountKobo: 400000, listAmountKobo: 500000, isPromo: true, discountPercent: 20, promoEndsAt: inDays(-1) };
    state({ data: [FREE, stale] });
    render(<PricingHero />);
    expect(screen.queryByText(/% off/)).toBeNull();
    expect(screen.queryByLabelText(/Regular price/)).toBeNull();
  });

  it("an admin price change shows up (₦6,000 → card says ₦6,000, CTA says ₦6,000/mo)", () => {
    state({ data: [FREE, { ...STD_M, amountKobo: 600000, listAmountKobo: 600000 }] });
    render(<PricingHero />);
    expect(within(cards()[1]).getByRole("link", { name: "Start Standard Monthly — ₦6,000/mo" })).toBeInTheDocument();
  });

  it("free card links to sign-up; enterprise has no price or checkout, only a sales link", () => {
    state({ data: CATALOGUE });
    render(<PricingHero />);
    expect(within(cards()[0]).getByRole("link", { name: "Get Started Free" })).toHaveAttribute("href", "/register");
    const ent = cards()[3];
    expect(within(ent).getByText("Custom")).toBeInTheDocument();
    expect(within(ent).getByRole("link", { name: /Contact sales/ }).getAttribute("href")).toMatch(/^mailto:support@gravitest\.ng/);
    expect(within(ent).queryByRole("link", { name: /Start/ })).toBeNull();
  });
});

describe("PricingHero — when plans cannot be loaded", () => {
  it("API returned no plans: says so, and shows NO prices (never stale hard-coded ones)", () => {
    state({ data: [] });
    render(<PricingHero />);
    expect(screen.getByRole("alert")).toHaveTextContent(/unavailable/i);
    expect(screen.queryByTestId("plan-card")).toBeNull();
    expect(screen.queryByText(/₦/)).toBeNull();
    expect(screen.queryByText(/Student Pro/)).toBeNull();
  });

  it("API failed (no data, not loading): same honest message, with a retry", async () => {
    const refetch = vi.fn();
    vi.mocked(usePlans).mockReturnValue({ data: undefined, isLoading: false, refetch } as unknown as ReturnType<typeof usePlans>);
    render(<PricingHero />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
    expect(screen.queryByText(/Student Pro/)).toBeNull();
  });

  it("no billing toggle without plans", () => {
    state({ data: undefined });
    render(<PricingHero />);
    expect(screen.getByRole("button", { name: /Annual/ }).closest("div.hidden")).not.toBeNull();
  });
});
