// app/auth/accept-invite/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  Loader2,
  Shield,
  Mail,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";

interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "super_admin";
  token: string;
}

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);

  // Form state
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Verify invitation token on mount
  useEffect(() => {
    if (!token) {
      setError("No invitation token provided");
      setLoading(false);
      return;
    }

    const verifyInvitation = async () => {
      setVerifying(true);
      try {
        const response = await fetch("/api/auth/verify-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Invalid or expired invitation");
        }

        setInvitation(data.invitation);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify invitation");
      } finally {
        setVerifying(false);
        setLoading(false);
      }
    };

    verifyInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!form.acceptTerms) {
      setError("You must accept the terms and conditions");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: form.password,
          firstName: invitation?.firstName,
          lastName: invitation?.lastName,
          email: invitation?.email,
          role: invitation?.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to set up account");
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login?registered=true");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Loader2 size={32} className="text-green-700 animate-spin" />
            </div>
            <h2 className="font-serif text-xl text-green-900">
              {verifying ? "Verifying Invitation..." : "Loading..."}
            </h2>
            <p className="text-sm text-text-muted">
              {verifying ? "Please wait while we verify your invitation" : "Please wait"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (invalid/expired token)
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-red-100 rounded-full mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h2 className="font-serif text-xl text-red-700 mb-2">Invalid Invitation</h2>
            <p className="text-sm text-text-muted mb-6">{error}</p>
            <div className="space-y-3 w-full">
              <Link
                href="/auth/register"
                className="block w-full text-center py-3 bg-green-800 text-white rounded-xl font-semibold hover:bg-green-700 transition-all text-sm">
                Request New Invitation
              </Link>
              <Link
                href="/auth/login"
                className="block w-full text-center py-3 border-2 border-gray-200 rounded-xl font-semibold text-text-muted hover:bg-gray-50 transition-all text-sm">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle size={32} className="text-green-700" />
            </div>
            <h2 className="font-serif text-xl text-green-900">Account Setup Complete!</h2>
            <p className="text-sm text-text-muted">
              Your admin account has been created successfully. You'll be redirected to login
              shortly.
            </p>
            <div className="w-full bg-gray-50 rounded-xl p-4 text-left">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-green-700" />
                <span className="text-sm text-gray-700">{invitation?.email}</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Shield size={16} className="text-green-700" />
                <span className="text-sm text-gray-700 capitalize">{invitation?.role}</span>
              </div>
            </div>
            <Link
              href="/auth/login"
              className="w-full text-center py-3 bg-green-800 text-white rounded-xl font-semibold hover:bg-green-700 transition-all text-sm">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-green-100 rounded-full mb-3">
            <Shield size={28} className="text-green-700" />
          </div>
          <h1 className="font-serif text-2xl text-green-900">Complete Your Account</h1>
          <p className="text-sm text-text-muted mt-1">You've been invited to join as an admin</p>
        </div>

        {/* Invitation Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <User size={14} className="text-green-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {invitation?.firstName} {invitation?.lastName}
              </p>
              <p className="text-xs text-text-muted">{invitation?.email}</p>
            </div>
            <span className="ml-auto text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full capitalize font-medium">
              {invitation?.role}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div>
            <label className="block text-[12px] font-semibold text-green-900 mb-1.5">
              Create Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 8 characters"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-gray-700">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-text-muted mt-1">Must be at least 8 characters</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[12px] font-semibold text-green-900 mb-1.5">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-gray-700">
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={form.acceptTerms}
              onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })}
              className="w-4 h-4 mt-0.5 text-green-800 rounded border-gray-300 focus:ring-green-500"
              required
            />
            <label htmlFor="terms" className="text-[13px] text-text-muted">
              I accept the{" "}
              <Link href="/terms" className="text-green-700 hover:underline font-medium">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-green-700 hover:underline font-medium">
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-green-800 text-white font-semibold hover:bg-green-700 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Setting up account...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Complete Setup
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-text-muted mt-4">
          This invitation link will expire in 7 days
        </p>
      </div>
    </div>
  );
}
