/**
 * Human names for payment gateways. One place, so a newly added gateway is a
 * one-line change and no screen keeps saying "Paystack" for everyone.
 */
const NAMES: Record<string, string> = {
  paystack: "Paystack",
  opay: "OPay",
};

/** "opay" -> "OPay". Unknown codes are title-cased; a missing code is a generic "Payment". */
export function gatewayLabel(code?: string | null): string {
  if (!code) return "Payment";
  return NAMES[code] ?? code.charAt(0).toUpperCase() + code.slice(1);
}
