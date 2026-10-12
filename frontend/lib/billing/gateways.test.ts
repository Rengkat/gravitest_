import { describe, it, expect } from "vitest";
import { gatewayLabel } from "./gateways";

describe("gatewayLabel", () => {
  it("names the known gateways", () => {
    expect(gatewayLabel("paystack")).toBe("Paystack");
    expect(gatewayLabel("opay")).toBe("OPay");
  });
  it("title-cases a gateway added later, without a code change", () => {
    expect(gatewayLabel("flutterwave")).toBe("Flutterwave");
  });
  it("is generic when there is no gateway", () => {
    expect(gatewayLabel(null)).toBe("Payment");
    expect(gatewayLabel(undefined)).toBe("Payment");
    expect(gatewayLabel("")).toBe("Payment");
  });
});
