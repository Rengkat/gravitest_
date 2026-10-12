"use client";

import { useState } from "react";
import { Check, X, UserCheck, UserX, Download, Loader2, Copy, CheckCircle2 } from "lucide-react";
import type { UserRole } from "../types";
import { ROLE_CONFIG } from "../constants";
import * as adminApi from "@/lib/api/admin-dashboard";
import { extractErrorMessage } from "@/lib/api/client";

// ─── BULK ACTIONS BAR ────────────────────────────────────────
// "Suspend" and "Delete" were dropped — the backend only has a single
// deactivate/reactivate state (DeactivationType records *why*, but
// there's no separate "suspended" status), and there's no hard-delete
// endpoint for other users' accounts, only self-deactivation.
interface BulkProps {
  count: number;
  onActivate: () => Promise<void>;
  onDeactivate: () => Promise<void>;
  onExport: () => void;
  onClear: () => void;
}

export function BulkActionsBar({ count, onActivate, onDeactivate, onExport, onClear }: BulkProps) {
  const [busy, setBusy] = useState<"activate" | "deactivate" | null>(null);

  async function run(action: "activate" | "deactivate", fn: () => Promise<void>) {
    setBusy(action);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mb-4 p-4 rounded-2xl bg-green-800 text-white flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <Check size={18} />
        <span className="text-[14px] font-semibold">
          {count} user{count > 1 ? "s" : ""} selected
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <BulkBtn
          Icon={busy === "activate" ? Loader2 : UserCheck}
          label="Reactivate"
          onClick={() => run("activate", onActivate)}
          disabled={busy !== null}
          spin={busy === "activate"}
        />
        <BulkBtn
          Icon={busy === "deactivate" ? Loader2 : UserX}
          label="Deactivate"
          onClick={() => run("deactivate", onDeactivate)}
          disabled={busy !== null}
          danger
          spin={busy === "deactivate"}
        />
        <BulkBtn Icon={Download} label="Export" onClick={onExport} disabled={busy !== null} />
        <button
          onClick={onClear}
          className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-[13px] font-medium">
          <X size={14} /> Clear
        </button>
      </div>
    </div>
  );
}

function BulkBtn({
  Icon,
  label,
  onClick,
  danger = false,
  disabled = false,
  spin = false,
}: {
  Icon: any;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  spin?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-[13px] font-medium disabled:opacity-50 ${
        danger ? "bg-red-500/30 hover:bg-red-500/50" : "bg-white/10 hover:bg-white/20"
      }`}>
      <Icon size={14} className={spin ? "animate-spin" : ""} />
      {label}
    </button>
  );
}

// ─── ADD USER MODAL ──────────────────────────────────────────
// Calls the real POST /users (super_admin only) — creates the account
// directly. If no password is set, the backend generates a temporary
// one and returns it here (or emails it, if "send welcome email" is on).
interface AddUserProps {
  onClose: () => void;
  onAdd: () => void;
}

export function AddUserModal({ onClose, onAdd }: AddUserProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "student" as UserRole,
    sendWelcomeEmail: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<adminApi.CreateUserResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.email) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await adminApi.createUser({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber || undefined,
        role: form.role,
        sendWelcomeEmail: form.sendWelcomeEmail,
      });
      setResult(res);
      onAdd();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all";

  // ── Success state — show the temp password if one was generated ──
  if (result) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-green-600" />
          </div>
          <h3 className="font-serif text-xl text-green-900 text-center mb-2">Account Created</h3>
          <p className="text-[13px] text-text-muted text-center mb-4">
            {result.user.fullName} ({result.user.email}) has been added as {result.user.role}.
          </p>
          {result.temporaryPassword && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-4">
              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1">
                Temporary Password — share this securely
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-[13px] text-amber-900 bg-white px-3 py-2 rounded-lg border border-amber-200">
                  {result.temporaryPassword}
                </code>
                <button
                  title="copy"
                  onClick={() => {
                    navigator.clipboard.writeText(result.temporaryPassword!);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-2 rounded-lg hover:bg-amber-100 transition-colors">
                  {copied ? (
                    <CheckCircle2 size={16} className="text-green-600" />
                  ) : (
                    <Copy size={16} className="text-amber-700" />
                  )}
                </button>
              </div>
            </div>
          )}
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
          <h3 className="font-serif text-xl text-green-900">Add New User</h3>
          <button title="close" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
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
              <Label>First Name *</Label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="e.g., Adebayo"
                className={inputCls}
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="e.g., Okonkwo"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <Label>Email *</Label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="user@example.com"
              className={inputCls}
            />
          </div>

          <div>
            <Label>Phone</Label>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => set("phoneNumber", e.target.value)}
              placeholder="+234..."
              className={inputCls}
            />
          </div>

          <div>
            <Label>Role *</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ROLE_CONFIG) as UserRole[]).map((role) => {
                const cfg = ROLE_CONFIG[role];
                const Icon = cfg.icon;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => set("role", role)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                      form.role === role ? "border-green-800 bg-green-50" : "border-gray-200 hover:border-green-800/30"
                    }`}>
                    <Icon size={16} style={{ color: cfg.color }} />
                    <span className="text-[12px] font-semibold text-green-900">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-[13px] text-text-muted">
            <input
              type="checkbox"
              checked={form.sendWelcomeEmail}
              onChange={(e) => set("sendWelcomeEmail", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-green-800"
            />
            Send welcome email with login instructions
          </label>
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
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Creating…" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[12px] font-semibold text-green-900 mb-1.5">{children}</label>;
}
