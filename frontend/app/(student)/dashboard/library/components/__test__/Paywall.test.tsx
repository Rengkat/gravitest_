import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BackendPlan, PaymentGatewayOption } from "@/lib/api/billing";
import type { LibraryItem } from "@/types/library";
import PaywallModal from "../PaywallModal";
import PremiumCTA from "../PremiumCTA";

vi.mock("@/lib/hooks/useBilling", () => ({ usePlans: vi.fn(), usePaymentGateways: vi.fn() }));
import { usePaymentGateways, usePlans } from "@/lib/hooks/useBilling";

let n = 0;
const P = (o: Partial<BackendPlan>): BackendPlan => ({
  id: `p${++n}`, code: `c${n}`, name: "Plan", description: null, tier: "basic", interval: "monthly", currency: "NGN",
  amountKobo: 250000, listAmountKobo: 250000, isPromo: false, promoLabel: null, promoEndsAt: null, discountPercent: 0,
  features: [], badge: null, isSelfServe: true, ...o,
});
const PAYSTACK: PaymentGatewayOption = { code: "paystack", displayName: "Paystack", isDefault: true, capabilities: { recurringCharge: true, savedCards: true, methods: ["Card"] } };
const OPAY: PaymentGatewayOption = { code: "opay", displayName: "OPay", isDefault: false, capabilities: { recurringCharge: false, savedCards: false, methods: ["OPay wallet"] } };

const setup = (o: { plans?: BackendPlan[]; gateways?: PaymentGatewayOption[] }) => {
  vi.mocked(usePlans).mockReturnValue({ data: o.plans } as ReturnType<typeof usePlans>);
  vi.mocked(usePaymentGateways).mockReturnValue({ data: o.gateways } as ReturnType<typeof usePaymentGateways>);
};

const item = (o: Partial<LibraryItem> = {}) => ({ id: "book-1", title: "WAEC Physics", price: 1500, previewAvailable: false, ...o }) as unknown as LibraryItem;

beforeEach(() => vi.resetAllMocks());

describe("PaywallModal", () => {
  it("'from ₦X/mo' is the cheapest plan right now — not the old hardcoded ₦2,500", () => {
    setup({ plans: [P({ amountKobo: 150000, listAmountKobo: 250000, isPromo: true }), P({ tier: "standard", amountKobo: 500000, listAmountKobo: 500000 })] });
    render(<PaywallModal item={item()} onClose={vi.fn()} onUpgrade={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Upgrade to Premium — from ₦1,500\/mo/ })).toBeInTheDocument();
    expect(screen.queryByText(/₦2,500/)).toBeNull();
  });

  it("with no price known it says plain 'Upgrade to Premium', never a wrong figure", () => {
    setup({ plans: undefined });
    render(<PaywallModal item={item()} onClose={vi.fn()} onUpgrade={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Upgrade to Premium" })).toBeInTheDocument();
  });

  it("Upgrade calls onUpgrade", async () => {
    setup({ plans: [P({})] });
    const onUpgrade = vi.fn();
    render(<PaywallModal item={item()} onClose={vi.fn()} onUpgrade={onUpgrade} />);
    await userEvent.click(screen.getByRole("button", { name: /Upgrade to Premium/ }));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it("buying sends the admin's default gateway when the buyer doesn't choose", async () => {
    setup({ plans: [P({})], gateways: [OPAY, PAYSTACK] });
    const onBuySingle = vi.fn();
    render(<PaywallModal item={item()} onClose={vi.fn()} onUpgrade={vi.fn()} onBuySingle={onBuySingle} />);
    await userEvent.click(screen.getByRole("button", { name: /Buy this resource/ }));
    expect(onBuySingle).toHaveBeenCalledWith("paystack");
  });

  it("with two gateways the buyer can pick OPay and that is what gets sent", async () => {
    setup({ plans: [P({})], gateways: [PAYSTACK, OPAY] });
    const onBuySingle = vi.fn();
    render(<PaywallModal item={item()} onClose={vi.fn()} onUpgrade={vi.fn()} onBuySingle={onBuySingle} />);
    await userEvent.click(screen.getByLabelText(/OPay/));
    await userEvent.click(screen.getByRole("button", { name: /Buy this resource/ }));
    expect(onBuySingle).toHaveBeenCalledWith("opay");
  });

  it("a single gateway shows no picker; if gateways couldn't load, the server default is used", async () => {
    setup({ plans: [P({})], gateways: [PAYSTACK] });
    const { unmount } = render(<PaywallModal item={item()} onClose={vi.fn()} onUpgrade={vi.fn()} onBuySingle={vi.fn()} />);
    expect(screen.queryByRole("radio")).toBeNull();
    unmount();

    setup({ plans: [P({})], gateways: undefined });
    const onBuySingle = vi.fn();
    render(<PaywallModal item={item()} onClose={vi.fn()} onUpgrade={vi.fn()} onBuySingle={onBuySingle} />);
    await userEvent.click(screen.getByRole("button", { name: /Buy this resource/ }));
    expect(onBuySingle).toHaveBeenCalledWith(undefined);
  });

  it("an item that isn't sold individually offers no 'Buy this resource'", () => {
    setup({ plans: [P({})], gateways: [PAYSTACK, OPAY] });
    render(<PaywallModal item={item({ price: undefined })} onClose={vi.fn()} onUpgrade={vi.fn()} onBuySingle={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Buy this resource/ })).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
  });
});

describe("PremiumCTA", () => {
  it("shows the cheapest current price", () => {
    setup({ plans: [P({ amountKobo: 300000, listAmountKobo: 300000 })] });
    render(<PremiumCTA />);
    expect(screen.getByText("₦3,000")).toBeInTheDocument();
    expect(screen.queryByText("₦2,500")).toBeNull();
  });

  it("hides the price box instead of showing a wrong or stale number", () => {
    setup({ plans: undefined });
    render(<PremiumCTA />);
    expect(screen.queryByText("Starting from")).toBeNull();
    setup({ plans: [] });
  });

  it("both buttons now go somewhere: the plan chooser (they had no click handler before)", () => {
    setup({ plans: [P({})] });
    render(<PremiumCTA />);
    expect(screen.getByRole("link", { name: "Upgrade to Premium" })).toHaveAttribute("href", "/dashboard/billing?upgrade=1");
    expect(screen.getByRole("link", { name: "View Plans" })).toHaveAttribute("href", "/dashboard/billing?upgrade=1");
  });
});

describe("PaywallModal — offers only what can really unlock the item", () => {
  it("an item sold one by one shows Buy only: no Upgrade (a plan wouldn't include it)", () => {
    setup({ plans: [P({})], gateways: [PAYSTACK] });
    render(<PaywallModal item={item({ accessModel: "purchase" })} onClose={vi.fn()} onUpgrade={vi.fn()} onBuySingle={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Buy this resource/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Upgrade to Premium/ })).toBeNull();
    expect(screen.getByText(/bought individually/i)).toBeInTheDocument();
  });

  it("a plan-unlocked item shows Upgrade only: no Buy button", () => {
    setup({ plans: [P({})], gateways: [PAYSTACK] });
    render(<PaywallModal item={item({ accessModel: "subscription", price: undefined })} onClose={vi.fn()} onUpgrade={vi.fn()} onBuySingle={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Upgrade to Premium/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Buy this resource/ })).toBeNull();
  });
});
