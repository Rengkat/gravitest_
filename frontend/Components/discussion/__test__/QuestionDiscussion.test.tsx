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
    const { container } = renderIt(<QuestionDiscussion questionId={Q} enabled={false} />);
    expect(container).toBeEmptyDOMElement();
    expect(api.listContributions).not.toHaveBeenCalled();
  });

  it("renders nothing and requests nothing without a question id", () => {
    const { container } = renderIt(<QuestionDiscussion questionId={undefined} />);
    expect(container).toBeEmptyDOMElement();
    expect(api.listContributions).not.toHaveBeenCalled();
  });

  it.each([
    ["discussion_locked", /opens once you have attempted the question/i],
    ["exam_in_progress", /closed while an exam is in progress/i],
  ])("shows a calm note, no composer and no contributions when the server says %s", async (code, text) => {
    vi.mocked(api.listContributions).mockRejectedValue(lockError(code));
    renderIt(<QuestionDiscussion questionId={Q} />);
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /post contribution/i })).toBeNull();
    expect(screen.queryByText("i know this one")).toBeNull();
  });
});

describe("reading", () => {
  it("asks the server for THIS question and sub-question only", async () => {
    renderIt(<QuestionDiscussion questionId={Q} partId="part-a" />);
    await screen.findByText("i know this one");
    expect(api.listContributions).toHaveBeenCalledWith({ questionId: Q, partId: "part-a" }, expect.objectContaining({ page: 1 }));
  });

  it("shows the count, author, relative time, text and reaction counts", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([mk(), mk({ id: "c2", content: "second" })], { discussionCount: 7 }));
    renderIt(<QuestionDiscussion questionId={Q} />);
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
    renderIt(<><QuestionDiscussion questionId={Q} partId="part-a" /><QuestionDiscussion questionId={Q} partId="part-b" /></>);
    expect(await screen.findByText("thread for part-a")).toBeInTheDocument();
    expect(await screen.findByText("thread for part-b")).toBeInTheDocument();
    expect(screen.getAllByTestId("question-discussion")).toHaveLength(2);
  });

  it("paginates: 'Load more' fetches the next page", async () => {
    vi.mocked(api.listContributions)
      .mockResolvedValueOnce(page([mk()], { page: 1, totalPages: 2, total: 2 }))
      .mockResolvedValueOnce(page([mk({ id: "c2", content: "older one" })], { page: 2, totalPages: 2, total: 2 }));
    renderIt(<QuestionDiscussion questionId={Q} />);
    await userEvent.click(await screen.findByRole("button", { name: /load more contributions/i }));
    expect(await screen.findByText("older one")).toBeInTheDocument();
    expect(api.listContributions).toHaveBeenLastCalledWith({ questionId: Q, partId: null }, expect.objectContaining({ page: 2 }));
  });

  it("shows a friendly empty state", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([]));
    renderIt(<QuestionDiscussion questionId={Q} />);
    expect(await screen.findByText(/be the first to share/i)).toBeInTheDocument();
  });

  it("shows removed contributions as a placeholder without their text or author", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([mk({ state: "deleted", content: null, author: null, replyCount: 1 })]));
    renderIt(<QuestionDiscussion questionId={Q} />);
    expect(await screen.findByText(/this contribution was deleted/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^like/i })).toBeNull();
    expect(screen.getByRole("button", { name: /1 reply/i })).toBeInTheDocument(); // replies keep their context
  });

  it("offers a retry when loading fails for a non-lock reason", { timeout: 15000 }, async () => {
    vi.mocked(api.listContributions).mockRejectedValue(new Error("boom"));
    renderIt(<QuestionDiscussion questionId={Q} />);
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
    renderIt(<QuestionDiscussion questionId={Q} />);
    expect(await screen.findByRole("button", { name: "Post contribution" })).toBeDisabled();
  });

  it("posts against the question + sub-question with an idempotency token, then announces it", async () => {
    vi.mocked(api.createContribution).mockResolvedValue(mk({ id: "new", isMine: true, content: "my working" }));
    renderIt(<QuestionDiscussion questionId={Q} partId="part-a" />);
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
    renderIt(<QuestionDiscussion questionId={Q} />);
    await post("hello there");
    await waitFor(() => expect(api.createContribution).toHaveBeenCalledTimes(1));
    await userEvent.click(await screen.findByRole("button", { name: "Post contribution" }));
    await waitFor(() => expect(api.createContribution).toHaveBeenCalledTimes(2));
    const [a, b] = vi.mocked(api.createContribution).mock.calls.map((c) => c[0].clientToken);
    expect(a).toBe(b);
  });

  it("announces errors to screen readers and keeps the draft", async () => {
    vi.mocked(api.createContribution).mockRejectedValue(new Error("nope"));
    renderIt(<QuestionDiscussion questionId={Q} />);
    await post("keep me");
    expect(await screen.findByText(/^Error:/)).toBeInTheDocument();
    expect(screen.getByLabelText(/your contribution to discussions/i)).toHaveValue("keep me");
  });
});

