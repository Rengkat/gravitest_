import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { AxiosError } from "axios";
import AiExplainModal from "../AiExplainModal";
import ExplainWithAiButton from "../ExplainWithAiButton";

const GRAPH_TEXT = [
  "### 1. Do the arithmetic",
  "",
  "\\[",
  "75.0785 - 34.624 + 9.83",
  "\\]",
  "",
  "**Answer:** 50.28",
  "",
  "- first",
  "- second",
].join("\n");

describe("AiExplainModal", () => {
  test("is a labelled modal dialog, wide and independently scrollable", async () => {
    const request = vi.fn().mockResolvedValue("Hello");
    render(<AiExplainModal questionText="Q?" request={request} cache={{}} onClose={vi.fn()} />);
    const dialog = await screen.findByRole("dialog", { name: /sabi-ai explains/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog.className).toMatch(/sm:w-\[90vw\]/);
    expect(dialog.className).toMatch(/lg:w-\[85vw\]/);
    expect(dialog.className).toMatch(/max-w-6xl/);
    expect(screen.getByRole("dialog").querySelector("[aria-busy]")!.className).toMatch(/overflow-y-auto/);
  });

  test("renders Markdown/maths as content, not literal syntax", async () => {
    render(<AiExplainModal questionText="Q?" request={vi.fn().mockResolvedValue(GRAPH_TEXT)} cache={{}} onClose={vi.fn()} />);
    expect(await screen.findByRole("heading", { name: /do the arithmetic/i })).toBeInTheDocument();
    expect(screen.queryByText(/###/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\*\*Answer/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  test("shows a loading state, then content", async () => {
    let resolve!: (v: string) => void;
    const request = vi.fn().mockReturnValue(new Promise<string>((r) => (resolve = r)));
    render(<AiExplainModal questionText="Q?" request={request} cache={{}} onClose={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent(/preparing the explanation/i);
    resolve("Done!");
    expect(await screen.findByText("Done!")).toBeInTheDocument();
  });

  test("error state offers retry and keeps the dialog open", async () => {
    const request = vi.fn().mockRejectedValueOnce(new Error("nope")).mockResolvedValueOnce("Second time lucky");
    render(<AiExplainModal questionText="Q?" request={request} cache={{}} onClose={vi.fn()} />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText("Second time lucky")).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
  });

  test("makes exactly ONE request and has no 'simply' / style options", async () => {
    const request = vi.fn().mockResolvedValue("Only text");
    render(<AiExplainModal questionText="Q?" request={request} cache={{}} onClose={vi.fn()} />);
    expect(await screen.findByText("Only text")).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByText(/simply/i)).not.toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(1);
  });

  test("reopening uses the cached text (no second AI request)", async () => {
    const request = vi.fn().mockResolvedValue("Cached text");
    render(<ExplainWithAiButton questionText="Q?" request={request} />);
    await userEvent.click(screen.getByRole("button", { name: /explain with sabi/i }));
    expect(await screen.findByText("Cached text")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: /explain with sabi/i }));
    expect(await screen.findByText("Cached text")).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(1);
  });

  test("Escape closes; focus moves in on open and returns to the opener on close", async () => {
    const request = vi.fn().mockResolvedValue("x");
    render(<ExplainWithAiButton questionText="Q?" request={request} />);
    const opener = screen.getByRole("button", { name: /explain with sabi/i });
    opener.focus();
    await userEvent.click(opener);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });

  test("two buttons keep fully independent state (per question)", async () => {
    const reqA = vi.fn().mockResolvedValue("Answer for A");
    const reqB = vi.fn().mockResolvedValue("Answer for B");
    render(
      <>
        <ExplainWithAiButton questionText="A?" request={reqA} label="Explain A" />
        <ExplainWithAiButton questionText="B?" request={reqB} label="Explain B" />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Explain A" }));
    expect(await screen.findByText("Answer for A")).toBeInTheDocument();
    expect(reqB).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Explain B" }));
    expect(await screen.findByText("Answer for B")).toBeInTheDocument();
    expect(screen.queryByText("Answer for A")).not.toBeInTheDocument();
  });
});

// ─── Failure states: locked / retryable / not retryable ────────────────────

function httpError(status: number, data: Record<string, unknown>) {
  const err = new AxiosError("failed");
  err.response = { status, data, statusText: "", headers: {}, config: {} as never };
  return err;
}

describe("AiExplainModal — locked and failed states", () => {
  test("STATE 1 (not attempted): shows the existing message, with no 'Try again' — the explanation stays locked", async () => {
    const request = vi.fn().mockRejectedValue(
      httpError(403, { code: "attempt_first", message: "Answer this question first — the explanation unlocks after you attempt it." }),
    );
    render(<AiExplainModal questionText="Q?" request={request} cache={{}} onClose={vi.fn()} />);
    expect(await screen.findByText(/answer this question first/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^try again$/i })).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull(); // a lock is a status, not an error
  });

  test("after the student has answered, 'check again' re-asks the server and shows the explanation", async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(httpError(403, { code: "attempt_first", message: "Answer this question first." }))
      .mockResolvedValueOnce("Here is why.");
    render(<AiExplainModal questionText="Q?" request={request} cache={{}} onClose={vi.fn()} />);
    await userEvent.click(await screen.findByRole("button", { name: /i've answered/i }));
    expect(await screen.findByText("Here is why.")).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
  });

  test("an exam in progress is locked with no retry and no 'check again'", async () => {
    const request = vi.fn().mockRejectedValue(httpError(403, { code: "exam_in_progress", message: "Unavailable while an exam is in progress." }));
    render(<AiExplainModal questionText="Q?" request={request} cache={{}} onClose={vi.fn()} />);
    expect(await screen.findByText(/while an exam is in progress/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try again|check again/i })).toBeNull();
  });

  test("STATE 3 (AI failed): a meaningful message and a Retry that works", async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(httpError(503, { code: "ai_unavailable", retryable: true, message: "Sabi couldn't study this diagram just now. Your answer is saved — please try again." }))
      .mockResolvedValueOnce("Second time lucky");
    render(<AiExplainModal questionText="Q?" request={request} cache={{}} onClose={vi.fn()} />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/couldn't study this diagram/i);
    expect(alert).toHaveTextContent(/your answer is saved/i);
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText("Second time lucky")).toBeInTheDocument();
  });

  test("an image problem that retrying cannot fix says so instead of offering a pointless retry", async () => {
    const request = vi.fn().mockRejectedValue(
      httpError(422, { code: "image_unsupported", retryable: false, message: "The question diagram is in a format Sabi can't read yet (it supports JPEG, PNG and WebP)." }),
    );
    render(<AiExplainModal questionText="Q?" request={request} cache={{}} onClose={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/format Sabi can't read/i);
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
  });

  test("a temporarily unreachable image IS retryable", async () => {
    const request = vi.fn().mockRejectedValue(httpError(503, { code: "image_unreachable", retryable: true, message: "Sabi couldn't load the question diagram. Please try again in a moment." }));
    render(<AiExplainModal questionText="Q?" request={request} cache={{}} onClose={vi.fn()} />);
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  test("a raw provider/server error is never shown to the student", async () => {
    const raw = "Google AI error (429): quota exceeded for project gcp-secret-123";
    const request = vi.fn().mockRejectedValue(httpError(500, { message: raw }));
    render(<AiExplainModal questionText="Q?" request={request} cache={{}} onClose={vi.fn()} />);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).not.toMatch(/quota|gcp-secret|Google AI/);
    expect(alert).toHaveTextContent(/please try again/i);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  test("a network failure is retryable and says it is a connection problem", async () => {
    const request = vi.fn().mockRejectedValue(new AxiosError("Network Error"));
    render(<AiExplainModal questionText="Q?" request={request} cache={{}} onClose={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/connection/i);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  test("shows the question diagram Sabi is reading, and typesets maths in the question", async () => {
    render(
      <AiExplainModal
        questionText="Find x if (5x + 3)/[6x(x + 1)] is undefined"
        imageUrl="https://pub.example.r2.dev/q/angles.jpg"
        request={vi.fn().mockResolvedValue("ok")}
        cache={{}}
        onClose={vi.fn()}
      />,
    );
    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector("img")).toHaveAttribute("src", "https://pub.example.r2.dev/q/angles.jpg");
    expect(dialog.querySelector(".mfrac")).not.toBeNull();
  });

  test("equations in the AI reply are typeset, including multi-line steps", async () => {
    const text = "Solve:\n\n\\[\n\\begin{aligned}2x+3&=7\\\\2x&=4\\end{aligned}\n\\]\n\nSo \\(x=\\frac{4}{2}=2\\).";
    render(<AiExplainModal questionText="Q?" request={vi.fn().mockResolvedValue(text)} cache={{}} onClose={vi.fn()} />);
    const dialog = await screen.findByRole("dialog");
    await screen.findByText(/Solve:/);
    expect(dialog.querySelectorAll(".katex-mathml mtr").length).toBe(2);
    expect(dialog.querySelector(".mfrac")).not.toBeNull();
    // Everything OUTSIDE the typeset equations must be free of raw LaTeX commands.
    const clone = dialog.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".katex").forEach((n) => n.remove());
    expect(clone.textContent).not.toContain("\\frac");
    expect(clone.textContent).not.toContain("\\begin");
    expect(clone.textContent).not.toMatch(/\\\[|\\\(/);
  });
});

describe("AiExplainModal — layout of the question and diagram", () => {
  const url = "https://pub.example.r2.dev/q/circle.jpg";
  const open = async () => {
    render(
      <AiExplainModal questionText="Find angle m" imageUrl={url} request={vi.fn().mockResolvedValue("Because…")} cache={{}} onClose={vi.fn()} />,
    );
    return screen.findByRole("dialog");
  };

  test("there is exactly ONE scrolling region: the header holds only the title and close button", async () => {
    const dialog = await open();
    const scrollers = Array.from(dialog.querySelectorAll("*")).filter((el) => /(^|\s)overflow-y-auto(\s|$)/.test(el.className?.toString() ?? ""));
    expect(scrollers).toHaveLength(1);
    const header = dialog.querySelector("header")!;
    expect(header.querySelector("img")).toBeNull(); // the diagram is not squeezed into the header
    expect(header.querySelector('[class*="overflow-y-auto"]')).toBeNull();
    expect(header.querySelector('[class*="max-h-"]')).toBeNull(); // nothing clipped by a height cap up here
  });

  test("the question and its diagram sit inside the scrollable body, diagram first and compact", async () => {
    const dialog = await open();
    const body = dialog.querySelector("[aria-busy]")!;
    const card = screen.getByTestId("explain-question");
    expect(body.contains(card)).toBe(true);
    expect(card.querySelector("img")).toHaveAttribute("src", url);
    expect(card.querySelector("img")?.className).toMatch(/max-h-36/);
    expect(card).toHaveTextContent("Find angle m");
  });

  test("with no diagram the question card is just the text", async () => {
    render(<AiExplainModal questionText="Plain question" request={vi.fn().mockResolvedValue("ok")} cache={{}} onClose={vi.fn()} />);
    await screen.findByRole("dialog");
    expect(screen.getByTestId("explain-question").querySelector("img")).toBeNull();
  });

  test("the diagram can be enlarged, and Escape closes only the enlarged view — not the explanation", async () => {
    const onClose = vi.fn();
    render(<AiExplainModal questionText="Q" imageUrl={url} request={vi.fn().mockResolvedValue("ok")} cache={{}} onClose={onClose} />);
    await userEvent.click(await screen.findByRole("button", { name: /view larger/i }));
    expect(await screen.findByRole("dialog", { name: /question diagram/i })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: /sabi-ai explains/i })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1); // a second Escape closes the explanation itself
  });
});
