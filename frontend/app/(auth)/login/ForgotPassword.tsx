"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Check } from "lucide-react";
import * as authApi from "@/lib/api/auth";
import { extractErrorMessage } from "@/lib/api/client";

interface Props {
  // Both optional so this same component can be rendered either inline
  // in the login card (passes onBack to flip back to the login view) or
  // as the standalone /forgot-password page (falls back to router
  // navigation — there is no parent view to "go back" to).
  onBack?: () => void;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

type Stage = "request" | "reset" | "done";

export default function ForgotPassword({ onBack }: Props) {
  const router = useRouter();
  const goBack = onBack ?? (() => router.push("/login"));

  const [stage, setStage] = useState<Stage>("request");
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [requesting, setRequesting] = useState(false);

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);

  async function sendReset() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr("Please enter a valid email address");
      return;
    }
    setRequesting(true);
    setEmailErr("");
    try {
      await authApi.forgotPassword(email);
      setStage("reset");
    } catch (err) {
      // The backend intentionally returns a generic success message even
      // for unknown emails (prevents account enumeration) — a thrown
      // error here means something else went wrong (network, rate limit).
      setEmailErr(extractErrorMessage(err));
    } finally {
      setRequesting(false);
    }
  }

  async function resendCode() {
    if (resending || resendCount > 0) return;
    setResending(true);
    try {
      await authApi.forgotPassword(email);
      setResendCount(60);
      const tick = () => setResendCount((c) => (c > 0 ? c - 1 : 0));
      const id = setInterval(() => {
        tick();
      }, 1000);
      setTimeout(() => clearInterval(id), 60_000);
    } catch (err) {
      setResetError(extractErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  async function submitReset() {
    setResetError(null);
    if (!/^\d{6}$/.test(code)) {
      setResetError("Enter the 6-digit code from your email");
      return;
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      setResetError(
        "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }
    setResetting(true);
    try {
      await authApi.resetPassword(email, code, newPassword);
      setStage("done");
    } catch (err) {
      setResetError(extractErrorMessage(err));
    } finally {
      setResetting(false);
    }
  }

  /* ── Stage: done ── */
  if (stage === "done") {
    return (
      <div className="text-center [animation:fadeUp_0.4s_ease_both]">
        <div className="w-20 h-20 rounded-3xl bg-green-500/10 border-2 border-green-500/20 flex items-center justify-center mx-auto mb-6">
          <Check size={32} strokeWidth={2.5} className="text-green-600" />
        </div>
        <h2 className="font-serif text-[28px] text-green-900 leading-tight mb-3">
          Password reset
        </h2>
        <p className="text-green-700/55 text-sm leading-relaxed mb-8 max-w-[280px] mx-auto">
          Your password has been updated. You can now log in with your new password.
        </p>
        <button
          onClick={goBack}
          className="w-full py-3.5 bg-green-800 text-white font-bold text-sm rounded-xl hover:bg-green-700 transition-all duration-200">
          Back to Login
        </button>
      </div>
    );
  }

  /* ── Stage: reset (code + new password) ── */
  if (stage === "reset") {
    return (
      <div className="[animation:fadeUp_0.4s_ease_both]">
        <button
          onClick={() => setStage("request")}
          className="flex items-center gap-1.5 text-sm text-green-700/55 hover:text-green-800 transition-colors mb-6 group bg-transparent border-none cursor-pointer p-0">
          <ArrowLeft size={14} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <div className="mb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-800/[0.08] border-2 border-green-800/[0.12] flex items-center justify-center mx-auto mb-5">
            <Lock size={28} strokeWidth={1.5} className="text-green-700" />
          </div>
          <h2 className="font-serif text-[26px] text-green-900 leading-tight tracking-tight mb-2">
            Enter your code
          </h2>
          <p className="text-green-700/55 text-sm max-w-[300px] mx-auto">
            We sent a 6-digit code to <span className="font-bold text-green-800">{email}</span>
          </p>
        </div>

        {resetError && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
            <AlertCircle size={16} strokeWidth={2.5} className="shrink-0" />
            {resetError}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-[11px] font-bold text-green-900/60 mb-1.5 tracking-widest uppercase">
            Verification Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-full px-4 py-3.5 rounded-xl bg-white text-green-900 text-center text-lg tracking-[0.5em] font-mono font-bold outline-none transition-all duration-200 border-[1.5px] border-green-900/15 focus:border-green-800 focus:shadow-[0_0_0_3px_rgba(26,74,46,0.1)]"
          />
        </div>

        <div className="mb-4">
          <label className="block text-[11px] font-bold text-green-900/60 mb-1.5 tracking-widest uppercase">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-4 pr-11 py-3.5 rounded-xl bg-white text-green-900 text-sm outline-none transition-all duration-200 border-[1.5px] border-green-900/15 focus:border-green-800 focus:shadow-[0_0_0_3px_rgba(26,74,46,0.1)]"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-green-700/40 bg-transparent border-none cursor-pointer">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-[11px] font-bold text-green-900/60 mb-1.5 tracking-widest uppercase">
            Confirm New Password
          </label>
          <input
            type={showPw ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3.5 rounded-xl bg-white text-green-900 text-sm outline-none transition-all duration-200 border-[1.5px] border-green-900/15 focus:border-green-800 focus:shadow-[0_0_0_3px_rgba(26,74,46,0.1)]"
          />
        </div>

        <button
          onClick={submitReset}
          disabled={resetting}
          className="w-full py-4 bg-green-800 text-white font-bold text-[15px] rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 mb-4 disabled:opacity-60">
          {resetting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Resetting…
            </>
          ) : (
            "Reset Password"
          )}
        </button>

        <p className="text-xs text-center text-green-700/40">
          Didn&apos;t get a code?{" "}
          <button
            onClick={resendCode}
            disabled={resending || resendCount > 0}
            className="text-green-700 font-semibold underline underline-offset-2 ml-1 bg-transparent border-none cursor-pointer disabled:opacity-50">
            {resendCount > 0 ? `Resend in ${resendCount}s` : resending ? "Sending…" : "Resend"}
          </button>
        </p>
      </div>
    );
  }

  /* ── Stage: request ── */
  return (
    <div className="[animation:fadeUp_0.4s_ease_both]">
      <button
        onClick={goBack}
        className="flex items-center gap-1.5 text-sm text-green-700/55 hover:text-green-800 transition-colors mb-6 group bg-transparent border-none cursor-pointer p-0">
        <ArrowLeft size={14} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to login
      </button>

      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-green-800/[0.08] border-2 border-green-800/[0.12] flex items-center justify-center mx-auto mb-5">
          <Mail size={28} strokeWidth={1.5} className="text-green-700" />
        </div>
        <h2 className="font-serif text-[28px] text-green-900 leading-tight tracking-tight mb-2 text-center">
          Reset your password
        </h2>
        <p className="text-green-700/55 text-sm text-center max-w-[300px] mx-auto">
          Enter your email address and we&apos;ll send you a 6-digit code.
        </p>
      </div>

      <div className="mb-5">
        <label className="block text-[11px] font-bold text-green-900/60 mb-1.5 tracking-widest uppercase">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-700/30 pointer-events-none">
            <Mail size={16} strokeWidth={1.8} />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailErr("");
            }}
            placeholder="adaeze@example.com"
            className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-green-900 text-sm placeholder:text-green-900/30 font-medium outline-none transition-all duration-200 border-[1.5px] ${emailErr ? "border-red-400 shadow-[0_0_0_3px_rgba(230,57,70,0.1)]" : "border-green-900/15 focus:border-green-800 focus:shadow-[0_0_0_3px_rgba(26,74,46,0.1)]"}`}
          />
        </div>
        {emailErr && <p className="text-xs text-red-500 mt-1.5 ml-1">{emailErr}</p>}
      </div>

      <button
        onClick={sendReset}
        disabled={requesting}
        className="relative w-full py-4 bg-green-800 text-white font-bold text-[15px] rounded-xl hover:bg-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(26,74,46,0.3)] flex items-center justify-center gap-2 overflow-hidden mb-4 border-none cursor-pointer">
        {requesting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Sending…
          </>
        ) : (
          "Send Reset Code"
        )}
      </button>

      <p className="text-xs text-center text-green-700/40">
        Remember your password?{" "}
        <button
          onClick={goBack}
          className="text-green-700 font-semibold underline underline-offset-2 ml-1 bg-transparent border-none cursor-pointer">
          Log in
        </button>
      </p>
    </div>
  );
}
