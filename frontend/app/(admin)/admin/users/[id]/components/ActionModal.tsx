"use client";

import { useState } from "react";
import { X, Loader2, AlertTriangle, Copy, CheckCircle2 } from "lucide-react";
import type { AdminActionType, EditUserFormData } from "../types";
import type { ResetPasswordFormData } from "../useUserDetail";
import { ROLE_CONFIG } from "../../constants";
import { NIGERIAN_STATES } from "@/lib/constants/profile";
import type { UserRole } from "../../types";

interface Props {
  action: AdminActionType;
  userName: string;
  loading: boolean;
  error: string | null;
  reasonInput: string;
  setReasonInput: (v: string) => void;
  editForm: EditUserFormData | null;
  setEditForm: (d: EditUserFormData) => void;
  resetForm: ResetPasswordFormData;
  setResetForm: (d: ResetPasswordFormData) => void;
  lastGeneratedPassword: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const TITLES: Record<AdminActionType, string> = {
  deactivate: "Deactivate Account",
  reactivate: "Reactivate Account",
  edit: "Edit User Profile",
  reset_password: "Reset Password",
  verify_email: "Force-Verify Email",
};

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all";

export function ActionModal({
  action,
  userName,
  loading,
  error,
  reasonInput,
  setReasonInput,
  editForm,
  setEditForm,
  resetForm,
  setResetForm,
  lastGeneratedPassword,
  onConfirm,
  onCancel,
}: Props) {
  const [copied, setCopied] = useState(false);

  // Reset-password success state — show the generated password once,
  // inline, rather than closing the modal silently.
  if (action === "reset_password" && lastGeneratedPassword) {
    return (
      <Modal title="Password Reset" onClose={onCancel}>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-4">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1">
            New Temporary Password
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-[13px] text-amber-900 bg-white px-3 py-2 rounded-lg border border-amber-200">
              {lastGeneratedPassword}
            </code>
            <button
              title="copy"
              onClick={() => {
                navigator.clipboard.writeText(lastGeneratedPassword);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-2 rounded-lg hover:bg-amber-100 transition-colors">
              {copied ? <CheckCircle2 size={16} className="text-green-600" /> : <Copy size={16} className="text-amber-700" />}
            </button>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-xl bg-green-800 text-white font-semibold hover:bg-green-700 transition-all text-[14px]">
          Done
        </button>
      </Modal>
    );
  }

  return (
    <Modal title={TITLES[action]} onClose={onCancel}>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600 font-medium flex items-start gap-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {action === "deactivate" && (
        <div className="mb-6">
          <p className="text-[14px] text-text-muted mb-4">
            This will sign <strong>{userName}</strong> out and block them from logging in until
            reactivated.
          </p>
          <label className="block text-[12px] font-semibold text-green-900 mb-1.5">
            Reason (optional)
          </label>
          <textarea
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            placeholder="e.g., Terms of service violation"
            rows={3}
            className={inputCls}
          />
        </div>
      )}

      {action === "reactivate" && (
        <p className="text-[14px] text-text-muted mb-6">
          This restores login access for <strong>{userName}</strong> immediately.
        </p>
      )}

      {action === "verify_email" && (
        <p className="text-[14px] text-text-muted mb-6">
          This marks <strong>{userName}</strong>&apos;s email as verified without requiring them to
          confirm an OTP.
        </p>
      )}

      {action === "reset_password" && (
        <div className="mb-6 space-y-4">
          <p className="text-[14px] text-text-muted">
            Leave the password blank to auto-generate a secure temporary one.
          </p>
          <div>
            <label className="block text-[12px] font-semibold text-green-900 mb-1.5">
              New Password (optional)
            </label>
            <input
              type="text"
              value={resetForm.newPassword}
              onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
              placeholder="Leave blank to auto-generate"
              className={inputCls}
            />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-text-muted">
            <input
              type="checkbox"
              checked={resetForm.notifyUser}
              onChange={(e) => setResetForm({ ...resetForm, notifyUser: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-green-800"
            />
            Email the user their new password
          </label>
        </div>
      )}

      {action === "edit" && editForm && (
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-green-900 mb-1.5">First Name</label>
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-green-900 mb-1.5">Last Name</label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-green-900 mb-1.5">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-green-900 mb-1.5">Phone</label>
            <input
              type="tel"
              value={editForm.phoneNumber}
              onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-green-900 mb-1.5">Role</label>
              <select
                title="role"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className={inputCls}>
                {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_CONFIG[r].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-green-900 mb-1.5">State</label>
              <select
                title="state"
                value={editForm.stateOfResidence}
                onChange={(e) => setEditForm({ ...editForm, stateOfResidence: e.target.value })}
                className={inputCls}>
                <option value="">Not set</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-[13px] text-text-muted">
              <input
                type="checkbox"
                checked={editForm.isEmailVerified}
                onChange={(e) => setEditForm({ ...editForm, isEmailVerified: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-green-800"
              />
              Email verified
            </label>
            <label className="flex items-center gap-2 text-[13px] text-text-muted">
              <input
                type="checkbox"
                checked={editForm.isPhoneVerified}
                onChange={(e) => setEditForm({ ...editForm, isPhoneVerified: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-green-800"
              />
              Phone verified
            </label>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-[14px] font-semibold text-text-muted hover:bg-gray-50 transition-all disabled:opacity-50">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 py-3 rounded-xl font-semibold text-[14px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
            action === "deactivate" ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-800 text-white hover:bg-green-700"
          }`}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Working…" : "Confirm"}
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-xl text-green-900">{title}</h3>
          <button title="close" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
