import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";
import QuestionDiscussion from "../QuestionDiscussion";
import * as api from "@/lib/api/discussions";
import type { Contribution } from "@/lib/api/discussions";

vi.mock("react-hot-toast", () => ({ default: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/lib/api/discussions");

const Q = "q-1";
const mk = (o: Partial<Contribution> = {}): Contribution => ({
  id: "c1", questionId: Q, partId: null, parentId: null, replyToId: null, replyToName: null,
  author: { displayName: "Ada O.", avatarUrl: null }, content: "i know this one", imageUrls: [],
  likeCount: 2, dislikeCount: 0, replyCount: 0, myReaction: 0, state: "visible", isMine: false, edited: false,
  createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(), ...o,
});
const page = (data: Contribution[], extra: Partial<api.Page<Contribution>["meta"]> = {}): api.Page<Contribution> => ({
  data, meta: { page: 1, limit: 10, total: data.length, totalPages: 1, discussionCount: data.length, ...extra },
});

function lockError(code: string) {
  const err = new AxiosError("Forbidden");
  err.response = { status: 403, data: { code }, statusText: "", headers: {}, config: {} as never };
  return err;
}

function renderIt(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.listContributions).mockResolvedValue(page([mk()]));
  vi.mocked(api.listReplies).mockResolvedValue(page([]));
});

describe("exam integrity (UI side — the server enforces the same rule)", () => {
  it("renders nothing and requests nothing when not enabled", () => {
    const { container } = renderIt(<QuestionDiscussion defaultOpen questionId={Q} enabled={false} />);
    expect(container).toBeEmptyDOMElement();
    expect(api.listContributions).not.toHaveBeenCalled();
  });

  it("renders nothing and requests nothing without a question id", () => {
    const { container } = renderIt(<QuestionDiscussion defaultOpen questionId={undefined} />);
    expect(container).toBeEmptyDOMElement();
    expect(api.listContributions).not.toHaveBeenCalled();
  });

  it.each([
    ["discussion_locked", /opens once you have attempted the question/i],
    ["exam_in_progress", /closed while an exam is in progress/i],
  ])("shows a calm note, no composer and no contributions when the server says %s", async (code, text) => {
    vi.mocked(api.listContributions).mockRejectedValue(lockError(code));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /post contribution/i })).toBeNull();
    expect(screen.queryByText("i know this one")).toBeNull();
  });
});

describe("reading", () => {
  it("asks the server for THIS question and sub-question only", async () => {
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} partId="part-a" />);
    await screen.findByText("i know this one");
    expect(api.listContributions).toHaveBeenCalledWith({ questionId: Q, partId: "part-a" }, expect.objectContaining({ page: 1 }));
  });

  it("shows the count, author, relative time, text and reaction counts", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([mk(), mk({ id: "c2", content: "second" })], { discussionCount: 7 }));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    expect(await screen.findByRole("heading", { name: /Discussions \(7\)/ })).toBeInTheDocument();
    const card = screen.getByText("i know this one").closest("article")!;
    expect(within(card).getByText("Ada O.")).toBeInTheDocument();
    expect(within(card).getByText("3 hours ago")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Like, 2 likes" })).toBeInTheDocument();
  });

  it("keeps threads of different sub-questions completely separate", async () => {
    vi.mocked(api.listContributions).mockImplementation(async (ref) =>
      page([mk({ id: ref.partId ?? "q", partId: ref.partId ?? null, content: `thread for ${ref.partId}` })]),
    );
    renderIt(<><QuestionDiscussion defaultOpen questionId={Q} partId="part-a" /><QuestionDiscussion defaultOpen questionId={Q} partId="part-b" /></>);
    expect(await screen.findByText("thread for part-a")).toBeInTheDocument();
    expect(await screen.findByText("thread for part-b")).toBeInTheDocument();
    expect(screen.getAllByTestId("question-discussion")).toHaveLength(2);
  });

  it("paginates: 'Load more' fetches the next page", async () => {
    vi.mocked(api.listContributions)
      .mockResolvedValueOnce(page([mk()], { page: 1, totalPages: 2, total: 2 }))
      .mockResolvedValueOnce(page([mk({ id: "c2", content: "older one" })], { page: 2, totalPages: 2, total: 2 }));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    await userEvent.click(await screen.findByRole("button", { name: /load more contributions/i }));
    expect(await screen.findByText("older one")).toBeInTheDocument();
    expect(api.listContributions).toHaveBeenLastCalledWith({ questionId: Q, partId: null }, expect.objectContaining({ page: 2 }));
  });

  it("shows a friendly empty state", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([]));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    expect(await screen.findByText(/be the first to share/i)).toBeInTheDocument();
  });

  it("shows removed contributions as a placeholder without their text or author", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([mk({ state: "deleted", content: null, author: null, replyCount: 1 })]));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    expect(await screen.findByText(/this contribution was deleted/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^like/i })).toBeNull();
    expect(screen.getByRole("button", { name: /1 reply/i })).toBeInTheDocument(); // replies keep their context
  });

  it("offers a retry when loading fails for a non-lock reason", { timeout: 15000 }, async () => {
    vi.mocked(api.listContributions).mockRejectedValue(new Error("boom"));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    // The hook retries a couple of times before giving up, so the error state takes a moment.
    const retry = await screen.findByRole("button", { name: /try again/i }, { timeout: 8000 });
    vi.mocked(api.listContributions).mockResolvedValue(page([mk()]));
    await userEvent.click(retry);
    expect(await screen.findByText("i know this one")).toBeInTheDocument();
  });
});

