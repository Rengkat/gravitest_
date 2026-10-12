"use client";

import { useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";
import type { Notification } from "./types";

/**
 * Shares ONE SSE connection per access token across every caller in this
 * tab (the header bell, the notifications list page, etc.).
 *
 * The backend's NotificationEventsEmitter multicasts each event to every
 * open connection for a user (intentional, for multi-tab support) — but
 * if this tab alone opens two connections (e.g. the bell in the layout
 * AND the notifications page are both mounted at once), every event is
 * delivered twice in THIS tab. Fanning out locally to any number of
 * `useNotificationStream` callers from a single shared connection fixes
 * that without touching the backend's multi-tab behaviour.
 */

type Listener = (notification: Notification) => void;

interface SharedStream {
  source: EventSource;
  listeners: Set<Listener>;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  backoffMs: number;
  closedByUs: boolean;
}

const streams = new Map<string, SharedStream>();

function parseEvent(raw: string): Notification | null {
  try {
    const event = JSON.parse(raw) as {
      notificationId: string;
      type: Notification["type"];
      channel: Notification["channel"];
      title: string;
      body: string;
      actionUrl: string | null;
      metadata: Record<string, unknown> | null;
      createdAt: string;
    };
    // The SSE payload is the raw NotificationEvent (see
    // src/notifications/types/notification.types.ts on the backend) —
    // flat, and missing status/readAt/updatedAt since a freshly pushed
    // notification is always unread. Fill those in here.
    return {
      id: event.notificationId,
      type: event.type,
      channel: event.channel,
      status: "unread",
      title: event.title,
      body: event.body,
      actionUrl: event.actionUrl,
      metadata: event.metadata,
      createdAt: event.createdAt,
      updatedAt: event.createdAt,
      readAt: null,
    };
  } catch {
    return null; // ignore malformed events rather than crash the stream handler
  }
}

function openStream(token: string): SharedStream {
  const shared: SharedStream = {
    source: null as unknown as EventSource,
    listeners: new Set(),
    reconnectTimer: null,
    backoffMs: 2000,
    closedByUs: false,
  };

  const connect = () => {
    const url = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);
    shared.source = source;

    source.addEventListener("notification", (e: MessageEvent) => {
      const notification = parseEvent(e.data);
      if (!notification) return;
      shared.listeners.forEach((listener) => listener(notification));
    });

    source.onopen = () => {
      shared.backoffMs = 2000; // reset backoff once a connection succeeds
    };

    source.onerror = () => {
      source.close();
      if (shared.closedByUs) return;
      shared.reconnectTimer = setTimeout(connect, shared.backoffMs);
      shared.backoffMs = Math.min(shared.backoffMs * 2, 30000); // cap at 30s
    };
  };

  connect();
  return shared;
}

function subscribe(token: string, listener: Listener): () => void {
  let shared = streams.get(token);
  if (!shared) {
    shared = openStream(token);
    streams.set(token, shared);
  }
  shared.listeners.add(listener);

  return () => {
    const current = streams.get(token);
    if (!current) return;
    current.listeners.delete(listener);
    if (current.listeners.size === 0) {
      current.closedByUs = true;
      if (current.reconnectTimer) clearTimeout(current.reconnectTimer);
      current.source?.close();
      streams.delete(token);
    }
  };
}

export function useNotificationStream(onEvent: (notification: Notification) => void) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!accessToken) return;
    const listener: Listener = (n) => onEventRef.current(n);
    return subscribe(accessToken, listener);
  }, [accessToken]);
}
