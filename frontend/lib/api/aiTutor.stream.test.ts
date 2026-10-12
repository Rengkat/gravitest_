import { describe, it, expect, vi, afterEach } from "vitest";
import { streamTutorMessage } from "./aiTutor";
import { HttpError, extractErrorMessage } from "./client";

const consume = async (gen: AsyncGenerator<unknown>) => {
  const out: unknown[] = [];
  for await (const c of gen) out.push(c);
  return out;
};
const sse = (...chunks: object[]) =>
  new Response(chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join(""), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe("streamTutorMessage", () => {
  it("a paywalled tutor (403) surfaces the server's message, not 'Something went wrong'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ statusCode: 403, code: "UPGRADE_REQUIRED", feature: "ai_tutor", message: "AI Tutor is available on paid plans. Upgrade to unlock it." }),
      { status: 403 },
    )));
    const err = await consume(streamTutorMessage({ message: "hi" } as never)).catch((e) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(403);
    expect(extractErrorMessage(err)).toBe("AI Tutor is available on paid plans. Upgrade to unlock it.");
  });

  it("an unreadable error body still gives a usable message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>", { status: 502 })));
    const err = await consume(streamTutorMessage({ message: "hi" } as never)).catch((e) => e);
    expect(extractErrorMessage(err)).toBe("Tutor stream failed (502)");
  });

  it("still streams normal responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sse({ delta: "Hel" }, { delta: "lo" })));
    expect(await consume(streamTutorMessage({ message: "hi" } as never))).toEqual([{ delta: "Hel" }, { delta: "lo" }]);
  });
});
