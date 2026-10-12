import { describe, expect, vi, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlogPage from "../page";

vi.mock("../BlogHero", () => ({
  default: ({ search, onSearch }: { search: string; onSearch: (v: string) => void }) => (
    <input
      data-testid="search"
      value={search}
      onChange={(e) => onSearch(e.target.value)}
      placeholder="Search articles"
    />
  ),
}));

vi.mock("../CategoryFilter", () => ({
  default: ({ active, onChange }: { active: string; onChange: (id: string) => void }) => (
    <div data-testid="category-filter">
      {["all", "jamb", "waec", "study"].map((id) => (
        <button key={id} data-testid={`cat-${id}`} onClick={() => onChange(id)}>
          {id}
        </button>
      ))}
      <span data-testid="active-cat">{active}</span>
    </div>
  ),
}));

vi.mock("../FeaturedPost", () => ({
  default: ({ post }: { post: { title: string } }) => (
    <div data-testid="featured-post">{post.title}</div>
  ),
}));

vi.mock("../BlogGrid", () => ({
  default: ({ posts, total }: { posts: { slug: string; title: string }[]; total: number }) => (
    <div data-testid="blog-grid">
      <span data-testid="total">{total}</span>
      {posts.map((p) => (
        <div key={p.slug} data-testid="post-item">
          {p.title}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../BlogSidebar", () => ({
  default: () => <div data-testid="blog-sidebar" />,
}));

vi.mock("../BlogCTA", () => ({
  default: () => <div data-testid="blog-cta" />,
}));

vi.mock("../blogData", () => ({
  POSTS: [
    {
      slug: "featured-post",
      title: "Featured: Ace Your JAMB",
      excerpt: "The definitive guide",
      readTime: "8 min read",
      date: "Jan 1 2025",
      tag: "JAMB Guide",
      category: "jamb",
      featured: true,
      gradientCls: "from-green-800 to-green-600",
      author: { name: "Tolu F.", initials: "TF", role: "Educator" },
    },
    {
      slug: "jamb-maths",
      title: "JAMB Mathematics Made Easy",
      excerpt: "Practice these topics every day",
      readTime: "5 min read",
      date: "Feb 1 2025",
      tag: "JAMB Guide",
      category: "jamb",
      featured: false,
      gradientCls: "from-green-700 to-green-500",
      author: { name: "Tolu F.", initials: "TF", role: "Educator" },
    },
    {
      slug: "waec-english",
      title: "WAEC English Comprehension Tips",
      excerpt: "Score full marks in the reading section",
      readTime: "4 min read",
      date: "Mar 1 2025",
      tag: "WAEC Guide",
      category: "waec",
      featured: false,
      gradientCls: "from-teal-700 to-teal-500",
      author: { name: "Ngozi E.", initials: "NE", role: "Teacher" },
    },
    {
      slug: "study-science",
      title: "The Science of Effective Studying",
      excerpt: "Spaced repetition explained",
      readTime: "6 min read",
      date: "Apr 1 2025",
      tag: "Study Tips",
      category: "study",
      featured: false,
      gradientCls: "from-blue-700 to-blue-500",
      author: { name: "Emeka A.", initials: "EA", role: "AI Education Researcher" },
    },
  ],
  CATEGORIES: [
    { id: "all", label: "All", Icon: () => null },
    { id: "jamb", label: "JAMB", Icon: () => null },
    { id: "waec", label: "WAEC", Icon: () => null },
    { id: "study", label: "Study", Icon: () => null },
  ],
}));

describe("BlogPage", () => {
  // ── Initial render ──────────────────────────────────────────────────────────

  test("renders all structural sections on mount", () => {
    render(<BlogPage />);
    expect(screen.getByTestId("featured-post")).toBeInTheDocument();
    expect(screen.getByTestId("category-filter")).toBeInTheDocument();
    expect(screen.getByTestId("blog-grid")).toBeInTheDocument();
    expect(screen.getByTestId("blog-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("blog-cta")).toBeInTheDocument();
  });

  test("passes the correct total (non-featured count) to BlogGrid", () => {
    render(<BlogPage />);
    expect(screen.getByTestId("total")).toHaveTextContent("3");
  });

  test("shows all 3 non-featured posts by default", () => {
    render(<BlogPage />);
    expect(screen.getAllByTestId("post-item")).toHaveLength(3);
  });

  test("shows the featured post when no search or category filter is active", () => {
    render(<BlogPage />);
    expect(screen.getByTestId("featured-post")).toBeInTheDocument();
  });

  // ── Category filter ─────────────────────────────────────────────────────────

  test("filters posts to only JAMB category", async () => {
    const user = userEvent.setup();
    render(<BlogPage />);

    await user.click(screen.getByTestId("cat-jamb"));

    const items = screen.getAllByTestId("post-item");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("JAMB Mathematics Made Easy");
  });

  test("filters posts to only WAEC category", async () => {
    const user = userEvent.setup();
    render(<BlogPage />);

    await user.click(screen.getByTestId("cat-waec"));

    const items = screen.getAllByTestId("post-item");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("WAEC English Comprehension Tips");
  });

  test("hides the featured post when a non-all category is active", async () => {
    const user = userEvent.setup();
    render(<BlogPage />);

    await user.click(screen.getByTestId("cat-jamb"));

    expect(screen.queryByTestId("featured-post")).not.toBeInTheDocument();
  });

  test("restores all posts and featured post when switching back to all", async () => {
    const user = userEvent.setup();
    render(<BlogPage />);

    await user.click(screen.getByTestId("cat-waec"));
    await user.click(screen.getByTestId("cat-all"));

    expect(screen.getAllByTestId("post-item")).toHaveLength(3);
    expect(screen.getByTestId("featured-post")).toBeInTheDocument();
  });

  // ── Search filter ───────────────────────────────────────────────────────────

  test("filters by title match", async () => {
    const user = userEvent.setup();
    render(<BlogPage />);

    await user.type(screen.getByTestId("search"), "mathematics");

    const items = screen.getAllByTestId("post-item");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("JAMB Mathematics Made Easy");
  });

  test("filters by excerpt match", async () => {
    const user = userEvent.setup();
    render(<BlogPage />);

    await user.type(screen.getByTestId("search"), "spaced repetition");

    const items = screen.getAllByTestId("post-item");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("The Science of Effective Studying");
  });

  test("filters by tag match", async () => {
    const user = userEvent.setup();
    render(<BlogPage />);

    await user.type(screen.getByTestId("search"), "waec guide");

    const items = screen.getAllByTestId("post-item");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("WAEC English Comprehension Tips");
  });

  test("filters by author name match", async () => {
    const user = userEvent.setup();
    render(<BlogPage />);

    await user.type(screen.getByTestId("search"), "ngozi");

    const items = screen.getAllByTestId("post-item");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("WAEC English Comprehension Tips");
  });

  test("search is case-insensitive", async () => {
    const user = userEvent.setup();
    render(<BlogPage />);

    await user.type(screen.getByTestId("search"), "JAMB MATHEMATICS");

    expect(screen.getAllByTestId("post-item")).toHaveLength(1);
  });

  test("shows empty grid when search matches nothing", async () => {
    const user = userEvent.setup();
    render(<BlogPage />);

    await user.type(screen.getByTestId("search"), "zzznomatch");

    expect(screen.queryByTestId("post-item")).not.toBeInTheDocument();
  });

  test("hides featured post and category filter when search is active", async () => {
    const user = userEvent.setup();
    render(<BlogPage />);

    await user.type(screen.getByTestId("search"), "jamb");

    expect(screen.queryByTestId("featured-post")).not.toBeInTheDocument();
    expect(screen.queryByTestId("category-filter")).not.toBeInTheDocument();
  });

  test("restores featured post and category filter after clearing search", async () => {
    const user = userEvent.setup();
    render(<BlogPage />);

    await user.type(screen.getByTestId("search"), "jamb");
    await user.clear(screen.getByTestId("search"));

    expect(screen.getByTestId("featured-post")).toBeInTheDocument();
    expect(screen.getByTestId("category-filter")).toBeInTheDocument();
  });
});
