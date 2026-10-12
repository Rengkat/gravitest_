import { describe, it, expect } from "vitest";
import { resolveActionTarget as r } from "./href";

describe("resolveActionTarget", () => {
  it("maps leaderboard_update to the real leaderboard page for each audience", () => {
    expect(
      r({ type: "leaderboard_update", actionUrl: "/dashboard/leaderboard?scope=monthly", metadata: null }, "student"),
    ).toBe("/dashboard/performance/leaderboard");
    expect(
      r({ type: "leaderboard_update", actionUrl: "/dashboard/leaderboard", metadata: null }, "admin"),
    ).toBe("/admin/leaderboard");
  });

  it("accepts real routes added by the leaderboard feature", () => {
    expect(r({ type: "system", actionUrl: "/admin/leaderboard", metadata: null }, "admin")).toBe(
      "/admin/leaderboard",
    );
    expect(
      r({ type: "system", actionUrl: "/dashboard/games/word-connect/leaderboard", metadata: null }, "student"),
    ).toBe("/dashboard/games/word-connect/leaderboard");
  });

  it("rejects an unknown path", () => {
    expect(r({ type: "system", actionUrl: "/nowhere", metadata: null }, "student")).toBeNull();
  });
});
