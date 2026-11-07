"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EyeOff, RotateCcw, Trash2 } from "lucide-react";
import { extractErrorMessage } from "@/lib/api/client";
import { adminListReports, adminModerate, type ReportReason, type ReportedContribution } from "@/lib/api/discussions";
import { relativeTime } from "@/lib/discussion/relativeTime";

type Tab = "open" | "actioned" | "dismissed";
const TABS: { id: Tab; label: string }[] = [
  { id: "open", label: "Needs review" },
  { id: "actioned", label: "Actioned" },
  { id: "dismissed", label: "Dismissed" },
];
const REASON: Record<ReportReason, string> = {
  spam: "Spam", abusive: "Abusive", inappropriate: "Inappropriate", wrong_info: "Wrong information", off_topic: "Off topic", other: "Other",
};

/** Reported contributions, newest report first. Hide / restore / delete — all existing admin roles. */
export default function DiscussionModerationClient() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("open");
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const reports = useQuery({
    queryKey: ["admin", "discussions", "reports", tab, page],
    queryFn: () => adminListReports(page, tab),
    placeholderData: keepPreviousData,
  });

  const act = useMutation({
    mutationFn: (v: { id: string; action: "hide" | "restore" | "delete" }) => adminModerate(v.id, v.action, notes[v.id]),
    onSuccess: async (_r, v) => {
      toast.success(v.action === "restore" ? "Restored — reports dismissed" : v.action === "hide" ? "Hidden" : "Deleted");
      await qc.invalidateQueries({ queryKey: ["admin", "discussions", "reports"] });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="font-serif text-2xl text-green-900">Discussion Moderation</h1>
        <p className="text-sm text-text-muted">
          Contributions that students reported. A contribution reported by several students is hidden automatically until you review it.
        </p>
      </header>

      <div role="group" aria-label="Report status" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => { setTab(t.id); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-green-600 ${
              tab === t.id ? "bg-green-800 text-white" : "border border-cream-border bg-white text-green-800 hover:bg-cream"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {reports.isLoading && <p role="status" className="text-sm text-text-muted">Loading reports…</p>}
      {reports.isError && <p role="alert" className="text-sm text-red-700">Couldn&apos;t load reports.</p>}
      {reports.data?.data.length === 0 && (
        <p className="rounded-xl border border-dashed border-cream-border p-8 text-center text-sm text-text-muted">Nothing here. 🎉</p>
      )}

      <ul className="space-y-3">
        {reports.data?.data.map((r: ReportedContribution) => (
          <li key={r.contributionId} className="rounded-2xl border border-cream-border bg-white p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <span className="font-semibold text-green-900">{r.author?.displayName ?? "Former student"}</span>
              <span>· {r.isReply ? "reply" : "contribution"} · {relativeTime(r.createdAt)}</span>
              <span className={`rounded-full px-2 py-0.5 font-bold ${r.status === "visible" ? "bg-green-500/15 text-green-800" : "bg-gold/20 text-gold-dark"}`}>{r.status}</span>
              <span className="ml-auto font-bold text-red-700">{r.reportCount} {r.reportCount === 1 ? "report" : "reports"}</span>
            </div>

            <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-cream p-3 text-sm text-green-900">{r.content}</p>
            {r.imageUrls.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {r.imageUrls.map((u, i) => (
                  <li key={u}>
                    <a href={u} target="_blank" rel="noopener noreferrer" aria-label={`Open attached image ${i + 1} in a new tab`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt={`Attached image ${i + 1}`} className="h-20 w-20 rounded-lg border border-cream-border object-cover" />
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <ul className="mt-3 space-y-1 text-xs text-text-muted" aria-label="Reasons given">
              {r.reports.map((rep, i) => (
                <li key={i}><strong className="text-green-900">{REASON[rep.reason]}</strong>{rep.details ? ` — ${rep.details}` : ""}</li>
              ))}
            </ul>

            {tab === "open" && (
              <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-cream-border pt-3">
                <div className="min-w-[14rem] flex-1">
                  <label htmlFor={`note-${r.contributionId}`} className="mb-1 block text-xs font-semibold text-green-900">Note (optional)</label>
                  <input
                    id={`note-${r.contributionId}`}
                    value={notes[r.contributionId] ?? ""}
                    maxLength={200}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.contributionId]: e.target.value }))}
                    className="w-full rounded-lg border border-cream-border bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-green-600"
                  />
                </div>
                <button type="button" disabled={act.isPending} onClick={() => act.mutate({ id: r.contributionId, action: "restore" })}
                  className="inline-flex items-center gap-1.5 rounded-full border border-green-800 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50 disabled:opacity-50">
                  <RotateCcw size={14} aria-hidden="true" /> Keep (dismiss reports)
                </button>
                {r.status === "visible" && (
                  <button type="button" disabled={act.isPending} onClick={() => act.mutate({ id: r.contributionId, action: "hide" })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold-dark px-4 py-2 text-sm font-semibold text-gold-dark hover:bg-gold/10 disabled:opacity-50">
                    <EyeOff size={14} aria-hidden="true" /> Hide
                  </button>
                )}
                <button type="button" disabled={act.isPending}
                  onClick={() => { if (window.confirm("Delete this contribution? Its replies will stay.")) act.mutate({ id: r.contributionId, action: "delete" }); }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50">
                  <Trash2 size={14} aria-hidden="true" /> Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {reports.data && reports.data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full border border-green-800 px-4 py-1.5 font-semibold text-green-800 disabled:opacity-40">Previous</button>
          <span className="text-text-muted">Page {reports.data.meta.page} of {reports.data.meta.totalPages}</span>
          <button type="button" disabled={page >= reports.data.meta.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-full border border-green-800 px-4 py-1.5 font-semibold text-green-800 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
