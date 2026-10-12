"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronDown, ChevronUp, Clock, Loader2, Mail, ShieldAlert, X } from "lucide-react";
import * as adminInvitesApi from "@/lib/api/admin-invites";
import { extractErrorMessage } from "@/lib/api/client";

const STATUS_STYLES: Record<adminInvitesApi.AdminInviteStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-green-50 text-green-700 border-green-200",
  revoked: "bg-gray-100 text-gray-500 border-gray-200",
  expired: "bg-red-50 text-red-500 border-red-200",
};

// Invites don't show up anywhere else — an invite doesn't create a User
// row until it's accepted — so this is the only place a super admin can
// see who's been invited, who hasn't responded yet, and revoke a stale one.
export function PendingInvitesPanel({ refreshKey }: { refreshKey: number }) {
  const [invites, setInvites] = useState<adminInvitesApi.AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminInvitesApi
      .listAdminInvites()
      .then(setInvites)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function handleRevoke(id: string) {
    setRevokingId(id);
    try {
      await adminInvitesApi.revokeAdminInvite(id);
      setInvites((prev) => prev.map((i) => (i.id === id ? { ...i, status: "revoked" } : i)));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setRevokingId(null);
    }
  }

  const pendingCount = invites.filter((i) => i.status === "pending").length;

  if (loading) return null;
  if (error) return null; // non-critical — don't block the users page over this
  if (invites.length === 0) return null;

  const visible = expanded ? invites : invites.slice(0, pendingCount > 0 ? pendingCount : 3);

  return (
    <div className="mb-6 rounded-2xl border border-amber-200/60 bg-amber-50/40 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-amber-600" />
          <span className="text-[13px] font-semibold text-green-900">
            Admin Invites{pendingCount > 0 ? ` — ${pendingCount} pending` : ""}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-green-700/50" />
        ) : (
          <ChevronDown size={16} className="text-green-700/50" />
        )}
      </button>

      {(expanded || pendingCount > 0) && (
        <div className="px-4 pb-4 space-y-2">
          {visible.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-green-900 truncate">
                  {invite.firstName} {invite.lastName}{" "}
                  <span className="text-text-muted font-normal">· {invite.email}</span>
                </p>
                <p className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                  <Clock size={11} />
                  {invite.status === "pending"
                    ? `Expires ${new Date(invite.expiresAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`
                    : `Invited by ${invite.invitedByName ?? "—"}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full border ${STATUS_STYLES[invite.status]}`}>
                  {invite.status}
                </span>
                {invite.status === "pending" && (
                  <button
                    title="Revoke invite"
                    onClick={() => handleRevoke(invite.id)}
                    disabled={revokingId === invite.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50">
                    {revokingId === invite.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <X size={13} />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {!expanded && invites.length > visible.length && (
            <button
              onClick={() => setExpanded(true)}
              className="text-[12px] font-medium text-green-700 bg-transparent border-none cursor-pointer hover:underline">
              Show {invites.length - visible.length} more
            </button>
          )}

          {pendingCount === 0 && (
            <p className="text-[11px] text-text-muted flex items-center gap-1">
              <ShieldAlert size={11} /> No pending invites right now.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
