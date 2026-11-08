import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import { explainFailure } from "../aiExplain";

const http = (status: number, data: unknown) => {
  const e = new AxiosError("x");
  e.response = { status, data, statusText: "", headers: {}, config: {} as never };
  return e;
};

describe("explainFailure", () => {
  it("attempt_first is locked, not retryable", () => {
    expect(explainFailure(http(403, { code: "attempt_first", message: "Answer first." }))).toEqual({
      code: "attempt_first", message: "Answer first.", retryable: false, locked: true,
    });
  });

  it("exam_in_progress is locked, not retryable", () => {
    expect(explainFailure(http(403, { code: "exam_in_progress", message: "No." }))).toMatchObject({ locked: true, retryable: false });
  });

  it("honours the server's retryable flag for image and AI errors", () => {
    expect(explainFailure(http(503, { code: "ai_unavailable", retryable: true, message: "m" }))).toMatchObject({ retryable: true, locked: false });
    expect(explainFailure(http(422, { code: "image_unsupported", retryable: false, message: "m" }))).toMatchObject({ retryable: false, locked: false });
  });

  it("hides raw 5xx text that has no known code", () => {
    const f = explainFailure(http(500, { message: "Google AI error (500): internal secret" }));
    expect(f.message).not.toMatch(/Google|secret/);
    expect(f.retryable).toBe(true);
  });

  it("network errors are retryable with a connection message", () => {
    const f = explainFailure(new AxiosError("Network Error"));
    expect(f).toMatchObject({ code: "network", retryable: true });
    expect(f.message).toMatch(/connection/i);
  });

  it("unknown non-HTTP errors become a generic retryable message", () => {
    expect(explainFailure(new Error("boom"))).toMatchObject({ code: null, retryable: true, locked: false });
  });

  it("uses a rate-limit 429 as retryable", () => {
    expect(explainFailure(http(429, { message: "Too many" }))).toMatchObject({ retryable: true });
  });
});
