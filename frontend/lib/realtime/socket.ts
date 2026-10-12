import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";

// The backend's RealtimeGateway (src/realtime/realtime.gateway.ts) lives at
// the '/realtime' Socket.IO namespace on the *bare* API host — Nest's
// global REST prefix ('/api/v1') doesn't apply to WebSocket gateways, so we
// strip the path off API_BASE_URL rather than reusing it as-is.
function realtimeOrigin(): string {
  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return API_BASE_URL;
  }
}

let socket: Socket | null = null;
let refCount = 0;

/**
 * Acquires a reference to the shared realtime socket, lazily connecting on
 * first use. Every caller MUST pair this with releaseRealtimeSocket() (see
 * useLeaderboardRealtime) — the underlying connection is torn down once the
 * last consumer releases it, so idle pages don't hold a websocket open.
 * Returns null during SSR or when logged out (no token to authenticate with).
 */
export function acquireRealtimeSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  refCount += 1;

  if (!socket) {
    socket = io(`${realtimeOrigin()}/realtime`, {
      auth: { token },
      transports: ["websocket"],
    });
  } else if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  }
  return socket;
}

export function releaseRealtimeSocket(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && socket) {
    socket.disconnect();
    socket = null;
  }
}

// If the user logs out (access token cleared) while a leaderboard page is
// still mounted, drop the socket immediately rather than waiting for the
// consumer to unmount — a logged-out session has nothing valid to
// authenticate the connection with, and the server would reject it anyway.
if (typeof window !== "undefined") {
  useAuthStore.subscribe((state, prevState) => {
    if (prevState.accessToken && !state.accessToken && socket) {
      socket.disconnect();
      socket = null;
      refCount = 0;
    }
  });
}