describe("posting", () => {
  const post = async (text: string) => {
    await userEvent.type(await screen.findByLabelText(/your contribution to discussions/i), text);
    await userEvent.click(screen.getByRole("button", { name: "Post contribution" }));
  };

  it("keeps Post disabled until there is something to post", async () => {
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    expect(await screen.findByRole("button", { name: "Post contribution" })).toBeDisabled();
  });

  it("posts against the question + sub-question with an idempotency token, then announces it", async () => {
    vi.mocked(api.createContribution).mockResolvedValue(mk({ id: "new", isMine: true, content: "my working" }));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} partId="part-a" />);
    await post("my working");
    await waitFor(() => expect(api.createContribution).toHaveBeenCalledTimes(1));
    expect(api.createContribution).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: Q, partId: "part-a", content: "my working", clientToken: expect.any(String) }),
    );
    expect(await screen.findByText("Your contribution was posted.")).toBeInTheDocument(); // live region
    expect(screen.getByLabelText(/your contribution to discussions/i)).toHaveValue("");
  });

  it("reuses the SAME token when a failed submit is retried (so a retry can never create a duplicate)", async () => {
    vi.mocked(api.createContribution).mockRejectedValueOnce(new Error("network")).mockResolvedValue(mk({ isMine: true }));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    await post("hello there");
    await waitFor(() => expect(api.createContribution).toHaveBeenCalledTimes(1));
    await userEvent.click(await screen.findByRole("button", { name: "Post contribution" }));
    await waitFor(() => expect(api.createContribution).toHaveBeenCalledTimes(2));
    const [a, b] = vi.mocked(api.createContribution).mock.calls.map((c) => c[0].clientToken);
    expect(a).toBe(b);
  });

  it("announces errors to screen readers and keeps the draft", async () => {
    vi.mocked(api.createContribution).mockRejectedValue(new Error("nope"));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    await post("keep me");
    expect(await screen.findByText(/^Error:/)).toBeInTheDocument();
    expect(screen.getByLabelText(/your contribution to discussions/i)).toHaveValue("keep me");
  });
});

