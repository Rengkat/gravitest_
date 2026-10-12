"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Lock as LockIcon,
  Shield,
  CreditCard,
} from "lucide-react";
import * as authApi from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/authStore";
import { extractErrorMessage } from "@/lib/api/client";

interface Props {
  onSuccess: (name: string) => void;
  onForgot: () => void;
  onError: (message: string) => void;
  error: { title: string; desc: string } | null;
  onClearError: () => void;
}

export default function EmailLoginForm({ onSuccess, onForgot, onError, onClearError }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const storeLogin = useAuthStore((s) => s.login);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr("Please enter a valid email address");
      valid = false;
    }
    if (!password || password.length < 6) {
      setPasswordErr("Password must be at least 6 characters");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    onClearError();

    try {
      const result = await authApi.login(email, password);
      storeLogin(result.tokens.accessToken, result.tokens.refreshToken, result.user);
      onSuccess(result.user.firstName);
    } catch (err) {
      onError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "w-full bg-white text-green-900 text-sm placeholder:text-green-900/30 font-medium outline-none transition-all duration-200 py-3.5 rounded-xl border-[1.5px]";
  const inputOk =
    "border-green-900/15 focus:border-green-800 focus:shadow-[0_0_0_3px_rgba(26,74,46,0.1)]";
  const inputErr = "border-red-400 shadow-[0_0_0_3px_rgba(230,57,70,0.1)]";

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Email */}
      <div className="mb-4">
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
            className={`${inputBase} pl-11 pr-4 ${emailErr ? inputErr : inputOk}`}
          />
        </div>
        {emailErr && <p className="text-xs text-red-500 mt-1.5 ml-1">{emailErr}</p>}
      </div>

      {/* Password */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-bold text-green-900/60 tracking-widest uppercase">
            Password
          </label>
          <button
            type="button"
            onClick={onForgot}
            className="text-xs font-semibold text-green-700 hover:text-green-800 underline underline-offset-2 transition-colors bg-transparent border-none cursor-pointer p-0">
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-700/30 pointer-events-none">
            <Lock size={16} strokeWidth={1.8} />
          </div>
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordErr("");
            }}
            placeholder="Enter your password"
            className={`${inputBase} pl-11 pr-12 ${passwordErr ? inputErr : inputOk}`}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-green-700/35 hover:text-green-800 transition-colors bg-transparent border-none cursor-pointer p-0">
            {showPw ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
          </button>
        </div>
        {passwordErr && <p className="text-xs text-red-500 mt-1.5 ml-1">{passwordErr}</p>}
      </div>

      {/* Remember me */}
      <div className="flex items-center justify-between mb-6">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="g-checkbox"
          />
          <span className="text-sm text-green-900/60 font-medium">Keep me logged in</span>
        </label>
        <span className="text-xs text-green-700/40 font-mono bg-green-900/5 px-2 py-1 rounded-lg">
          30 days
        </span>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="relative w-full py-4 bg-green-800 text-white font-bold text-[15px] rounded-xl
                   hover:bg-green-700 active:bg-green-900 transition-all duration-200
                   hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(26,74,46,0.3)]
                   flex items-center justify-center gap-2 overflow-hidden mb-4
                   border-none cursor-pointer
                   disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                   after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/12 after:to-transparent after:pointer-events-none">
        {loading ? (
          <>
            <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="white"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="white"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Logging in…
          </>
        ) : (
          <>
            Log In
            <ArrowRight size={16} strokeWidth={2.5} />
          </>
        )}
      </button>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-5 mt-5 pt-5 border-t border-green-900/[0.08]">
        {[
          { Icon: LockIcon, label: "256-bit SSL" },
          { Icon: Shield, label: "NDPR Compliant" },
          { Icon: CreditCard, label: "No card needed" },
        ].map(({ Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px] text-green-700/35">
            <Icon size={11} strokeWidth={2} />
            {label}
          </div>
        ))}
      </div>
    </form>
  );
}
