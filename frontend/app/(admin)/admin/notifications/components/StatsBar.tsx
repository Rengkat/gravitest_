"use client";

import { Bell, Clock, AlertTriangle, CheckCircle, Archive } from "lucide-react";
import type { AdminNotificationCounts, NotificationFilter } from "../types";

interface Props {
  counts: AdminNotificationCounts;
  activeFilter: NotificationFilter;
  onFilterChange: (f: NotificationFilter) => void;
}

export function StatsBar({ counts, activeFilter, onFilterChange }: Props) {
  const tiles = [
    {
      filter: "all" as NotificationFilter,
      icon: Bell,
      label: "Total",
      count: counts.total,
      color: "#3b82f6",
      bg: "#dbeafe",
    },
    {
      filter: "unread" as NotificationFilter,
      icon: Clock,
      label: "Unread",
      count: counts.unread,
      color: "#f97316",
      bg: "#ffedd5",
    },
    {
      filter: "high" as NotificationFilter,
      icon: AlertTriangle,
      label: "Urgent",
      count: counts.highPriority,
      color: "#ef4444",
      bg: "#fee2e2",
    },
    {
      filter: "read" as NotificationFilter,
      icon: CheckCircle,
      label: "Resolved",
      count: counts.resolved,
      color: "#10b981",
      bg: "#d1fae5",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {tiles.map(({ filter, icon: Icon, label, count, color, bg }) => {
        const active = activeFilter === filter;
        return (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`p-4 rounded-2xl border text-center transition-all hover:-translate-y-0.5 hover:shadow-md ${
              active ? "ring-2 ring-offset-1" : ""
            }`}
            style={{
              background: active ? bg : "#fff",
              borderColor: active ? color : "rgba(30,80,50,0.08)",
              // @ts-ignore ring-color via style
              "--tw-ring-color": color,
            }}>
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <Icon size={16} style={{ color }} />
              <span className="text-[12px] font-medium text-gray-500">{label}</span>
            </div>
            <div className="text-[28px] font-bold leading-none" style={{ color }}>
              {count}
            </div>
            {filter === "high" && count > 0 && (
              <span className="mt-1.5 inline-block text-[9px] font-bold text-red-500 animate-pulse">
                NEEDS ATTENTION
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
