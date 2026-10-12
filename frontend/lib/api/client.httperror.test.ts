import { describe, it, expect } from "vitest";
import { HttpError, extractErrorMessage, httpErrorFromResponse } from "./client";
import { parseAccessError } from "@/lib/billing/errors";

const res = (status: number, body?: unknown, raw?: string) =>
  new Response(raw ?? (body === undefined ? null : JSON.stringify(body)), { status });

describe("httpErrorFromResponse (fetch-based calls keep the server's message)", () => {
  it("uses the NestJS error body's message", async () => {
    const e = await httpErrorFromResponse(res(403, { statusCode: 403, message: "AI Tutor is available on paid plans." }), "fallback");
    expect(e).toBeInstanceOf(HttpError);
    expect(e.status).toBe(403);
    expect(e.message).toBe("AI Tutor is available on paid plans.");
  });
  it("joins class-validator's array messages", async () => {
    const e = await httpErrorFromResponse(res(400, { message: ["a must be x", "b must be y"] }), "fallback");
    expect(e.message).toBe("a must be x, b must be y");
  });
  it.each([
    ["an empty body", res(500)],
    ["a non-JSON (proxy HTML) body", res(502, undefined, "<html>Bad gateway</html>")],
    ["a body with no message", res(500, { statusCode: 500 })],
  ])("falls back to the supplied text for %s", async (_n, r) => {
    expect((await httpErrorFromResponse(r, "Tutor stream failed (500)")).message).toBe("Tutor stream failed (500)");
  });
});

describe("extractErrorMessage", () => {
  it("shows an HttpError's message instead of 'Something went wrong'", () => {
    expect(extractErrorMessage(new HttpError("Upgrade to unlock it.", 403))).toBe("Upgrade to unlock it.");
  });
  it("still falls back for unknown errors", () => {
    expect(extractErrorMessage(new Error("boom"))).toBe("Something went wrong. Please try again.");
  });
});

describe("parseAccessError with fetch-based errors", () => {
  it("recognises the structured 403 from a streaming endpoint", () => {
    const body = { statusCode: 403, code: "UPGRADE_REQUIRED", feature: "ai_tutor", requiredTier: "basic", quota: null, message: "Upgrade." };
    expect(parseAccessError(new HttpError("Upgrade.", 403, body))).toMatchObject({ code: "UPGRADE_REQUIRED", feature: "ai_tutor", requiredTier: "basic" });
  });
  it("ignores other statuses and bodies without an access code", () => {
    expect(parseAccessError(new HttpError("x", 429, { code: "UPGRADE_REQUIRED" }))).toBeNull();
    expect(parseAccessError(new HttpError("x", 403, { message: "Forbidden" }))).toBeNull();
  });
});