describe("reactions", () => {
  it("likes, then un-likes on a second click, exposing the state with aria-pressed", async () => {
    vi.mocked(api.setReaction).mockImplementation(async (id, value) => ({ id, likeCount: value === 1 ? 3 : 2, dislikeCount: 0, myReaction: value }));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    const like = await screen.findByRole("button", { name: /^Like, 2 likes/ });
    expect(like).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(like);
    await waitFor(() => expect(api.setReaction).toHaveBeenCalledWith("c1", 1));
    expect(await screen.findByRole("button", { name: "Like, 3 likes" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Like, 3 likes" }));
    await waitFor(() => expect(api.setReaction).toHaveBeenLastCalledWith("c1", 0));
  });

  it("switching from like to dislike moves the count — never both pressed", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([mk({ myReaction: 1, likeCount: 3 })]));
    vi.mocked(api.setReaction).mockImplementation(async (id, value) => ({ id, likeCount: 2, dislikeCount: 1, myReaction: value }));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    await userEvent.click(await screen.findByRole("button", { name: /^Dislike, 0 dislikes/ }));
    expect(await screen.findByRole("button", { name: "Dislike, 1 dislike" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Like, 2 likes" })).toHaveAttribute("aria-pressed", "false");
  });

  it("rolls the optimistic count back if the server rejects the reaction", async () => {
    vi.mocked(api.setReaction).mockRejectedValue(new Error("down"));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    await userEvent.click(await screen.findByRole("button", { name: /^Like, 2 likes/ }));
    expect(await screen.findByRole("button", { name: "Like, 2 likes" })).toHaveAttribute("aria-pressed", "false");
  });

  it("does not let you react to your own contribution", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([mk({ isMine: true })]));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    expect(await screen.findByRole("button", { name: /^Like/ })).toBeDisabled();
  });
});

describe("replies", () => {
  it("expands replies on demand (aria-expanded), loading only that contribution's replies", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([mk({ replyCount: 2 })]));
    vi.mocked(api.listReplies).mockResolvedValue(page([
      mk({ id: "r1", parentId: "c1", content: "first reply", author: { displayName: "Bola K.", avatarUrl: null } }),
      mk({ id: "r2", parentId: "c1", content: "second reply", replyToId: "r1", replyToName: "Bola K." }),
    ]));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    const toggle = await screen.findByRole("button", { name: /2 replies/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(api.listReplies).not.toHaveBeenCalled();
    await userEvent.click(toggle);
    expect(await screen.findByText("first reply")).toBeInTheDocument();
    expect(screen.getByText(/replying to Bola K\./)).toBeInTheDocument();
    expect(api.listReplies).toHaveBeenCalledWith("c1", 1);
    expect(screen.getByRole("button", { name: /hide replies/i })).toHaveAttribute("aria-expanded", "true");
  });

  it("replying targets that exact contribution and announces the result", async () => {
    vi.mocked(api.createContribution).mockResolvedValue(mk({ id: "r9", parentId: "c1", isMine: true, content: "thanks" }));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} partId="part-a" />);
    await userEvent.click(await screen.findByRole("button", { name: "Reply to Ada O." }));
    await userEvent.type(screen.getByLabelText("Write your reply to Ada O."), "thanks");
    await userEvent.click(screen.getByRole("button", { name: "Post reply" }));
    await waitFor(() => expect(api.createContribution).toHaveBeenCalled());
    expect(api.createContribution).toHaveBeenCalledWith(expect.objectContaining({ questionId: Q, partId: "part-a", parentId: "c1", content: "thanks" }));
    expect(await screen.findByText(/your reply to Ada O\. was posted/i)).toBeInTheDocument();
  });
});

describe("own contributions & reporting", () => {
  it("lets the author edit and delete, but not report", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([mk({ isMine: true })]));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    expect(await screen.findByRole("button", { name: /edit your contribution/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete your contribution/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^report/i })).toBeNull();
  });

  it("asks for confirmation before deleting", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([mk({ isMine: true })]));
    vi.mocked(api.deleteContribution).mockResolvedValue();
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    await userEvent.click(await screen.findByRole("button", { name: /delete your contribution/i }));
    expect(api.deleteContribution).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(api.deleteContribution).toHaveBeenCalledWith("c1"));
  });

  it("lets a student report someone else's contribution with a reason", async () => {
    vi.mocked(api.reportContribution).mockResolvedValue({ reported: true, alreadyReported: false });
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    await userEvent.click(await screen.findByRole("button", { name: /report ada o\.'s contribution/i }));
    await userEvent.selectOptions(screen.getByLabelText(/why are you reporting/i), "spam");
    await userEvent.click(screen.getByRole("button", { name: "Send report" }));
    await waitFor(() => expect(api.reportContribution).toHaveBeenCalledWith("c1", "spam", undefined));
    expect(await screen.findByText(/report sent/i)).toBeInTheDocument();
  });
});

describe("accessibility structure", () => {
  it("exposes a labelled region, a polite live region and a labelled composer", async () => {
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} label="Question 2" />);
    expect(await screen.findByRole("region", { name: /Question 2 — Discussions/ })).toBeInTheDocument();
    expect(await screen.findByLabelText(/your contribution to question 2 discussions/i)).toBeInTheDocument();
    expect(screen.getAllByRole("status").some((el) => el.getAttribute("aria-live") === "polite")).toBe(true);
    expect(screen.getByRole("button", { name: /refresh question 2 discussions/i })).toBeInTheDocument();
  });
});

