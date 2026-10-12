"use client";

import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { ArrowRight } from "lucide-react";

interface Props {
  onSuccess: (name: string) => void;
}

export default function PhoneLoginForm({ onSuccess }: Props) {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [resendCount, setResendCount] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── resend countdown ── */
  useEffect(() => {
    if (resendCount === null || resendCount <= 0) return;
    const id = setTimeout(() => setResendCount((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCount]);

  // FIX: wrap in useCallback so it has a stable reference and can be safely
  // listed as a useEffect dependency without causing infinite re-renders.
  const handleAutoVerify = useCallback(() => {
    if (digits.every((d) => d.length === 1) && otpSent) {
      setTimeout(() => onSuccess("Student"), 400);
    }
  }, [digits, otpSent, onSuccess]);

  // FIX: deps array now includes all values the effect closes over.
  useEffect(() => {
    handleAutoVerify();
  }, [handleAutoVerify]);

  function sendOTP() {
    if (!phone) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSentTo("+234 " + phone);
      setOtpSent(true);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }, 1200);
  }

  function handleDigit(i: number, val: string) {
    const d = val.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  }

  const otpCls =
    "w-11 h-[52px] text-center text-lg font-bold font-mono text-green-900 rounded-xl border-2 border-green-900/15 bg-white focus:border-green-800 focus:shadow-[0_0_0_3px_rgba(26,74,46,0.1)] outline-none transition-all";

  return (
    <div>
      {/* Phone input */}
      <div className="mb-4">
        <label className="block text-[11px] font-bold text-green-900/60 mb-1.5 tracking-widest uppercase">
          Phone Number
        </label>
        <div className="flex rounded-xl overflow-hidden border-2 border-green-900/[0.12] bg-white focus-within:border-green-800 focus-within:shadow-[0_0_0_3px_rgba(26,74,46,0.1)] transition-all hover:border-green-900/20">
          <div className="flex items-center gap-2 px-3 text-sm text-green-900/70 font-semibold min-w-fit bg-green-800/[0.06] border-r border-r-green-900/15">
            🇳🇬 <span className="text-green-900/60">+234</span>
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0801 234 5678"
            className="flex-1 px-3 py-3.5 text-green-900 text-sm placeholder:text-green-900/30 font-medium outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Send OTP button */}
      <button
        onClick={sendOTP}
        disabled={sending || !phone}
        className="w-full py-3.5 bg-green-800 text-white font-bold text-sm rounded-xl hover:bg-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(26,74,46,0.25)] flex items-center justify-center gap-2 mb-4 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        {sending ? "Sending…" : "Send OTP Code"}
        {!sending && <ArrowRight size={15} strokeWidth={2.5} />}
      </button>

      {/* OTP section */}
      {otpSent && (
        <div>
          <p className="text-sm text-green-700/60 text-center mb-4">
            Enter the 6-digit code sent to <strong className="text-green-800">{sentTo}</strong>
          </p>

          <div className="flex justify-center gap-2.5 mb-4">
            {digits.map((d, i) => (
              <Fragment key={i}>
                {i === 3 && (
                  <span className="flex items-center text-green-900/20 font-bold text-lg">—</span>
                )}
                <input
                  title="enter digit"
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKey(i, e)}
                  className={otpCls}
                />
              </Fragment>
            ))}
          </div>

          <button
            onClick={() => onSuccess("Student")}
            className="w-full py-3.5 bg-green-800 text-white font-bold text-sm rounded-xl hover:bg-green-700 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(26,74,46,0.25)] mb-3 border-none cursor-pointer">
            Verify &amp; Log In →
          </button>

          <p className="text-center text-xs text-green-700/50">
            Didn&apos;t get it?{" "}
            {resendCount !== null && resendCount > 0 ? (
              <span className="text-green-700/40 ml-1 font-mono">
                in <span>{resendCount}</span>s
              </span>
            ) : (
              <button
                onClick={() => setResendCount(60)}
                className="text-green-700 font-semibold underline underline-offset-2 ml-1 bg-transparent border-none cursor-pointer">
                Resend
              </button>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
