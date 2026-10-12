"use client";

import { Users, Mail, Bell, Clock } from "lucide-react";
import type { Broadcast } from "../types";
import { BROADCAST_STATUS_CONFIG } from "../broadcastconstants";

interface Props {
  broadcasts: Broadcast[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function audienceLabel(b: Broadcast) {
  if (b.audience.type === "all") return "All users";
  if (b.audience.type === "specific") return `${b.audience.userIds?.length ?? 0} specific users`;
  const parts = [
    b.audience.tier ? `${b.audience.tier} tier` : null,
    b.audience.examType || null,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "Segment";
}

export function BroadcastHistory({ broadcasts }: Props) {
  if (broadcasts.length === 0) {
    return (
      <div className="text-center py-16 text-text-muted text-[14px]">
        No broadcasts sent yet. Compose one above to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {broadcasts.map((b) => {
        const statusCfg = BROADCAST_STATUS_CONFIG[b.status];
        return (
          <div key={b.id} className="p-4 rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-medium text-[14px] text-green-900">{b.title}</h3>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: statusCfg.color, background: statusCfg.bg }}>
                    {statusCfg.label.toUpperCase()}
                  </span>
                </div>
                <p className="text-[13px] text-text-muted line-clamp-2">{b.body}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap mt-3 text-[12px] text-text-muted">
              <span className="flex items-center gap-1">
                {b.channel === "email" ? (
                  <Mail size={13} />
                ) : b.channel === "both" ? (
                  <>
                    <Bell size={13} />
                    <Mail size={13} />
                  </>
                ) : (
                  <Bell size={13} />
                )}
                {b.channel === "both"
                  ? "In-app + Email"
                  : b.channel === "email"
                    ? "Email"
                    : "In-app"}
              </span>
              <span className="flex items-center gap-1">
                <Users size={13} /> {audienceLabel(b)} · {b.recipientCount.toLocaleString()}{" "}
                recipients
              </span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {b.scheduledFor && b.status === "queued"
                  ? `Scheduled for ${formatDate(b.scheduledFor)}`
                  : formatDate(b.createdAt)}
              </span>
              {typeof b.openRate === "number" && (
                <span>{Math.round(b.openRate * 100)}% open rate</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