describe("equations in contributions", () => {
  it("typesets explicit LaTeX in a student's comment, leaving the rest as text", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(
      page([mk({ content: "I used \\(x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}\\) and got 48" })]),
    );
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    const card = (await screen.findByText(/and got 48/)).closest("article")!;
    expect(card.querySelector(".mfrac")).not.toBeNull();
    expect(card.querySelector(".katex-mathml msqrt")).not.toBeNull();
  });

  it("does NOT rewrite casual typing: a plain 'x^2' or '(a+1)/(b+2)' stays exactly as the student typed it", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([mk({ content: "is it x^2 or (a+1)/(b+2)?" })]));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    const card = (await screen.findByText(/is it x\^2/)).closest("article")!;
    expect(card.querySelector(".katex")).toBeNull();
  });

  it("a comment that is just broken LaTeX shows as text instead of breaking the thread", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([mk({ content: "oops \\(\\frac{1\\) done" })]));
    renderIt(<QuestionDiscussion defaultOpen questionId={Q} />);
    expect(await screen.findByText(/done/)).toBeInTheDocument();
  });
});

describe("collapsed by default, like Explain with AI", () => {
  it("shows only a button at first — no thread, no composer, and NOTHING is requested from the server", () => {
    renderIt(<QuestionDiscussion questionId={Q} label="Question 1" />);
    const toggle = screen.getByRole("button", { name: /Question 1 — Discussions/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(api.listContributions).not.toHaveBeenCalled();
    expect(screen.queryByText("i know this one")).toBeNull();
    expect(screen.queryByRole("button", { name: "Post contribution" })).toBeNull();
    expect(screen.queryByLabelText(/your contribution/i)).toBeNull();
  });

  it("opens on click: loads the thread, shows the count and the composer", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([mk()], { discussionCount: 4 }));
    renderIt(<QuestionDiscussion questionId={Q} />);
    await userEvent.click(screen.getByRole("button", { name: /^Discussions/ }));
    expect(await screen.findByText("i know this one")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Discussions \(4\)/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Post contribution" })).toBeInTheDocument();
    expect(api.listContributions).toHaveBeenCalledTimes(1);
  });

  it("opens from the keyboard (Enter)", async () => {
    renderIt(<QuestionDiscussion questionId={Q} />);
    await userEvent.tab();
    expect(screen.getByRole("button", { name: /Discussions/ })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByText("i know this one")).toBeVisible();
  });

  it("closing hides the thread but keeps it, so reopening is instant, reloads nothing and keeps a half-written comment", async () => {
    renderIt(<QuestionDiscussion questionId={Q} />);
    const toggle = screen.getByRole("button", { name: /^Discussions/ });
    await userEvent.click(toggle);
    await userEvent.type(await screen.findByLabelText(/your contribution to discussions/i), "half written");
    await userEvent.click(screen.getByRole("button", { name: /^Discussions/ }));
    expect(screen.getByRole("button", { name: /^Discussions/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("i know this one")).not.toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: /^Discussions/ }));
    expect(screen.getByText("i know this one")).toBeVisible();
    expect(screen.getByLabelText(/your contribution to discussions/i)).toHaveValue("half written");
    expect(api.listContributions).toHaveBeenCalledTimes(1);
  });

  it("a locked discussion says so only when opened", async () => {
    vi.mocked(api.listContributions).mockRejectedValue(lockError("discussion_locked"));
    renderIt(<QuestionDiscussion questionId={Q} />);
    expect(screen.queryByText(/opens once you have attempted/i)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /^Discussions/ }));
    expect(await screen.findByText(/opens once you have attempted the question/i)).toBeVisible();
  });

  it("each sub-question has its own independent toggle", async () => {
    vi.mocked(api.listContributions).mockImplementation(async (ref) => page([mk({ content: `thread ${ref.partId}` })]));
    renderIt(<><QuestionDiscussion questionId={Q} partId="a" label="Part (a)" /><QuestionDiscussion questionId={Q} partId="b" label="Part (b)" /></>);
    await userEvent.click(screen.getByRole("button", { name: /Part \(a\) — Discussions/ }));
    expect(await screen.findByText("thread a")).toBeVisible();
    expect(screen.queryByText("thread b")).toBeNull(); // (b) is still closed and unrequested
    expect(api.listContributions).toHaveBeenCalledTimes(1);
  });

  it("still renders nothing at all when discussions aren't allowed on this screen", () => {
    const { container } = renderIt(<QuestionDiscussion questionId={Q} enabled={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});
