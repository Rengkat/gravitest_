import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { HttpError } from "@/lib/api/client";
import renderMarkdown from "../components/RenderMarkdown";
import { tutorErrorContent } from "../components/tutorError";

const show = (text: string) => render(<div>{renderMarkdown(text)}</div>);

describe("RenderMarkdown — internal links", () => {
  it("renders [text](/internal/path) as a link", () => {
    show("Upgrade here: [See plans](/dashboard/billing?upgrade=1)");
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/dashboard/billing?upgrade=1");
  });

  it("keeps surrounding text and other formatting", () => {
    show("Please **upgrade** [now](/pricing) to continue");
    expect(screen.getByText("upgrade").tagName).toBe("STRONG");
    expect(screen.getByRole("link", { name: "now" })).toHaveAttribute("href", "/pricing");
  });

  // Model output is untrusted: only same-site paths may become links.
  it.each([
    ["a javascript: URL", "[click](javascript:alert(1))"],
    ["an external https URL", "[click](https://evil.example/phish)"],
    ["a protocol-relative URL", "[click](//evil.example/phish)"],
    ["a data: URL", "[click](data:text/html;base64,AAAA)"],
    ["a relative path with no leading slash", "[click](dashboard/billing)"],
    ["a link target containing a space", "[click](/ok path)"],
  ])("does NOT make a link from %s", (_n, md) => {
    show(md);
    expect(screen.queryByRole("link")).toBeNull();
    expect(document.body.textContent).toContain("click");
  });

  it("plain text, bold and code still render exactly as before", () => {
    show("A **bold** word and `code`");
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("code").tagName).toBe("CODE");
  });
});

const axios403 = (data: unknown) => {
  const e = new AxiosError("Request failed", "ERR_BAD_REQUEST");
  e.response = { status: 403, data, statusText: "", headers: {}, config: { headers: new AxiosHeaders() } };
  return e;
};

describe("tutorErrorContent", () => {
  it("a paywalled tutor: the server's message plus a way forward", () => {
    const err = new HttpError("AI Tutor is available on paid plans. Upgrade to unlock it.", 403, {
      code: "UPGRADE_REQUIRED", feature: "ai_tutor", requiredTier: "basic", quota: null, message: "AI Tutor is available on paid plans. Upgrade to unlock it.",
    });
    expect(tutorErrorContent(err)).toBe("AI Tutor is available on paid plans. Upgrade to unlock it.\n\n[See plans](/dashboard/billing?upgrade=1)");
  });

  it("an exhausted free allowance also offers the upgrade", () => {
    const err = axios403({ code: "QUOTA_EXHAUSTED", feature: "ai_tutor", requiredTier: "basic", quota: { limit: 5, used: 5, remaining: 0, period: "daily", resetsAt: "x" }, message: "You've used your free AI Tutor uses for today." });
    expect(tutorErrorContent(err)).toContain("[See plans](/dashboard/billing?upgrade=1)");
  });

  it("a switched-off feature gets NO upsell (an upgrade wouldn't help)", () => {
    const err = new HttpError("AI Tutor is temporarily unavailable.", 403, { code: "FEATURE_DISABLED", feature: "ai_tutor", message: "AI Tutor is temporarily unavailable." });
    expect(tutorErrorContent(err)).toBe("AI Tutor is temporarily unavailable.");
  });

  it("an ordinary failure is unchanged: no link", () => {
    expect(tutorErrorContent(new HttpError("Tutor stream failed (502)", 502))).toBe("Tutor stream failed (502)");
    expect(tutorErrorContent(new Error("boom"))).toBe("Something went wrong. Please try again.");
  });

  it("the whole message renders as text plus a working link", () => {
    const err = new HttpError("Upgrade to unlock it.", 403, { code: "UPGRADE_REQUIRED", feature: "ai_tutor", requiredTier: "basic", quota: null });
    show(tutorErrorContent(err));
    expect(screen.getByText("Upgrade to unlock it.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/dashboard/billing?upgrade=1");
  });
});
