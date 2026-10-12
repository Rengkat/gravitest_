"use client";

import { Info, Loader2, Mail, Send, Shield, X, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import * as adminInvitesApi from "@/lib/api/admin-invites";
import { extractErrorMessage } from "@/lib/api/client";
import { toNigerianE164 } from "@/utils/registerUtils";

interface InviteAdminProps {
  onClose: () => void;
  onInvite: () => void;
}

// Sends a real, one-time invite link (POST /admin/invites). The invitee
// clicks it, lands on /admin-onboarding, and sets their own password —
// no temporary password ever changes hands.
export function InviteAdminModal({ onClose, onInvite }: InviteAdminProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "admin" as "admin" | "super_admin",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<adminInvitesApi.AdminInvite | null>(null);

  async function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.email) return;

    let phoneNumber: string | undefined;
    if (form.phoneNumber.trim()) {
      const normalized = toNigerianE164(form.phoneNumber.trim());
      if (!normalized) {
        setError("Enter a valid Nigerian number, e.g. 0801 234 5678");
        return;
      }
      phoneNumber = normalized;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await adminInvitesApi.createAdminInvite({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber,
        role: form.role,
      });
      setResult(res);
      onInvite();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all";

  if (result) {
    const expiryDate = new Date(result.expiresAt).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-green-600" />
          </div>
          <h3 className="font-serif text-xl text-green-900 text-center mb-2">Invite Sent</h3>
          <p className="text-[13px] text-text-muted text-center mb-4">
            {result.firstName} {result.lastName} ({result.email}) has been emailed a link to join as{" "}
            {result.role === "super_admin" ? "a Super Admin" : "an Admin"}. The link expires on{" "}
            {expiryDate}.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-green-800 text-white font-semibold hover:bg-green-700 transition-all text-[14px]">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <Mail size={20} className="text-green-700" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-green-900">Invite Admin</h3>
              <p className="text-xs text-text-muted">Send a secure invite link to join the admin team</p>
            </div>
          </div>
          <button title="Close" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-green-900 mb-1.5">First Name *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="e.g., Adebayo"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-green-900 mb-1.5">Last Name *</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="e.g., Okonkwo"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-green-900 mb-1.5">Email Address *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@example.com"
              className={inputCls}
            />
            <p className="text-xs text-text-muted mt-1">Their invite link will be sent here</p>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-green-900 mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="0801 234 5678"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-green-900 mb-1.5">Admin Role *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "admin" })}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                  form.role === "admin" ? "border-green-800 bg-green-50" : "border-gray-200 hover:border-green-800/30"
                }`}>
                <Shield size={16} className="text-green-700" />
                <span className="text-[12px] font-semibold text-green-900">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: "super_admin" })}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                  form.role === "super_admin"
                    ? "border-green-800 bg-green-50"
                    : "border-gray-200 hover:border-green-800/30"
                }`}>
                <Shield size={16} className="text-green-700" />
                <span className="text-[12px] font-semibold text-green-900">Super Admin</span>
              </button>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-green-600 mt-0.5" />
              <div>
                <p className="text-xs text-green-800 font-medium">What happens next?</p>
                <p className="text-xs text-green-700">
                  They'll get an email with a secure link, valid for 3 days. Opening it lets them set their
                  own password and activate the account — nothing is created until they do.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-[14px] font-semibold text-text-muted hover:bg-gray-50 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.firstName || !form.lastName || !form.email || submitting}
            className="flex-1 py-3 rounded-xl bg-green-800 text-white font-semibold hover:bg-green-700 transition-all text-[14px] disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send size={16} />
                Send Invite
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
