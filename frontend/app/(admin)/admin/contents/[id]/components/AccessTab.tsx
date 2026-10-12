"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, Shield, CheckCircle2, XCircle, Clock, Loader2, Trash2, Info } from "lucide-react";
import type { ContentItem } from "@/types/admin-contents";
import { ACCESS_LEVELS } from "@/lib/constants/contents";
import * as libraryApi from "@/lib/api/library";
import type { ContentAccessRecord } from "@/lib/api/library";
import { extractErrorMessage } from "@/lib/api/client";

export function AccessTab({ item }: { item: ContentItem }) {
  const accessCfg = ACCESS_LEVELS[item.accessLevel];
  const AccessIcon = accessCfg.icon;

  const [records, setRecords] = useState<ContentAccessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRecords(await libraryApi.listContentAccess(item.id));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [item.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRevoke = async (userId: string, recordId: string) => {
    setRevokingId(recordId);
    try {
      await libraryApi.revokeContentAccess(item.id, userId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Current access model */}
      <div
        className="rounded-2xl bg-white border p-5"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-4">
          Access Model
        </h2>
        <div className="flex items-start gap-4 flex-wrap">
          <div
            className="flex items-center gap-3 p-3 rounded-xl flex-1 min-w-[160px]"
            style={{ background: accessCfg.bg }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${accessCfg.color}20` }}>
              <AccessIcon size={18} style={{ color: accessCfg.color }} />
            </div>
            <div>
              <div className="text-[14px] font-bold" style={{ color: accessCfg.color }}>
                {accessCfg.label}
              </div>
              <div className="text-[11px] text-text-muted">
                {item.isFree
                  ? "All users can access for free"
                  : item.price > 0
                    ? `₦${item.price.toLocaleString()} one-time purchase`
                    : "Subscription required"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {[
              {
                icon: item.drmProtected ? Shield : Globe,
                label: item.drmProtected ? "DRM Protected" : "No DRM",
                ok: item.drmProtected,
              },
              {
                icon: item.isDownloadable ? CheckCircle2 : XCircle,
                label: item.isDownloadable ? "Downloadable" : "Streaming only",
                ok: item.isDownloadable,
              },
              {
                icon: item.isVerified ? CheckCircle2 : Clock,
                label: item.isVerified ? "Verified content" : "Pending verification",
                ok: item.isVerified,
              },
            ].map(({ icon: Icon, label, ok }) => (
              <div key={label} className="flex items-center gap-2 text-[12px]">
                <Icon size={14} className={ok ? "text-green-600" : "text-text-muted"} />
                <span className={ok ? "text-green-900 font-medium" : "text-text-muted"}>{label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-2 pl-4 border-l border-gray-100">
            {[
              { label: "Total Accesses", value: (item.views + item.downloads).toLocaleString() },
              { label: "Unique Downloaders", value: item.downloads.toLocaleString() },
              {
                label: "Revenue Generated",
                value: item.revenue > 0 ? `₦${item.revenue.toLocaleString()}` : "—",
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  {label}
                </div>
                <div className="text-[14px] font-bold text-green-900">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Access records — purchased or manually granted only. Subscription
          tier access is checked live (checkAccess) and never written to a
          LibraryAccess row, so subscribers who can view this content via
          their plan simply won't appear in this list. */}
      <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Purchased / Granted Access
          </h2>
          {!loading && <span className="text-[11px] text-text-muted">{records.length} users</span>}
        </div>

        <div className="px-5 py-2.5 border-b bg-blue-50/50 flex items-start gap-2" style={{ borderColor: "rgba(30,80,50,0.06)" }}>
          <Info size={12} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-700">
            Only purchased or manually-granted access shows here. Users who can open this via their
            subscription tier alone don't get a row — that check happens live, not from a stored record.
          </p>
        </div>

        {error && (
          <div className="px-5 py-3 text-[12px] text-red-600 bg-red-50 border-b" style={{ borderColor: "rgba(30,80,50,0.06)" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={22} className="animate-spin text-green-700" />
          </div>
        ) : records.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-text-muted">
            No purchases or manual grants yet.
          </div>
        ) : (
          <div className="overflow-x-auto" role="region" aria-label="Access log" tabIndex={0}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(30,80,50,0.08)", background: "#f8faf8" }}>
                  {["User", "Email", "Granted", "Reason", "Status", ""].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-text-muted whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => (
                  <tr
                    key={rec.id}
                    className={`hover:bg-cream/30 transition-colors ${i < records.length - 1 ? "border-b" : ""}`}
                    style={{ borderColor: "rgba(30,80,50,0.06)" }}>
                    <td className="px-4 py-3 font-semibold text-green-900">{rec.userName}</td>
                    <td className="px-4 py-3 text-text-muted">{rec.userEmail}</td>
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {new Date(rec.grantedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                        {rec.paymentId ? "Purchase" : "Manually granted"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          background: rec.isExpired ? "#ef444415" : "#10b98115",
                          color: rec.isExpired ? "#ef4444" : "#10b981",
                        }}>
                        {rec.isExpired ? "expired" : "active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRevoke(rec.userId, rec.id)}
                        disabled={revokingId === rec.id}
                        title="Revoke access"
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                        {revokingId === rec.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
