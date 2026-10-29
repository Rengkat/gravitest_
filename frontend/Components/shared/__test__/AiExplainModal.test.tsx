import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
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
