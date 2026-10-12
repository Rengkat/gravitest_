"use client";

import { useEffect, useRef } from "react";
import { acquireRealtimeSocket, releaseRealtimeSocket } from "@/lib/realtime/socket";

/**
 * Joins the realtime leaderboard room(s) for `scopes` and calls `onUpdate`
 * whenever the backend pushes a `leaderboard:update` event (fired by
 * LeaderboardService after a recalculation or a month-end finalization —
 * see RealtimeGateway.emitLeaderboardUpdate on the backend).
 *
 * Always joins the 'general' room in addition to whatever is passed in:
 * a recalculation recomputes every scope's underlying data in one pass, so
 * 'general' firing is a reliable "something changed, you may want to
 * refetch" signal even for a category/exam-type view the backend doesn't
 * emit a dedicated room for (exam-type rooms aren't emitted to today).
 *
 * `onUpdate` fires at most once per ~300ms even if multiple rooms fire
 * back-to-back for the same recalculation pass.
 *
 * Pass `enabled: false` to skip connecting entirely — e.g. a finalized
 * past period will never change, so there's nothing to subscribe to.
 */
export function useLeaderboardRealtime(
  scopes: (string | null | undefined)[],
  onUpdate: () => void,
  enabled = true,
): void {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const roomsKey = Array.from(new Set(["general", ...scopes.filter(Boolean)])).join("|");

  useEffect(() => {
    if (!enabled) return;
    const socket = acquireRealtimeSocket();
    if (!socket) return;

    const rooms = roomsKey.split("|");
    rooms.forEach((room) => socket.emit("leaderboard:join", { scope: room }));

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const handleUpdate = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => onUpdateRef.current(), 300);
    };
    socket.on("leaderboard:update", handleUpdate);

    return () => {
      if (debounce) clearTimeout(debounce);
      socket.off("leaderboard:update", handleUpdate);
      releaseRealtimeSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomsKey, enabled]);
}
