import type { Metadata } from "next";
import ForgotPassword from "../login/ForgotPassword";

export const metadata: Metadata = {
  title: "Reset Your Password | Gravitest",
  description: "Reset your Gravitest account password.",
  robots: { index: false, follow: false },
};

// Reuses the same component rendered inline inside the login card
// (app/(auth)/login/ForgotPassword.tsx) so the request → code → new
// password flow is defined in exactly one place. Called with no props
// here — it falls back to router navigation for "back to login" since
// there's no parent login view to flip back to on this standalone route.
export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[var(--shadow-card)] p-8">
        <ForgotPassword />
      </div>
    </div>
  );
}
