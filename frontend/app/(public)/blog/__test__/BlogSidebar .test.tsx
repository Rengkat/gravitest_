import { describe, expect, vi, beforeEach, afterEach, test } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import BlogSidebar from "../BlogSidebar";

vi.mock("../blogData", () => ({
  POSTS: [
    {
      slug: "post-1",
      title: "How to Score 300 in JAMB",
      excerpt: "Tips and tricks",
      readTime: "5 min read",
      date: "Jan 1 2025",
      tag: "JAMB Guide",
      category: "jamb",
      featured: false,
      gradientCls: "from-green-800 to-green-600",
      author: { name: "Tolu F.", initials: "TF", role: "Educator" },
    },
    {
      slug: "post-2",
      title: "WAEC English Guide",
      excerpt: "Master the comprehension",
      readTime: "4 min read",
      date: "Feb 1 2025",
      tag: "WAEC Guide",
      category: "waec",
      featured: false,
      gradientCls: "from-teal-700 to-teal-500",
      author: { name: "Ngozi E.", initials: "NE", role: "Teacher" },
    },
    {
      slug: "post-3",
      title: "Study Science Basics",
      excerpt: "Learn how to learn",
      readTime: "6 min read",
      date: "Mar 1 2025",
      tag: "Study Tips",
      category: "study",
      featured: false,
      gradientCls: "from-blue-700 to-blue-500",
      author: { name: "Emeka A.", initials: "EA", role: "AI Education Researcher" },
    },
  ],
  POPULAR_TAGS: ["JAMB", "WAEC", "Study Tips", "Post-UTME"],
}));

vi.mock("../PostCard", () => ({
  default: ({ post }: { post: { title: string } }) => <div>{post.title}</div>,
}));

describe("BlogSidebar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  test("renders the newsletter heading", () => {
    render(<BlogSidebar />);
    expect(screen.getByText(/get study tips weekly/i)).toBeInTheDocument();
  });

  test("renders popular tags", () => {
    render(<BlogSidebar />);
    expect(screen.getByText("JAMB")).toBeInTheDocument();
    expect(screen.getByText("WAEC")).toBeInTheDocument();
    expect(screen.getByText("Study Tips")).toBeInTheDocument();
  });

  test("renders the top 3 most-read post titles", () => {
    render(<BlogSidebar />);
    expect(screen.getByText("How to Score 300 in JAMB")).toBeInTheDocument();
    expect(screen.getByText("WAEC English Guide")).toBeInTheDocument();
    expect(screen.getByText("Study Science Basics")).toBeInTheDocument();
  });

  test("renders the CTA card with a Start Free link", () => {
    render(<BlogSidebar />);
    const cta = screen.getByRole("link", { name: /start free/i });
    expect(cta).toHaveAttribute("href", "/register");
  });

  test("does not subscribe when email is empty", () => {
    render(<BlogSidebar />);

    act(() => {
      fireEvent.submit(screen.getByRole("button", { name: /subscribe free/i }).closest("form")!);
    });

    expect(screen.queryByText(/you're subscribed/i)).not.toBeInTheDocument();
  });

  test("does not subscribe when email is invalid", () => {
    render(<BlogSidebar />);

    act(() => {
      fireEvent.change(screen.getByPlaceholderText(/adaeze@example\.com/i), {
        target: { value: "notanemail" },
      });
      fireEvent.submit(screen.getByRole("button", { name: /subscribe free/i }).closest("form")!);
    });

    expect(screen.queryByText(/you're subscribed/i)).not.toBeInTheDocument();
  });

  test("shows loading state immediately after valid submit", () => {
    render(<BlogSidebar />);

    act(() => {
      fireEvent.change(screen.getByPlaceholderText(/adaeze@example\.com/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.submit(screen.getByRole("button", { name: /subscribe free/i }).closest("form")!);
    });

    expect(screen.getByRole("button", { name: /subscribing/i })).toBeInTheDocument();
  });

  test("shows success state after the 1.2s timeout resolves", () => {
    render(<BlogSidebar />);

    act(() => {
      fireEvent.change(screen.getByPlaceholderText(/adaeze@example\.com/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.submit(screen.getByRole("button", { name: /subscribe free/i }).closest("form")!);
    });

    act(() => {
      vi.advanceTimersByTime(1199);
    });
    expect(screen.getByRole("button", { name: /subscribing/i })).toBeInTheDocument();

    // resolved at 1200ms
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText(/you're subscribed/i)).toBeInTheDocument();
  });

  test("hides the form once subscribed", () => {
    render(<BlogSidebar />);

    act(() => {
      fireEvent.change(screen.getByPlaceholderText(/adaeze@example\.com/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.submit(screen.getByRole("button", { name: /subscribe free/i }).closest("form")!);
    });

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.queryByPlaceholderText(/adaeze@example\.com/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /subscribe/i })).not.toBeInTheDocument();
  });
});
