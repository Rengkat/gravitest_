import { describe, it, expect, afterEach, vi } from "vitest";
import { HttpError, extractErrorMessage } from "@/lib/api/client";
import { streamTutorMessage, type StreamChunk } from "@/lib/api/aiTutor";
import { tutorErrorContent } from "../components/tutorError";

/** A fetch Response whose body is an SSE stream with the given events. */
const sse = (events: unknown[], status = 200) => {
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      for (const e of events) c.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
      c.close();
    },
  });
  return new Response(body, { status, headers: { "Content-Type": "text/event-stream" } });
};

const collect = async (): Promise<StreamChunk[]> => {
  const out: StreamChunk[] = [];
  for await (const c of streamTutorMessage({ message: "explain photosynthesis for me" } as never)) out.push(c);
  return out;
};

/** What useChat does with an error chunk (kept in lock-step with useChat.ts). */
const asThrown = (c: StreamChunk) => new HttpError(c.error!, c.errorStatus ?? 500, c.errorBody);

afterEach(() => vi.unstubAllGlobals());

describe("tutor: failures reported INSIDE the stream", () => {
  it("the error chunk's status and body survive the client", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sse([{ delta: "", done: true, error: "Nope", errorStatus: 403, errorBody: { code: "UPGRADE_REQUIRED" } }])));
    const [chunk] = await collect();
    expect(chunk).toMatchObject({ error: "Nope", errorStatus: 403, errorBody: { code: "UPGRADE_REQUIRED" } });
  });

  it("REGRESSION: a plain AI failure now shows the server's reason, not 'Something went wrong'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sse([{ delta: "", done: true, error: "AI service is temporarily unavailable.", errorStatus: 500 }])));
    const [chunk] = await collect();
    expect(tutorErrorContent(asThrown(chunk))).toBe("AI service is temporarily unavailable.");
    // the old behaviour, for contrast:
    expect(tutorErrorContent(new Error(chunk.error))).toBe("Something went wrong. Please try again.");
  });

  it("REGRESSION: a paywall reported in-stream gets the 'See plans' link (it never could before)", async () => {
    const body = { code: "UPGRADE_REQUIRED", feature: "ai_tutor", requiredTier: "basic", quota: null, message: "AI Tutor is available on paid plans. Upgrade to unlock it." };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sse([{ delta: "", done: true, error: body.message, errorStatus: 403, errorBody: body }])));
    const [chunk] = await collect();
    expect(tutorErrorContent(asThrown(chunk))).toBe(`${body.message}\n\n[See plans](/dashboard/billing?upgrade=1)`);
  });

  it("an exhausted free allowance also offers the upgrade; a switched-off feature does not", async () => {
    const quota = { code: "QUOTA_EXHAUSTED", feature: "ai_tutor", requiredTier: "basic", quota: { limit: 5, used: 5, remaining: 0 }, message: "You've used your free AI Tutor uses for today." };
    expect(tutorErrorContent(asThrown({ delta: "", done: true, error: quota.message, errorStatus: 403, errorBody: quota }))).toContain("[See plans]");
    const off = { code: "FEATURE_DISABLED", feature: "ai_tutor", message: "AI Tutor is temporarily unavailable." };
    expect(tutorErrorContent(asThrown({ delta: "", done: true, error: off.message, errorStatus: 403, errorBody: off }))).toBe(off.message);
  });

  it("an error chunk with no status defaults to 500 (older backend) and still shows its message", () => {
    expect(tutorErrorContent(asThrown({ delta: "", done: true, error: "Old backend message" }))).toBe("Old backend message");
  });

  it("normal text chunks are unaffected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sse([{ delta: "Photo", done: false }, { delta: "synthesis", done: true, conversationId: "c1" }])));
    const chunks = await collect();
    expect(chunks.map((c) => c.delta).join("")).toBe("Photosynthesis");
    expect(chunks.some((c) => c.error)).toBe(false);
  });
});

describe("tutor: server unreachable", () => {
  it("a fetch network failure says the server can't be reached", () => {
    expect(extractErrorMessage(new TypeError("Failed to fetch"))).toMatch(/Can't reach the server/);
    expect(extractErrorMessage(new TypeError("NetworkError when attempting to fetch resource."))).toMatch(/Can't reach the server/);
  });
  it("other plain errors are still generic (no internals leaked)", () => {
    expect(extractErrorMessage(new Error("Cannot read properties of undefined"))).toBe("Something went wrong. Please try again.");
    expect(extractErrorMessage(new TypeError("x is not a function"))).toBe("Something went wrong. Please try again.");
  });
});
