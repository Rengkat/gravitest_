import { describe, it, expect, vi } from "vitest";
import { startContentPurchase } from "./purchase";

describe("startContentPurchase", () => {
  it("asks for a checkout on the chosen gateway and sends the browser there", async () => {
    const purchase = vi.fn().mockResolvedValue({ authorizationUrl: "https://pay.example/x", reference: "r1" });
    const redirect = vi.fn();
    await startContentPurchase("book-1", "opay", { purchase, redirect });
    expect(purchase).toHaveBeenCalledWith("book-1", "opay");
    expect(redirect).toHaveBeenCalledWith("https://pay.example/x");
  });

  it("with no gateway chosen, lets the server use its default", async () => {
    const purchase = vi.fn().mockResolvedValue({ authorizationUrl: "https://pay.example/x", reference: "r1" });
    await startContentPurchase("book-1", undefined, { purchase, redirect: vi.fn() });
    expect(purchase).toHaveBeenCalledWith("book-1", undefined);
  });

  it("a failed purchase request rejects and NEVER redirects", async () => {
    const redirect = vi.fn();
    const purchase = vi.fn().mockRejectedValue(new Error("This content is not available for purchase."));
    await expect(startContentPurchase("b", "paystack", { purchase, redirect })).rejects.toThrow(/not available/);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("refuses to follow an insecure URL from the server (default redirect validates)", async () => {
    const purchase = vi.fn().mockResolvedValue({ authorizationUrl: "http://evil.example/pay", reference: "r" });
    await expect(startContentPurchase("b", undefined, { purchase })).rejects.toThrow(/not secure/);
  });
});
