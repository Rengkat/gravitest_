import { describe, expect, vi, test, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlogPageClient from "../BlogPageClient";
import * as blogApi from "@/lib/api/blog";

vi.mock("@/lib/hooks/useSiteContent", () => ({
  useBlock: () => ({ block: { heroTitle: "Hero from CMS" } }),
  useCollection: () => ({
    data: [
      { id: "1", slug: "jamb", label: "JAMB Guide", icon: "Target", gradient: "deep-green", sortOrder: 0, publishedAt: null },
      { id: "2", slug: "waec", label: "WAEC Guide", icon: "Award", gradient: "green", sortOrder: 1, publishedAt: null },
    ],
  }),
}));

vi.mock("@/lib/api/blog", async (orig) => {
  const actual = await orig<typeof import("@/lib/api/blog")>();
  return { ...actual, getFeaturedPost: vi.fn(), listPublishedPosts: vi.fn(), getPopularPosts: vi.fn().mockResolvedValue([]) };
});

vi.mock("../BlogHero", () => ({
  default: ({ content, search, onSearch }: { content: { heroTitle?: string }; search: string; onSearch: (v: string) => void }) => (
    <div>
      <h1>{content.heroTitle}</h1>
      <input aria-label="search" value={search} onChange={(e) => onSearch(e.target.value)} />
    </div>
  ),
}));
vi.mock("../FeaturedPost", () => ({ default: ({ post }: { post: { title: string } }) => <div data-testid="featured">{post.title}</div> }));
vi.mock("../BlogGrid", () => ({
  default: ({ posts, total }: { posts: { slug: string; title: string }[]; total: number }) => (
    <div>
      <span data-testid="total">{total}</span>
      {posts.map((p) => <div key={p.slug} data-testid="post">{p.title}</div>)}
    </div>
  ),
}));
vi.mock("../BlogSidebar", () => ({ default: () => <aside data-testid="sidebar" /> }));
vi.mock("../BlogCTA", () => ({ default: () => <div data-testid="cta" /> }));

const post = (o: Partial<blogApi.BackendPost>): blogApi.BackendPost => ({
  id: "x", slug: "s", title: "T", excerpt: "e", content: "c", category: "jamb", tag: "JAMB Guide", authorName: "A B",
  authorRole: null, authorInitials: null, coverImageUrl: null, readTimeMinutes: 4, isPublished: true, isFeatured: false,
  publishedAt: "2026-01-01T00:00:00Z", viewCount: 0, createdAt: "2026-01-01T00:00:00Z", ...o,
});

const list = vi.mocked(blogApi.listPublishedPosts);
const featured = vi.mocked(blogApi.getFeaturedPost);

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(blogApi.getPopularPosts).mockResolvedValue([]);
  featured.mockResolvedValue(null);
});

describe("BlogPageClient (database-driven)", () => {
  test("renders admin-managed hero copy and the posts returned by the API", async () => {
    list.mockResolvedValue({ data: [post({ slug: "a", title: "Alpha" }), post({ slug: "b", title: "Beta" })], meta: { totalItems: 2, totalPages: 1, currentPage: 1 } });
    render(<BlogPageClient />);
    expect(screen.getByText("Hero from CMS")).toBeInTheDocument();
    expect(await screen.findAllByTestId("post")).toHaveLength(2);
    expect(screen.getByTestId("total")).toHaveTextContent("2");
  });

  test("shows the featured post only when no search or category filter is active", async () => {
    featured.mockResolvedValue(post({ slug: "f", title: "Featured one", isFeatured: true }));
    list.mockResolvedValue({ data: [], meta: { totalItems: 0, totalPages: 1, currentPage: 1 } });
    render(<BlogPageClient />);
    expect(await screen.findByTestId("featured")).toHaveTextContent("Featured one");

    await userEvent.click(screen.getByRole("button", { name: "WAEC Guide" }));
    await waitFor(() => expect(screen.queryByTestId("featured")).toBeNull());
  });

  test("builds the category tabs from the admin's categories and filters server-side", async () => {
    list.mockResolvedValue({ data: [], meta: { totalItems: 0, totalPages: 1, currentPage: 1 } });
    render(<BlogPageClient />);
    await screen.findByTestId("total");
    await userEvent.click(screen.getByRole("button", { name: "JAMB Guide" }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ category: "jamb" })));
  });

  test("sends the search term to the API (debounced) and hides category tabs while searching", async () => {
    list.mockResolvedValue({ data: [], meta: { totalItems: 0, totalPages: 1, currentPage: 1 } });
    render(<BlogPageClient />);
    await screen.findByTestId("total");
    await userEvent.type(screen.getByLabelText("search"), "physics");
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ search: "physics" })));
    expect(screen.queryByRole("button", { name: "JAMB Guide" })).toBeNull();
  });

  test("says so (instead of showing nothing) when the posts can't be loaded", async () => {
    list.mockRejectedValue(new Error("down"));
    render(<BlogPageClient />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load the articles/i);
  });

  test("maps the admin-chosen category cover style onto each post's gradient", async () => {
    list.mockResolvedValue({ data: [post({ slug: "a", category: "jamb" })], meta: { totalItems: 1, totalPages: 1, currentPage: 1 } });
    render(<BlogPageClient />);
    await screen.findAllByTestId("post");
    expect(blogApi.toFrontendPost(post({}), "deep-green").gradientCls).toBe("from-green-900 to-green-700");
    expect(blogApi.toFrontendPost(post({}), "unknown").gradientCls).toBe("from-green-800 to-green-600");
  });
});
