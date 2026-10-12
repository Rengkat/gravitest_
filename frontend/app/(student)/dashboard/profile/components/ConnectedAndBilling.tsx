"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, CreditCard, Crown, AlertTriangle, X, Trash2, Loader2, ArrowUpRight } from "lucide-react";
import * as profileApi from "@/lib/api/profile";
import * as billingApi from "@/lib/api/billing";
import { extractErrorMessage } from "@/lib/api/client";

// ── Social icons ──────────────────────────────────────────────────────────────

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// ── Connected Accounts ────────────────────────────────────────────────────────
// The backend has Google/Facebook Passport strategies implemented
// (src/auth/strategies/google.strategy.ts, facebook.strategy.ts) but no
// controller routes wire them up to an actual OAuth redirect/callback
// flow yet — so there's no real "Connect" action to call. This shows real,
// read-only status (which provider the account was created with) instead
// of interactive buttons that would call nothing.

export function ConnectedAccountsSection() {
  const [authProvider, setAuthProvider] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    profileApi
      .getMe()
      .then((u) => setAuthProvider((u as any).authProvider ?? "local"))
      .catch(() => setAuthProvider("local"))
      .finally(() => setIsLoading(false));
  }, []);

  const providers = [
    { id: "google", name: "Google", icon: GoogleIcon },
    { id: "facebook", name: "Facebook", icon: FacebookIcon },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6">
        <h3 className="text-[16px] font-bold text-gray-900">Connected Accounts</h3>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {isLoading
            ? "Loading…"
            : authProvider === "local"
              ? "Your account signs in with email and password."
              : `Your account signs in with ${authProvider}.`}
        </p>
      </div>

      <div className="space-y-3">
        {providers.map(({ id, name, icon: Icon }) => {
          const connected = authProvider === id;
          return (
            <div
              key={id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                connected ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"
              }`}>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm shrink-0">
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-gray-800">{name}</p>
                  <p className="text-[12px] text-gray-500">
                    {connected ? "This is how you sign in" : "Not connected"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {connected ? (
                  <span className="text-[11px] font-bold text-green-700 flex items-center gap-1">
                    <CheckCircle size={11} /> Active
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-gray-400 px-3 py-1.5">
                    Not available yet
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400 mt-4">
        Social sign-in is set once at registration. Switching providers isn't supported yet.
      </p>
    </div>
  );
}

// ── Billing (summary + account danger zone) ──────────────────────────────────
// Full billing management (plans, invoices, payment methods, transaction
// history) lives at /dashboard/billing — this stays a lightweight summary
// with a deep link, rather than a second parallel implementation of the
// same real data.

export function BillingSection() {
  const [subscription, setSubscription] = useState<billingApi.BackendSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    billingApi
      .getMySubscription()
      .then(setSubscription)
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await profileApi.deactivateAccount();
      window.location.href = "/";
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
      setIsDeleting(false);
    }
  };

  const isFree = !subscription || subscription.tier === "free";

  return (
    <div className="space-y-5">
      {/* Current plan summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] font-bold text-gray-900">Current Plan</h3>
          {!isFree && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
              ✓ Active
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shrink-0">
              <Crown size={22} className="text-white" />
            </div>
            <div>
              <p className="text-[20px] font-black text-gray-900">
                {isFree ? "Free Plan" : `${subscription!.tier[0].toUpperCase()}${subscription!.tier.slice(1)} Plan`}
              </p>
              <p className="text-[13px] text-gray-500">
                {isFree
                  ? "Upgrade for full access to all features"
                  : `Renews ${subscription!.expiresAt ? new Date(subscription!.expiresAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" }) : "—"}`}
              </p>
            </div>
          </div>
        )}

        <Link
          href="/dashboard/billing"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 text-white rounded-xl text-[13px] font-bold hover:bg-green-700 shadow-sm transition-colors">
          Manage Billing & Subscription <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Danger zone */}
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <h3 className="text-[15px] font-bold text-red-800">Danger Zone</h3>
        </div>
        <p className="text-[13px] text-red-600 mb-4">
          Deactivate your account. Your data is retained but your access is suspended immediately —
          contact support if you'd like it fully deleted.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-[13px] font-bold hover:bg-red-700 transition-colors shadow-sm">
          <Trash2 size={14} />
          Deactivate Account
        </button>
      </div>

      {/* Confirm Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-red-600 px-6 py-5">
              <h3 className="text-[17px] font-black text-white">Deactivate Your Account</h3>
              <p className="text-red-200 text-[13px] mt-1">You'll be signed out immediately</p>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-5 text-[13px] text-gray-700">
                <p className="flex items-start gap-2">
                  <X size={14} className="text-red-500 mt-0.5 shrink-0" /> You'll be logged out of
                  every device
                </p>
                <p className="flex items-start gap-2">
                  <X size={14} className="text-red-500 mt-0.5 shrink-0" /> Your subscription will not
                  be refunded
                </p>
                <p className="flex items-start gap-2">
                  <X size={14} className="text-red-500 mt-0.5 shrink-0" /> Contact support to
                  reactivate or fully delete your data
                </p>
              </div>

              {deleteError && (
                <p className="text-[12px] text-red-600 mb-3">{deleteError}</p>
              )}

              <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2.5 rounded-xl border border-red-200 text-[14px] focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20 font-mono"
              />
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                  setDeleteError(null);
                }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-[14px] font-semibold text-gray-600 hover:bg-gray-50">
                Keep Account
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== "DELETE" || isDeleting}
                className="flex-[2] py-2.5 bg-red-600 text-white rounded-xl text-[14px] font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {isDeleting ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
