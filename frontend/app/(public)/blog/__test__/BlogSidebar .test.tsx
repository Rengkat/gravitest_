import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlogSidebar from "../BlogSidebar";
import * as blogApi from "@/lib/api/blog";

vi.mock("@/lib/api/blog", async (orig) => ({ ...(await orig<typeof import("@/lib/api/blog")>()), getPopularPosts: vi.fn() }));

const cats = [
  { id: "1", slug: "jamb", label: "JAMB Guide", sortOrder: 0, publishedAt: null },
  { id: "2", slug: "waec", label: "WAEC Guide", sortOrder: 1, publishedAt: null },
];
const popular = [1, 2, 3].map((n) => ({
  id: `p${n}`, slug: `post-${n}`, title: `Popular ${n}`, readTimeMinutes: n + 2, publishedAt: "2026-02-01T00:00:00Z", createdAt: "2026-02-01T00:00:00Z",
})) as unknown as blogApi.BackendPost[];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(blogApi.getPopularPosts).mockResolvedValue(popular);
});

describe("BlogSidebar (admin-managed)", () => {
  it("lists the real most-read posts from the API, linking to each", async () => {
    render(<BlogSidebar content={{ popularTitle: "Most Read" }} categories={[]} onPickCategory={() => {}} />);
    const link = await screen.findByRole("link", { name: /Popular 1/ });
    expect(link).toHaveAttribute("href", "/blog/post-1");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("renders topics from the admin's categories and reports the pick", async () => {
    const onPick = vi.fn();
    window.scrollTo = vi.fn();
    render(<BlogSidebar content={{}} categories={cats} onPickCategory={onPick} />);
    await userEvent.click(screen.getByRole("button", { name: "WAEC Guide" }));
    expect(onPick).toHaveBeenCalledWith("waec");
  });

  it("shows the promo card only when the admin configured title, label and link", () => {
    const { rerender } = render(<BlogSidebar content={{}} categories={[]} onPickCategory={() => {}} />);
    expect(screen.queryByRole("link", { name: "Start Free" })).toBeNull();
    rerender(<BlogSidebar content={{ promoTitle: "Ready?", promoButtonLabel: "Start Free", promoButtonHref: "/register" }} categories={[]} onPickCategory={() => {}} />);
    expect(screen.getByRole("link", { name: /Start Free/ })).toHaveAttribute("href", "/register");
  });

  it("has no fake newsletter form (nothing was ever sent anywhere)", () => {
    render(<BlogSidebar content={{ sidebarTitle: "Hi", sidebarButtonLabel: "Go", sidebarButtonHref: "/x" }} categories={[]} onPickCategory={() => {}} />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByText(/you.re subscribed/i)).toBeNull();
  });

  it("still renders when the popular-posts request fails", async () => {
    vi.mocked(blogApi.getPopularPosts).mockRejectedValue(new Error("x"));
    render(<BlogSidebar content={{}} categories={cats} onPickCategory={() => {}} />);
    await waitFor(() => expect(blogApi.getPopularPosts).toHaveBeenCalled());
    expect(screen.queryByText("Most Read")).toBeNull();
  });
});
