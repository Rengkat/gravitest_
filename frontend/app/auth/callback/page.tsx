"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import * as authApi from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/authStore";
import { extractErrorMessage } from "@/lib/api/client";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeLogin = useAuthStore((s) => s.login);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(decodeURIComponent(urlError));
      return;
    }

    const code = searchParams.get("code");
    if (!code) {
      setError("Missing sign-in code. Please try signing in again.");
      return;
    }

    authApi
      .exchangeSocialCode(code)
      .then((result) => {
        storeLogin(result.tokens.accessToken, result.tokens.refreshToken, result.user);
        // Same reasoning as RegisterClient.handleVerified: a fresh OAuth
        // signup can have isOnboarded === false, and a soft router
        // transition can replay a cached RSC response instead of letting
        // middleware re-check the just-written gt_onboarded cookie. Use a
        // full navigation and route based on the real onboarding status.
        const dest = result.user.isOnboarded === false ? "/complete-registration" : "/dashboard";
        window.location.href = dest;
      })
      .catch((err) => setError(extractErrorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="max-w-sm w-full text-center bg-white rounded-2xl border border-green-900/10 p-8">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h1 className="font-serif text-xl text-green-900 mb-2">Sign-in failed</h1>
          <p className="text-[13px] text-green-700/60 mb-6">{error}</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3 bg-green-800 text-white font-semibold text-sm rounded-xl hover:bg-green-700 transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4">
      <Loader2 size={32} className="animate-spin text-green-700" />
      <p className="text-[13px] text-green-700/60">Finishing sign-in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <Loader2 size={32} className="animate-spin text-green-700" />
        </div>
      }>
      <AuthCallbackInner />
    </Suspense>
  );
}
