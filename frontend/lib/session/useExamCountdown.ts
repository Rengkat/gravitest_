"use client";

import { useEffect, useRef, useState } from "react";
import { secondsLeft } from "./examClock";

/**
 * Drives the Exam-mode countdown from an absolute deadline. Returns null when
 * there is no deadline (Practice), so callers render no timer and run no
 * interval. `onExpire` fires AT MOST ONCE per deadline, even under re-renders,
 * strict-mode double effects or a late tab wake-up.
 */
export function useExamCountdown(
  deadlineMs: number | null,
  active: boolean,
  onExpire: () => void,
): number | null {
  const [remaining, setRemaining] = useState<number | null>(
    deadlineMs === null ? null : secondsLeft(deadlineMs, Date.now()),
  );
  const firedFor = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (deadlineMs === null || !active) return;
    const tick = () => {
      const left = secondsLeft(deadlineMs, Date.now());
      setRemaining(left);
      if (left <= 0 && firedFor.current !== deadlineMs) {
        firedFor.current = deadlineMs;
        onExpireRef.current();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    // A backgrounded tab throttles timers; re-check the moment it is visible again.
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [deadlineMs, active]);

  return deadlineMs === null ? null : remaining;
}
