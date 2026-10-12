import type { BackendTransaction, PaymentGatewayCode } from "@/lib/api/billing";

export interface CheckoutReturn {
  reference: string | null;
  gateway: PaymentGatewayCode | null;
  /** The customer pressed "cancel" on the gateway's page. */
  cancelled: boolean;
}

const GATEWAYS: readonly string[] = ["paystack", "opay"];

/**
 * Reads the query string of the page a gateway sends the customer back to.
 *
 *  - Paystack redirects to our callback URL with `?reference=…` (also `trxref`).
 *  - OPay does NOT append anything itself, so the backend adds
 *    `?reference=…&gateway=opay` (and `&cancelled=1` on cancel) to the return URL.
 *
 * Both are normalized here so one "payment result" page serves every gateway.
 * Nothing read from the URL is trusted for anything but *which reference to
 * ask the server about* — the outcome always comes from verifyCheckout().
 */
export function parseCheckoutReturn(
  search: string | URLSearchParams | Record<string, string | string[] | undefined>,
): CheckoutReturn {
  const get = (k: string): string | null => {
    if (typeof search === "string") return new URLSearchParams(search).get(k);
    if (search instanceof URLSearchParams) return search.get(k);
    const v = search[k];
    return (Array.isArray(v) ? v[0] : v) ?? null;
  };

  const reference = (get("reference") ?? get("trxref"))?.trim() || null;
  const g = get("gateway");
  return {
    reference,
    gateway: g && GATEWAYS.includes(g) ? (g as PaymentGatewayCode) : null,
    cancelled: get("cancelled") === "1",
  };
}

export type CheckoutOutcome = "success" | "failed" | "pending";

/**
 * Collapses a transaction status to what the result page needs.
 * `abandoned` and `reversed` are NOT "pending": nothing further is coming, so
 * polling on them would spin forever.
 */
export function checkoutOutcome(status: BackendTransaction["status"]): CheckoutOutcome {
  if (status === "success") return "success";
  if (status === "pending") return "pending";
  return "failed";
}

/**
 * Sends the browser to a gateway's hosted checkout. Injectable for tests and
 * so callers can swap in router.push if they ever prefer it.
 */
export function redirectToCheckout(
  url: string,
  navigate: (u: string) => void = (u) => window.location.assign(u),
): void {
  // Only ever follow an absolute https URL we received from our own API.
  // (Guards against a malformed/poisoned response navigating somewhere odd.)
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("The payment page address was invalid. Please try again.");
  }
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && parsed.hostname === "localhost")) {
    throw new Error("The payment page address was not secure. Please try again.");
  }
  navigate(parsed.toString());
}
