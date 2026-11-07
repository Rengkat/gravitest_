import { describe, expect, it } from "vitest";
import { relativeTime } from "../relativeTime";
import { applyReaction } from "@/lib/hooks/useDiscussions";

const NOW = Date.parse("2026-11-08T12:00:00Z");
const ago = (s: number) => new Date(NOW - s * 1000).toISOString();

describe("relativeTime", () => {
  it.each([
    [10, "just now"],
    [5 * 60, "5 minutes ago"],
    [3 * 3600, "3 hours ago"],
    [2 * 86400, "2 days ago"],
    [14 * 86400, "2 weeks ago"],
    [400 * 86400, "1 year ago"],
    [3 * 365 * 86400, "3 years ago"],
  ])("%is ago → %s", (s, text) => expect(relativeTime(ago(s), NOW)).toBe(text));
});

describe("applyReaction (optimistic counts)", () => {
  const base = { likeCount: 2, dislikeCount: 1, myReaction: 0 as const };
  it("like from nothing", () => expect(applyReaction(base, 1)).toEqual({ myReaction: 1, likeCount: 3, dislikeCount: 1 }));
  it("dislike from nothing", () => expect(applyReaction(base, -1)).toEqual({ myReaction: -1, likeCount: 2, dislikeCount: 2 }));
  it("like → dislike moves one count across", () =>
    expect(applyReaction({ ...base, myReaction: 1 }, -1)).toEqual({ myReaction: -1, likeCount: 1, dislikeCount: 2 }));
  it("removing a like", () =>
    expect(applyReaction({ ...base, myReaction: 1 }, 0)).toEqual({ myReaction: 0, likeCount: 1, dislikeCount: 1 }));
  it("never goes negative", () =>
    expect(applyReaction({ likeCount: 0, dislikeCount: 0, myReaction: 1 }, 0).likeCount).toBe(0));
});
