"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck, Lock, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import * as adminInvitesApi from "@/lib/api/admin-invites";
import { useAuthStore } from "@/lib/store/authStore";
import { extractErrorMessage } from "@/lib/api/client";
import { getStrength } from "@/utils/registerUtils";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

type LoadState = "loading" | "valid" | "invalid";

export default function AdminOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const storeLogin = useAuthStore((s) => s.login);

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [invite, setInvite] = useState<adminInvitesApi.ValidateAdminInviteResponse | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadState("invalid");
      setLoadError("This invite link is missing its token. Please use the exact link from your email.");
      return;
    }

    adminInvitesApi
      .validateAdminInvite(token)
      .then((res) => {
        setInvite(res);
        setLoadState("valid");
      })
      .catch((err) => {
        setLoadError(extractErrorMessage(err));
        setLoadState("invalid");
      });
  }, [token]);

  const { score: pwScore, label: pwLabel } = getStrength(password);
  const strengthColors = ["bg-green-900/10", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];

  const passwordValid = PASSWORD_REGEX.test(password);
  const confirmValid = confirm.length > 0 && confirm === password;
  const canSubmit = passwordValid && confirmValid && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await adminInvitesApi.acceptAdminInvite(token, password);
      storeLogin(result.tokens.accessToken, result.tokens.refreshToken, result.user);
      router.push("/admin");
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = (hasError: boolean) =>
    `w-full px-4 py-3.5 rounded-xl bg-white text-green-900 text-sm placeholder:text-green-900/30 font-medium outline-none transition-all duration-200 border-[1.5px]
     ${
       hasError
         ? "border-red-400 shadow-[0_0_0_3px_rgba(230,57,70,0.1)]"
         : "border-green-900/15 focus:border-green-800 focus:shadow-[0_0_0_3px_rgba(26,74,46,0.1)]"
     }`;

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_20px_60px_rgba(13,43,26,0.08)] p-8">
        {loadState === "loading" && (
          <div className="flex flex-col items-center py-10 text-green-800/70">
            <Loader2 size={28} className="animate-spin mb-3" />
            <p className="text-sm font-medium">Checking your invite link…</p>
          </div>
        )}

        {loadState === "invalid" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle size={26} className="text-red-500" />
            </div>
            <h1 className="font-serif text-xl text-green-900 mb-2">This invite link isn't valid</h1>
            <p className="text-sm text-green-700/60 mb-6">
              {loadError ?? "It may have expired, already been used, or been revoked. Ask a super admin to send you a new one."}
            </p>
            <Link
              href="/login"
              className="w-full py-3 rounded-xl bg-green-800 text-white font-semibold hover:bg-green-700 transition-all text-sm text-center">
              Go to login
            </Link>
          </div>
        )}

        {loadState === "valid" && invite && (
          <div className="[animation:fadeUp_0.4s_ease_both]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-800/[0.08] border border-green-800/15 text-green-700 text-xs font-semibold mb-4">
              <ShieldCheck size={13} strokeWidth={2} />
              {invite.role === "super_admin" ? "Super Admin Invite" : "Admin Invite"}
            </div>

            <h1 className="font-serif text-[26px] text-green-900 leading-tight tracking-tight mb-2">
              Welcome, {invite.firstName}
            </h1>
            <p className="text-green-700/60 text-sm mb-6">
              You've been invited to join the Gravitest admin team as{" "}
              <span className="font-semibold text-green-900">{invite.email}</span>. Set a password to finish
              setting up your account.
            </p>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600 font-medium">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-green-900/60 mb-1.5 tracking-widest uppercase">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-700/30 pointer-events-none">
                    <Lock size={16} strokeWidth={1.8} />
                  </div>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className={`${inputCls(password.length > 0 && !passwordValid)} pl-11 pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-green-700/40 hover:text-green-800 bg-transparent border-none cursor-pointer">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${i <= pwScore ? strengthColors[pwScore] : "bg-green-900/10"}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-green-700/60 mt-1.5">{pwLabel}</p>
                  </>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-[11px] font-bold text-green-900/60 mb-1.5 tracking-widest uppercase">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-700/30 pointer-events-none">
                    <Lock size={16} strokeWidth={1.8} />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    className={`${inputCls(confirm.length > 0 && !confirmValid)} pl-11 pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-green-700/40 hover:text-green-800 bg-transparent border-none cursor-pointer">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm.length > 0 && !confirmValid && (
                  <p className="text-xs text-red-500 mt-1.5 ml-1">Passwords don't match</p>
                )}
                {confirmValid && (
                  <p className="text-xs text-green-600 mt-1.5 ml-1 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Passwords match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3.5 rounded-xl bg-green-800 text-white font-semibold hover:bg-green-700 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Setting up your account…
                  </>
                ) : (
                  "Accept invite & set up account"
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
