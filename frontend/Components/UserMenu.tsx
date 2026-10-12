"use client";

import { ChevronDown, CreditCard, LogOut, User, UserCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { performLogout } from "@/lib/api/auth";

type UserMenuProps = {
  userMenuOpen: boolean;
  setUserMenuOpen: (open: boolean) => void;
};

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

const UserMenu = ({ userMenuOpen, setUserMenuOpen }: UserMenuProps) => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [loggingOut, setLoggingOut] = useState(false);
  const isAdmin = !!user && ADMIN_ROLES.has(user.role);

  // There's no dedicated /admin/profile route yet — /dashboard/profile
  // already handles admin accounts gracefully (it skips the
  // student-only academic-profile fetch for them), so both roles land
  // here until a dedicated admin profile page exists.
  const profileHref = "/dashboard/profile";
  const billingHref = "/dashboard/billing";

  async function handleLogout() {
    setLoggingOut(true);
    setUserMenuOpen(false);
    await performLogout();
    router.replace("/login");
  }

  return (
    <div className="relative">
      <button
        title="user menu"
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-cream transition-colors">
        <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center">
          <User size={14} className="text-white" />
        </div>
        <ChevronDown size={14} className="text-text-muted" />
      </button>
      {userMenuOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border p-2 z-50">
          {user && (
            <div className="px-3 py-2 mb-1 border-b border-cream-border">
              <p className="text-[13px] font-semibold text-green-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] text-text-muted truncate">{user.email}</p>
            </div>
          )}

          <Link
            href={profileHref}
            onClick={() => setUserMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] hover:bg-cream transition-colors">
            <UserCircle size={14} /> Profile
          </Link>

          {/* Billing is a student/professional concept — admins manage
              transactions, not their own subscription, so this is hidden
              for admin/super_admin roles rather than pointing at a page
              that doesn't apply to them. */}
          {!isAdmin && (
            <Link
              href={billingHref}
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] hover:bg-cream transition-colors">
              <CreditCard size={14} /> Billing
            </Link>
          )}

          <div className="h-px my-1 bg-cream-border" />
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
            {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