describe("reactions", () => {
  it("likes, then un-likes on a second click, exposing the state with aria-pressed", async () => {
    vi.mocked(api.setReaction).mockImplementation(async (id, value) => ({ id, likeCount: value === 1 ? 3 : 2, dislikeCount: 0, myReaction: value }));
    renderIt(<QuestionDiscussion questionId={Q} />);
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
    renderIt(<QuestionDiscussion questionId={Q} />);
    await userEvent.click(await screen.findByRole("button", { name: /^Dislike, 0 dislikes/ }));
    expect(await screen.findByRole("button", { name: "Dislike, 1 dislike" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Like, 2 likes" })).toHaveAttribute("aria-pressed", "false");
  });

  it("rolls the optimistic count back if the server rejects the reaction", async () => {
    vi.mocked(api.setReaction).mockRejectedValue(new Error("down"));
    renderIt(<QuestionDiscussion questionId={Q} />);
    await userEvent.click(await screen.findByRole("button", { name: /^Like, 2 likes/ }));
    expect(await screen.findByRole("button", { name: "Like, 2 likes" })).toHaveAttribute("aria-pressed", "false");
  });

  it("does not let you react to your own contribution", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([mk({ isMine: true })]));
    renderIt(<QuestionDiscussion questionId={Q} />);
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
    renderIt(<QuestionDiscussion questionId={Q} />);
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
    renderIt(<QuestionDiscussion questionId={Q} partId="part-a" />);
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
    renderIt(<QuestionDiscussion questionId={Q} />);
    expect(await screen.findByRole("button", { name: /edit your contribution/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete your contribution/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^report/i })).toBeNull();
  });

  it("asks for confirmation before deleting", async () => {
    vi.mocked(api.listContributions).mockResolvedValue(page([mk({ isMine: true })]));
    vi.mocked(api.deleteContribution).mockResolvedValue();
    renderIt(<QuestionDiscussion questionId={Q} />);
    await userEvent.click(await screen.findByRole("button", { name: /delete your contribution/i }));
    expect(api.deleteContribution).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(api.deleteContribution).toHaveBeenCalledWith("c1"));
  });

  it("lets a student report someone else's contribution with a reason", async () => {
    vi.mocked(api.reportContribution).mockResolvedValue({ reported: true, alreadyReported: false });
    renderIt(<QuestionDiscussion questionId={Q} />);
    await userEvent.click(await screen.findByRole("button", { name: /report ada o\.'s contribution/i }));
    await userEvent.selectOptions(screen.getByLabelText(/why are you reporting/i), "spam");
    await userEvent.click(screen.getByRole("button", { name: "Send report" }));
    await waitFor(() => expect(api.reportContribution).toHaveBeenCalledWith("c1", "spam", undefined));
    expect(await screen.findByText(/report sent/i)).toBeInTheDocument();
  });
});

describe("accessibility structure", () => {
  it("exposes a labelled region, a polite live region and a labelled composer", async () => {
    renderIt(<QuestionDiscussion questionId={Q} label="Question 2" />);
    expect(await screen.findByRole("region", { name: /Question 2 — Discussions/ })).toBeInTheDocument();
    expect(await screen.findByLabelText(/your contribution to question 2 discussions/i)).toBeInTheDocument();
    expect(screen.getAllByRole("status").some((el) => el.getAttribute("aria-live") === "polite")).toBe(true);
    expect(screen.getByRole("button", { name: /refresh question 2 discussions/i })).toBeInTheDocument();
  });
});
