"use client";

import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { ArrowRight, Mail, Loader2, AlertCircle } from "lucide-react";
import * as authApi from "@/lib/api/auth";
import { extractErrorMessage } from "@/lib/api/client";

interface Props {
  email: string;
  onVerified: () => void;
}

export default function Step3Verify({ email, onVerified }: Props) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCount, setResendCount] = useState<number | null>(null);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleVerify = useCallback(async () => {
    if (digits.some((d) => !d) || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      await authApi.verifyEmail(email, digits.join(""));
      setVerified(true);
      setTimeout(onVerified, 600);
    } catch (err) {
      setError(extractErrorMessage(err));
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }, [digits, verifying, email, onVerified]);

  /* ── auto-verify when all 6 filled ── */
  useEffect(() => {
    if (digits.every((d) => d.length === 1) && !verified && !verifying) {
      setTimeout(handleVerify, 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits, verified]);

  /* ── resend countdown ── */
  useEffect(() => {
    if (resendCount === null || resendCount <= 0) return;
    const id = setTimeout(() => setResendCount((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCount]);

  function handleChange(i: number, val: string) {
    const digit = val.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    setError(null);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(i: number, e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!pasted) return;

    // If a full (or longer) code is pasted, fill from the start regardless
    // of which box it landed in. Otherwise fill starting at the focused box.
    const startIndex = pasted.length >= 6 ? 0 : i;
    const next = [...digits];
    let lastFilled = startIndex;

    for (let offset = 0; offset < pasted.length && startIndex + offset < 6; offset++) {
      next[startIndex + offset] = pasted[offset];
      lastFilled = startIndex + offset;
    }

    setDigits(next);
    setError(null);
    inputRefs.current[Math.min(lastFilled + 1, 5)]?.focus();
  }

  const allFilled = digits.every((d) => d.length === 1);

  async function startResend() {
    if (resending) return;
    setResending(true);
    setError(null);
    try {
      await authApi.resendVerification(email);
      setResendCount(30); // matches backend's resend cooldown — adjust if different
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setResending(false);
    }
  }
  return (
    <div className="[animation:fadeUp_0.4s_ease_both]">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-green-800/[0.08] border-2 border-green-800/15 flex items-center justify-center mx-auto mb-5 [animation:float_6s_ease-in-out_infinite]">
          <Mail size={36} className="text-green-700/60" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-[28px] text-green-900 leading-tight tracking-tight mb-3">
          Check your inbox
        </h2>
        <p className="text-green-700/60 text-sm leading-relaxed max-w-xs mx-auto">
          We sent a 6-digit verification code to
          <br />
          <strong className="text-green-800">{email || "your email address"}</strong>
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={16} strokeWidth={2.5} className="shrink-0" />
          {error}
        </div>
      )}

      {/* OTP inputs */}
      <div className="flex justify-center gap-3 mb-6">
        {/* FIX 5: replaced (d: any, i: any) with proper types */}
        {digits.map((d: string, i: number) => {
          return (
            <Fragment key={i}>
              <input
                title="code"
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={(e) => handlePaste(i, e)}
                className={`w-12 h-14 text-center text-xl font-bold text-green-900 rounded-xl border-2 bg-white
                           outline-none transition-all font-mono
                           ${
                             verified
                               ? "border-green-500 bg-green-50"
                               : "border-green-900/15 focus:border-green-800 focus:shadow-[0_0_0_3px_rgba(26,74,46,0.1)]"
                           }`}
              />
            </Fragment>
          );
        })}
      </div>

      {/* Verify button */}
      <button
        onClick={handleVerify}
        disabled={!allFilled || verifying}
        className="w-full py-4 bg-green-800 text-white font-bold text-[15px] rounded-xl
                   hover:bg-green-700 transition-all duration-200 hover:-translate-y-0.5
                   hover:shadow-[0_8px_24px_rgba(26,74,46,0.3)]
                   flex items-center justify-center gap-2 mb-4
                   border-none cursor-pointer
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
        {verifying ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Verifying…
          </>
        ) : (
          <>
            Verify &amp; Continue
            <ArrowRight size={16} strokeWidth={2.5} />
          </>
        )}
      </button>

      {/* Resend */}
      <div className="text-center text-sm text-green-700/50">
        Didn&apos;t receive it?{" "}
        {resendCount !== null && resendCount > 0 ? (
          <span className="text-green-700/40 font-mono text-xs ml-1">
            in <span className="font-semibold">{resendCount}</span>s
          </span>
        ) : (
          <button
            onClick={startResend}
            disabled={resending}
            className="text-green-700 font-semibold hover:text-green-800 underline underline-offset-2 transition-colors ml-1 bg-transparent border-none cursor-pointer disabled:opacity-50">
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>

      {/* No SMS fallback — verification is email-only on the backend
          today; not shown as an option since it isn't wired to anything. */}
      <div className="mt-5 p-4 rounded-xl bg-green-800/[0.05] border border-green-800/[0.12] text-center">
        <p className="text-xs text-green-700/60">
          Can&apos;t find the email? Check your spam folder.
        </p>
      </div>
    </div>
  );
}
