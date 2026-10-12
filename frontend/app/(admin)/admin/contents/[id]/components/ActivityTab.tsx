"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Upload,
  Edit,
  Globe,
  EyeOff,
  Trash2,
  Lock,
  UserPlus,
  UserMinus,
  Loader2,
} from "lucide-react";
import * as libraryApi from "@/lib/api/library";
import type { ContentAuditLogEntry, ContentAuditAction } from "@/lib/api/library";
import { extractErrorMessage } from "@/lib/api/client";

const ACTION_META: Record<ContentAuditAction, { icon: any; color: string }> = {
  uploaded: { icon: Upload, color: "#3b82f6" },
  edited: { icon: Edit, color: "#f59e0b" },
  published: { icon: Globe, color: "#10b981" },
  unpublished: { icon: EyeOff, color: "#6b7280" },
  deleted: { icon: Trash2, color: "#ef4444" },
  access_granted: { icon: UserPlus, color: "#10b981" },
  access_revoked: { icon: UserMinus, color: "#ef4444" },
  price_changed: { icon: Lock, color: "#f59e0b" },
};

function fmt(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function ActivityTab({ contentId }: { contentId: string }) {
  const [log, setLog] = useState<ContentAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLog(await libraryApi.listContentActivity(contentId));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rounded-2xl bg-white border p-5" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-5">
        Audit Log
      </h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={22} className="animate-spin text-green-700" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-[12px] text-red-600">{error}</p>
          <button
            onClick={load}
            className="px-3 py-1.5 rounded-lg bg-green-700 text-white text-[12px] font-medium hover:bg-green-800">
            Try again
          </button>
        </div>
      ) : log.length === 0 ? (
        <div className="py-8 text-center text-[13px] text-text-muted">
          No activity recorded yet — actions taken on this content (edits, publish/unpublish,
          access grants) will show up here.
        </div>
      ) : (
        <ol aria-label="Content activity log">
          {log.map((entry, i) => {
            const meta = ACTION_META[entry.action];
            const Icon = meta.icon;
            const { date, time } = fmt(entry.createdAt);
            return (
              <li key={entry.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm"
                    style={{ background: `${meta.color}15` }}>
                    <Icon size={14} style={{ color: meta.color }} />
                  </div>
                  {i < log.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                </div>
                <div className="pb-4 flex-1 min-w-0 pt-1">
                  <p className="text-[13px] font-medium text-green-900 leading-snug mb-0.5">
                    {entry.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                    <time dateTime={entry.createdAt}>
                      {date} · {time}
                    </time>
                    <span className="bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                      {entry.performedByName ?? "System"}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
