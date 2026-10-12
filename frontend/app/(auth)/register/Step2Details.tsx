"use client";

import { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  Shield,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import {
  buildSchema,
  EXAM_TARGETS,
  FieldLabel,
  getStrength,
  ROLE_CONFIG,
  toBackendRole,
  toNigerianE164,
} from "@/utils/registerUtils";
import { RoleId } from "@/types/registerType";
import Link from "next/link";
import * as authApi from "@/lib/api/auth";
import { extractErrorMessage } from "@/lib/api/client";

/* ─── Zod schema factory (role-aware) ───────────────────────── */
type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1.5 ml-1">{msg}</p>;
}

/* ─── Component ──────────────────────────────────────────────── */
interface Props {
  role: RoleId;
  onBack: () => void;
  onSubmit: (email: string, password: string) => void;
}

export default function Step2Details({ role, onBack, onSubmit }: Props) {
  const cfg = ROLE_CONFIG[role];
  const { Icon: RoleIcon } = cfg;
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [providers, setProviders] = useState<authApi.AvailableProviders | null>(null);

  useEffect(() => {
    authApi
      .getAvailableProviders()
      .then(setProviders)
      .catch(() => setProviders({ google: false, facebook: false }));
  }, []);

  /* ── React Hook Form ── */
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(buildSchema(cfg)),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      subject: "",
      examTarget: "",
      password: "",
      confirm: "",
      agreeTerms: undefined,
      agreeMarketing: false,
    },
  });

  const passwordVal = useWatch({ control, name: "password" }) ?? "";
  const emailVal = useWatch({ control, name: "email" }) ?? "";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);

  const { score: pwScore, label: pwLabel } = getStrength(passwordVal);

  /* ── Strength bar colours — static literals, indexed by score ── */
  const strengthColors = [
    "bg-green-900/10",
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-500",
  ];

  /* ── Submit ── */
  async function onValid(data: FormValues) {
    setLoading(true);
    setSubmitError(null);

    const normalizedPhone = data.phone ? toNigerianE164(data.phone) : null;
    if (data.phone && !normalizedPhone) {
      // Defense in depth — the Zod schema should already have caught this,
      // but never silently drop a phone number the user typed.
      setSubmitError("Enter a valid Nigerian number, e.g. 0801 234 5678");
      setLoading(false);
      return;
    }

    try {
      await authApi.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: toBackendRole(role),
        phoneNumber: normalizedPhone ?? undefined,
      });
      onSubmit(data.email, data.password);
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  /* ── Input class helper ── */
  const inputCls = (hasError: boolean) =>
    `w-full px-4 py-3.5 rounded-xl bg-white text-green-900 text-sm placeholder:text-green-900/30 font-medium outline-none transition-all duration-200 border-[1.5px]
     ${
       hasError
         ? "border-red-400 shadow-[0_0_0_3px_rgba(230,57,70,0.1)]"
         : "border-green-900/15 focus:border-green-800 focus:shadow-[0_0_0_3px_rgba(26,74,46,0.1)]"
     }`;

  return (
    <div className="[animation:fadeUp_0.4s_ease_both]">
      {/* ── Header ── */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-green-700/60 hover:text-green-800 transition-colors mb-4 group bg-transparent border-none cursor-pointer p-0">
          <ArrowLeft
            size={14}
            strokeWidth={2.5}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-800/[0.08] border border-green-800/15 text-green-700 text-xs font-semibold mb-3">
          <RoleIcon size={13} strokeWidth={2} />
          {cfg.label}
        </div>

        <h2 className="font-serif text-[28px] text-green-900 leading-tight tracking-tight mb-2">
          {cfg.heading}
        </h2>
        <p className="text-green-700/60 text-sm">{cfg.sub}</p>
      </div>

      {/* ── OAuth ──
          Registering via Google/Facebook is the same backend flow as
          logging in with them (find-or-create on the OAuth callback) —
          same URLs as the login page, gated the same way on whether each
          provider is actually configured server-side. */}
      <div className="flex flex-col gap-3 mb-6">
        <button
          type="button"
          onClick={() => (window.location.href = authApi.getGoogleLoginUrl())}
          disabled={!providers?.google}
          title={providers?.google ? undefined : "Google sign-in isn't configured on this server"}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border-2 border-green-900/[0.12] bg-white font-semibold text-green-900 text-sm hover:border-green-900/25 hover:bg-green-50/50 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(13,43,26,0.12)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none">
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => (window.location.href = authApi.getFacebookLoginUrl())}
          disabled={!providers?.facebook}
          title={providers?.facebook ? undefined : "Facebook sign-in isn't configured on this server"}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border-2 border-green-900/[0.12] bg-white font-semibold text-green-900 text-sm hover:border-green-900/25 hover:bg-green-50/50 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(13,43,26,0.12)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Continue with Facebook
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-green-900/10" />
        <span className="text-xs text-green-700/40 font-semibold tracking-widest uppercase">
          or with email
        </span>
        <div className="flex-1 h-px bg-green-900/10" />
      </div>

      {/* Error banner */}
      {submitError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 mb-5">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle size={14} strokeWidth={2.5} className="text-red-500" />
          </div>
          <p className="text-red-600 text-sm font-medium">{submitError}</p>
        </div>
      )}

      {/* ── Form ── */}
      <form onSubmit={handleSubmit(onValid)} noValidate>
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <FieldLabel text="First Name" />
            <input
              {...register("firstName")}
              type="text"
              placeholder="Adaeze"
              className={inputCls(!!errors.firstName)}
            />
            <FieldError msg={errors.firstName?.message} />
          </div>
          <div>
            <FieldLabel text="Last Name" />
            <input
              {...register("lastName")}
              type="text"
              placeholder="Okonkwo"
              className={inputCls(!!errors.lastName)}
            />
            <FieldError msg={errors.lastName?.message} />
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <FieldLabel text="Email Address" />
          <div className="relative">
            <input
              {...register("email")}
              type="email"
              placeholder="adaeze@example.com"
              className={`${inputCls(!!errors.email)} pr-10`}
            />
            {emailValid && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500">
                <Check size={16} strokeWidth={2.5} />
              </div>
            )}
          </div>
          <FieldError msg={errors.email?.message} />
        </div>

        {/* Phone */}
        <div className="mb-4">
          <FieldLabel text="Phone Number" hint="(optional)" />
          <div className="flex rounded-xl overflow-hidden border-2 border-green-900/[0.12] bg-white hover:border-green-900/20 focus-within:border-green-800 focus-within:shadow-[0_0_0_3px_rgba(26,74,46,0.1)] transition-all">
            <div className="flex items-center gap-2 px-3 text-sm text-green-900/70 font-semibold min-w-fit bg-green-800/[0.06] border-r border-r-green-900/15">
              🇳🇬 <span>+234</span>
            </div>
            <input
              {...register("phone")}
              type="tel"
              placeholder="0801 234 5678"
              aria-invalid={!!errors.phone}
              className="flex-1 px-3 py-3.5 text-green-900 text-sm placeholder:text-green-900/30 font-medium outline-none bg-transparent"
            />
          </div>
          <FieldError msg={errors.phone?.message} />
        </div>

        {/* Subject (teacher) */}
        {cfg.showSubject && (
          <div className="mb-4">
            <FieldLabel text="Primary Subject(s)" />
            <select
              {...register("subject")}
              title="subject"
              className={`${inputCls(!!errors.subject)} appearance-none cursor-pointer`}>
              <option value="">Select your main subject</option>
              <optgroup label="Sciences">
                <option>Physics</option>
                <option>Chemistry</option>
                <option>Biology</option>
                <option>Further Mathematics</option>
              </optgroup>
              <optgroup label="Arts & Social Sciences">
                <option>English Language</option>
                <option>Literature</option>
                <option>Government</option>
                <option>Economics</option>
                <option>Geography</option>
              </optgroup>
              <optgroup label="Commercial">
                <option>Commerce</option>
                <option>Accounting</option>
              </optgroup>
              <optgroup label="Professional">
                <option>ICAN</option>
                <option>Nursing</option>
              </optgroup>
            </select>
            <FieldError msg={errors.subject?.message} />
          </div>
        )}

        {/* Exam target (student/professional) */}
        {/* {cfg.showExamTarget && (
          <div className="mb-4">
            <FieldLabel text="Primary Exam Target" />
            <Controller
              name="examTarget"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-2">
                  {EXAM_TARGETS.map(({ value, label, Icon: ExamIcon }) => (
                    <label
                      key={value}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-semibold cursor-pointer transition-all
                        ${
                          field.value === value
                            ? "border-green-800 bg-green-800/5 text-green-800"
                            : "border-green-900/10 bg-white text-green-900/60 hover:border-green-800/30 hover:bg-green-50"
                        }`}>
                      <input
                        type="radio"
                        value={value}
                        checked={field.value === value}
                        onChange={() => field.onChange(value)}
                        className="sr-only"
                      />
                      <ExamIcon size={13} strokeWidth={2} />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            />
            <FieldError msg={errors.examTarget?.message} />
          </div>
        )} */}

        {/* Password */}
        <div className="mb-2">
          <FieldLabel text="Password" />
          <div className="relative">
            <input
              {...register("password")}
              type={showPw ? "text" : "password"}
              placeholder="Minimum 8 characters"
              className={`${inputCls(!!errors.password)} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-900/30 hover:text-green-800 transition-colors p-1 bg-transparent border-none cursor-pointer">
              {showPw ? (
                <EyeOff size={18} strokeWidth={1.8} />
              ) : (
                <Eye size={18} strokeWidth={1.8} />
              )}
            </button>
          </div>
          <FieldError msg={errors.password?.message} />
        </div>

        {/* Strength bars */}
        <div className="mb-4">
          <div className="flex gap-1.5 mb-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-400 ${
                  i < pwScore ? strengthColors[pwScore] : "bg-green-900/10"
                }`}
              />
            ))}
          </div>
          {pwLabel && <p className="text-[11px] text-green-700/50">{pwLabel}</p>}
        </div>

        {/* Confirm password */}
        <div className="mb-5">
          <FieldLabel text="Confirm Password" />
          <div className="relative">
            <input
              {...register("confirm")}
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter your password"
              className={`${inputCls(!!errors.confirm)} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-900/30 hover:text-green-800 transition-colors p-1 bg-transparent border-none cursor-pointer">
              {showConfirm ? (
                <EyeOff size={18} strokeWidth={1.8} />
              ) : (
                <Eye size={18} strokeWidth={1.8} />
              )}
            </button>
          </div>
          <FieldError msg={errors.confirm?.message} />
        </div>

        {/* Agreements */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input {...register("agreeTerms")} type="checkbox" className="g-checkbox mt-0.5" />
              <span className="text-[13px] text-green-900/60 leading-relaxed">
                I agree to Gravitest&apos;s{" "}
                <Link
                  href="/terms"
                  className="text-green-700 font-semibold hover:text-green-800 underline underline-offset-2">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-green-700 font-semibold hover:text-green-800 underline underline-offset-2">
                  Privacy Policy
                </Link>
              </span>
            </label>
            <FieldError msg={errors.agreeTerms?.message} />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input {...register("agreeMarketing")} type="checkbox" className="g-checkbox mt-0.5" />
            <span className="text-[13px] text-green-900/60 leading-relaxed">
              Send me JAMB tips, study reminders, and exam date alerts via WhatsApp &amp; email
            </span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-green-800 text-white font-bold text-[15px] rounded-xl
                     hover:bg-green-700 active:bg-green-900 transition-all duration-200
                     hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(26,74,46,0.3)]
                     flex items-center justify-center gap-2 relative overflow-hidden group
                     border-none cursor-pointer
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
          <span className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
              Creating account…
            </>
          ) : (
            <>
              Create Account
              <ArrowRight size={16} strokeWidth={2.5} />
            </>
          )}
        </button>
      </form>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-6 mt-5 pt-5 border-t border-green-900/[0.08]">
        {[
          { Icon: Lock, label: "SSL Secured" },
          { Icon: Shield, label: "Data Protected" },
          { Icon: CreditCard, label: "No Card Needed" },
        ].map(({ Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-green-700/40">
            <Icon size={12} strokeWidth={2} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
