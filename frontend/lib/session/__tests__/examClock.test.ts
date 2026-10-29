import { describe, it, expect } from "vitest";
import { deadlineFromRemaining, secondsLeft, timerView } from "../examClock";

describe("exam clock", () => {
  it("derives the deadline from the server's remaining seconds", () => {
    expect(deadlineFromRemaining(600, 1_000_000)).toBe(1_000_000 + 600_000);
    expect(deadlineFromRemaining(null, 1_000_000)).toBeNull();
    expect(deadlineFromRemaining(undefined, 1_000_000)).toBeNull();
    expect(deadlineFromRemaining(-5, 1_000_000)).toBe(1_000_000);
  });

  it("a refresh resumes the countdown instead of restarting it", () => {
    // Server says 600s were left when page loaded at t0; 100s later (another refresh) it says 500s.
    const t0 = 5_000;
    const first = deadlineFromRemaining(600, t0)!;
    expect(secondsLeft(first, t0 + 100_000)).toBe(500);
    const afterRefresh = deadlineFromRemaining(500, t0 + 100_000)!;
    expect(secondsLeft(afterRefresh, t0 + 100_000)).toBe(500);
  });

  it("never goes negative", () => {
    expect(secondsLeft(1_000, 99_999)).toBe(0);
  });

  it("Practice shows NO timer; Exam shows a countdown that turns low under 5 minutes", () => {
    expect(timerView("practice", 123_456, 0)).toEqual({ visible: false });
    expect(timerView("exam", null, 0)).toEqual({ visible: false });
    expect(timerView("exam", 3_600_000, 0)).toEqual({ visible: true, seconds: 3600, isLow: false });
    expect(timerView("exam", 299_000, 0)).toEqual({ visible: true, seconds: 299, isLow: true });
  });
});
