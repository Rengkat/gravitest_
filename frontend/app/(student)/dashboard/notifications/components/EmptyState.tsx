"use client";

import { Bell, CheckCircle, Archive, Filter } from "lucide-react";
import type { NotificationFilter } from "../types";

const EMPTY_STATE_COPY: Record<NotificationFilter, { icon: any; title: string; body: string }> = {
  all: {
    icon: Bell,
    title: "You're all caught up!",
    body: "No new notifications right now. We'll let you know when something needs your attention.",
  },
  unread: {
    icon: CheckCircle,
    title: "No unread notifications",
    body: "Everything's been read. Check back later for new updates.",
  },
  read: {
    icon: Bell,
    title: "No read notifications",
    body: "Notifications you've opened will appear here.",
  },
  archived: {
    icon: Archive,
    title: "Archive is empty",
    body: "Notifications you archive will be stored here for reference.",
  },
};

export function EmptyState({
  filter,
  hasChannelFilter,
}: {
  filter: NotificationFilter;
  hasChannelFilter: boolean;
}) {
  const copy = EMPTY_STATE_COPY[filter];
  const Icon = copy.icon;

  return (
    <div
      className="text-center py-16 bg-white rounded-2xl border"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        {hasChannelFilter ? (
          <Filter size={28} className="text-gray-300" />
        ) : (
          <Icon size={28} className="text-gray-300" />
        )}
      </div>
      <h3 className="text-[17px] font-semibold text-gray-700 mb-1">
        {hasChannelFilter ? "No notifications for this channel" : copy.title}
      </h3>
      <p className="text-[13px] text-gray-400 max-w-xs mx-auto">
        {hasChannelFilter
          ? "Try switching to a different channel or clearing the channel filter."
          : copy.body}
      </p>
    </div>
  );
}
