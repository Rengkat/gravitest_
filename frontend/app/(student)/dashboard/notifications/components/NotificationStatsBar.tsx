"use client";

import { Bell, CheckCircle, Archive } from "lucide-react";
import type { NotificationCounts, NotificationFilter } from "../types";

interface Props {
  counts: NotificationCounts;
  activeFilter: NotificationFilter;
  onFilterChange: (f: NotificationFilter) => void;
}

export function NotificationStatsBar({ counts, activeFilter, onFilterChange }: Props) {
  const cards = [
    {
      filter: "unread" as NotificationFilter,
      icon: Bell,
      label: "Unread",
      count: counts.unread,
      color: "#3b82f6",
      bg: "#dbeafe",
    },
    {
      filter: "read" as NotificationFilter,
      icon: CheckCircle,
      label: "Read",
      count: counts.read,
      color: "#10b981",
      bg: "#d1fae5",
    },
    {
      filter: "archived" as NotificationFilter,
      icon: Archive,
      label: "Archived",
      count: counts.archived,
      color: "#6b7280",
      bg: "#f3f4f6",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {cards.map(({ filter, icon: Icon, label, count, color, bg }) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`p-4 rounded-2xl border text-center transition-all hover:-translate-y-0.5 hover:shadow-md ${
            activeFilter === filter ? "ring-2 ring-offset-1" : ""
          }`}
          style={{
            borderColor: activeFilter === filter ? color : "rgba(30,80,50,0.08)",
            background: activeFilter === filter ? bg : "#fff",
            // ringColor: color,
          }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Icon size={16} style={{ color }} />
            <span className="text-[12px] text-gray-500 font-medium">{label}</span>
          </div>
          <div className="text-[26px] font-bold" style={{ color }}>
            {count}
          </div>
        </button>
      ))}
    </div>
  );
}
